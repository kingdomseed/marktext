import { describe, it, expect } from 'vitest'
import ContentState from 'muya/lib/contentState'
import EventCenter from 'muya/lib/eventHandler/event'
import { MUYA_DEFAULT_OPTION } from 'muya/lib/config'
import {
  computeMarker,
  markerWidth,
  indentForDepth,
  depthFromIndent,
  markerMatchesDepth,
  walkOutlineGroups
} from 'muya/lib/utils/outlineUtils'

interface BlockStub {
  type: string
  depth?: number
  groupStart?: boolean
  start?: number
}

const createMuyaContext = () => {
  const ctx = {
    options: Object.assign({}, MUYA_DEFAULT_OPTION),
    eventCenter: new EventCenter()
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(ctx as any).contentState = new ContentState(ctx, ctx.options)
  return ctx
}

describe('outlineUtils', () => {
  it('computeMarker at depth 1, first sibling → I.', () => {
    expect(computeMarker({ depth: 1 }, { siblingIndex: 0 })).to.equal('I.')
  })

  it('computes full depth 1–7 marker sequence for minimal index tree', () => {
    expect(computeMarker({ depth: 1 }, { siblingIndex: 0 })).to.equal('I.')
    expect(computeMarker({ depth: 2 }, { siblingIndex: 0 })).to.equal('A.')
    expect(computeMarker({ depth: 3 }, { siblingIndex: 0 })).to.equal('1.')
    expect(computeMarker({ depth: 4 }, { siblingIndex: 0 })).to.equal('a.')
    expect(computeMarker({ depth: 5 }, { siblingIndex: 0 })).to.equal('i.')
    expect(computeMarker({ depth: 6 }, { siblingIndex: 0 })).to.equal('(1)')
    expect(computeMarker({ depth: 7 }, { siblingIndex: 0 })).to.equal('(a)')
  })

  it('computes alphabetic markers past Z', () => {
    expect(computeMarker({ depth: 2 }, { siblingIndex: 26 })).to.equal('AA.')
    expect(computeMarker({ depth: 4 }, { siblingIndex: 26 })).to.equal('aa.')
    expect(computeMarker({ depth: 7 }, { siblingIndex: 26 })).to.equal('(aa)')
  })

  it('markerWidth includes export trailing space', () => {
    expect(markerWidth('I.')).to.equal(3)
    expect(markerWidth('XIV.')).to.equal(5)
    expect(markerWidth('(1)')).to.equal(4)
    expect(markerWidth('(a)')).to.equal(4)
  })

  it('indentForDepth matches normalizeListItem cumulative math', () => {
    expect(indentForDepth(1, 1)).to.equal(0)
    expect(indentForDepth(2, 1)).to.equal(3)
    expect(indentForDepth(3, 1)).to.equal(6)
    expect(indentForDepth(4, 1)).to.equal(9)
    expect(indentForDepth(5, 1)).to.equal(12)
    expect(indentForDepth(6, 1)).to.equal(15)
    expect(indentForDepth(7, 1)).to.equal(19)

    expect(indentForDepth(1, 2)).to.equal(0)
    expect(indentForDepth(2, 2)).to.equal(4)
    expect(indentForDepth(3, 2)).to.equal(8)
    expect(indentForDepth(4, 2)).to.equal(12)
    expect(indentForDepth(5, 2)).to.equal(16)
    expect(indentForDepth(6, 2)).to.equal(20)
    expect(indentForDepth(7, 2)).to.equal(25)

    expect(indentForDepth(1, 4)).to.equal(0)
    expect(indentForDepth(2, 4)).to.equal(6)
    expect(indentForDepth(3, 4)).to.equal(12)

    expect(indentForDepth(2, 'tab')).to.equal(3)

    expect(indentForDepth(1, 'dfm')).to.equal(0)
    expect(indentForDepth(2, 'dfm')).to.equal(4)
    expect(indentForDepth(3, 'dfm')).to.equal(8)
    expect(indentForDepth(4, 'dfm')).to.equal(12)
    expect(indentForDepth(5, 'dfm')).to.equal(16)
    expect(indentForDepth(6, 'dfm')).to.equal(20)
    expect(indentForDepth(7, 'dfm')).to.equal(24)
  })

  it('indentForDepth can use actual ancestor marker widths', () => {
    expect(indentForDepth(2, 1, ['XIV.'])).to.equal(5)
    expect(indentForDepth(3, 2, ['XIV.', 'J.'])).to.equal(10)
    expect(indentForDepth(3, 'dfm', ['XIV.', 'J.'])).to.equal(9)
  })

  it('depthFromIndent and markerMatchesDepth agree on depth or return null', () => {
    expect(markerMatchesDepth('I.', 1)).to.equal(true)
    expect(markerMatchesDepth('I.', 2)).to.equal(true)
    expect(markerMatchesDepth('AA.', 2)).to.equal(true)
    expect(markerMatchesDepth('A.', 2)).to.equal(true)
    expect(markerMatchesDepth('1.', 3)).to.equal(true)
    expect(markerMatchesDepth('i.', 4)).to.equal(true)
    expect(markerMatchesDepth('i.', 5)).to.equal(true)
    expect(markerMatchesDepth('(aa)', 7)).to.equal(true)
    expect(markerMatchesDepth('1.', 1)).to.equal(false)

    expect(depthFromIndent(0, 'I.', 2)).to.equal(1)
    expect(depthFromIndent(4, 'I.', 2)).to.equal(2)
    expect(depthFromIndent(4, 'A.', 2)).to.equal(2)
    expect(depthFromIndent(8, '1.', 2)).to.equal(3)
    expect(depthFromIndent(5, 'J.', 1, ['XIV.'])).to.equal(2)
    expect(depthFromIndent(4, '1.', 2)).to.equal(null)
    expect(depthFromIndent(0, 'A.', 2)).to.equal(null)
  })

  it('walkOutlineGroups continues across plain paragraphs and stops at groupStart', () => {
    const blocks: BlockStub[] = [
      { type: 'outline-item', depth: 1 },
      { type: 'p' },
      { type: 'outline-item', depth: 2 },
      { type: 'outline-item', depth: 1, groupStart: true },
      { type: 'outline-item', depth: 2 }
    ]

    const groups = [...walkOutlineGroups(blocks)]

    expect(groups).to.have.length(2)
    expect(groups[0]).to.have.length(2)
    expect(groups[0][0].depth).to.equal(1)
    expect(groups[0][1].depth).to.equal(2)
    expect(groups[1]).to.have.length(2)
    expect(groups[1][0].groupStart).to.equal(true)
    expect(groups[1][1].depth).to.equal(2)
  })
})

describe('createOutlineItem', () => {
  it('creates flat root outline-item with child paragraph', () => {
    const ctx = createMuyaContext()
    const item = ctx.contentState.createOutlineItem(2)

    expect(item.type).to.equal('outline-item')
    expect(item.depth).to.equal(2)
    expect(item.children).to.have.length(1)
    expect(item.children[0].type).to.equal('p')
    expect(item.parent).to.equal(null)
    expect(item.groupStart).to.equal(false)
  })

  it('rejects unsupported outline depths', () => {
    const ctx = createMuyaContext()

    expect(() => ctx.contentState.createOutlineItem(0)).to.throw(RangeError)
    expect(() => ctx.contentState.createOutlineItem(8)).to.throw(RangeError)
  })
})
