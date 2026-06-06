import { afterEach, describe, it, expect, vi } from 'vitest'
import ContentState from 'muya/lib/contentState'
import EventCenter from 'muya/lib/eventHandler/event'
import selection from 'muya/lib/selection'
import { MUYA_DEFAULT_OPTION } from 'muya/lib/config'
import { getOutlineRenderMetaMap } from 'muya/lib/utils/outlineUtils'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OutlineBlock = any

const createContentState = (
  setup: (contentState: ContentState) => void,
  listIndentation: number | string = 2
) => {
  const muya: {
    options: Record<string, unknown>
    eventCenter: unknown
    container: HTMLDivElement
    blur(): void
    contentState?: ContentState
  } = {
    options: Object.assign({}, MUYA_DEFAULT_OPTION, { listIndentation }),
    eventCenter: new EventCenter(),
    container: document.createElement('div'),
    blur() {}
  }
  const contentState = new ContentState(muya, muya.options)
  muya.contentState = contentState
  contentState.partialRender = () => contentState
  setup(contentState)
  return contentState
}

const linkRootBlocks = (blocks: OutlineBlock[]) => {
  blocks.forEach((block, index) => {
    block.parent = null
    block.preSibling = index > 0 ? blocks[index - 1].key : null
    block.nextSibling = index < blocks.length - 1 ? blocks[index + 1].key : null
  })
}

const setRootBlocks = (contentState: ContentState, blocks: OutlineBlock[]) => {
  linkRootBlocks(blocks)
  contentState.setBlocks(blocks)
}

const focusOutlineBody = (contentState: ContentState, item: OutlineBlock, offset = 0) => {
  const bodyKey = item.children[0].children[0].key
  contentState.cursor = {
    start: { key: bodyKey, offset },
    end: { key: bodyKey, offset },
    isEdit: false
  }
}

const outlineMarkers = (contentState: ContentState) => {
  const meta = getOutlineRenderMetaMap(
    contentState.getBlocks(),
    contentState.listIndentation ?? 2
  )

  return contentState
    .getBlocks()
    .filter((block) => block.type === 'outline-item')
    .map((block) => meta.get(block)?.marker)
}

const outlineDepths = (contentState: ContentState) => {
  return contentState
    .getBlocks()
    .filter((block) => block.type === 'outline-item')
    .map((block) => block.depth)
}

describe('outline Tab / Shift+Tab', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('Tab on depth-1 outline item → depth 2; marker A.', () => {
    const contentState = createContentState((cs) => {
      const item = cs.createOutlineItem(1)
      setRootBlocks(cs, [item])
      focusOutlineBody(cs, item)
      cs.indentOutlineItem()
    })

    expect(outlineDepths(contentState)).to.deep.equal([2])
    expect(outlineMarkers(contentState)).to.deep.equal(['A.'])
  })

  it('Shift+Tab on depth 2 → depth 1', () => {
    const contentState = createContentState((cs) => {
      const item = cs.createOutlineItem(2)
      setRootBlocks(cs, [item])
      focusOutlineBody(cs, item)
      cs.outdentOutlineItem()
    })

    expect(outlineDepths(contentState)).to.deep.equal([1])
    expect(outlineMarkers(contentState)).to.deep.equal(['I.'])
  })

  it('Tab with plain paragraph between siblings uses implicit parent, not preSibling', () => {
    const contentState = createContentState((cs) => {
      const first = cs.createOutlineItem(1)
      const gap = cs.createBlockP('between')
      const second = cs.createOutlineItem(1)
      setRootBlocks(cs, [first, gap, second])
      focusOutlineBody(cs, second)
      cs.indentOutlineItem()
    })

    expect(outlineDepths(contentState)).to.deep.equal([1, 2])
    expect(outlineMarkers(contentState)).to.deep.equal(['I.', 'A.'])
    expect(contentState.findImplicitParent(contentState.getBlocks()[2])?.key)
      .to.equal(contentState.getBlocks()[0].key)
  })

  it('reparenting cascade absorbs contiguous same-depth followers as children', () => {
    const contentState = createContentState((cs) => {
      const first = cs.createOutlineItem(1)
      const second = cs.createOutlineItem(1)
      const third = cs.createOutlineItem(1)
      setRootBlocks(cs, [first, second, third])
      focusOutlineBody(cs, first)
      cs.indentOutlineItem()
    })

    expect(outlineDepths(contentState)).to.deep.equal([2, 3, 3])
    expect(outlineMarkers(contentState)).to.deep.equal(['A.', '1.', '2.'])
  })

  it('reparenting cascade preserves existing descendants under the moved item', () => {
    const contentState = createContentState((cs) => {
      const first = cs.createOutlineItem(1)
      const child = cs.createOutlineItem(2)
      setRootBlocks(cs, [first, child])
      focusOutlineBody(cs, first)
      cs.indentOutlineItem()
    })

    const blocks = contentState.getBlocks()

    expect(outlineDepths(contentState)).to.deep.equal([2, 3])
    expect(outlineMarkers(contentState)).to.deep.equal(['A.', '1.'])
    expect(contentState.findImplicitParent(blocks[1])?.key).to.equal(blocks[0].key)
  })

  it('reparenting cascade shifts absorbed sibling descendants with their parent', () => {
    const contentState = createContentState((cs) => {
      const first = cs.createOutlineItem(1)
      const firstChild = cs.createOutlineItem(2)
      const second = cs.createOutlineItem(1)
      const secondChild = cs.createOutlineItem(2)
      setRootBlocks(cs, [first, firstChild, second, secondChild])
      focusOutlineBody(cs, first)
      cs.indentOutlineItem()
    })

    expect(outlineDepths(contentState)).to.deep.equal([2, 3, 3, 4])
    expect(outlineMarkers(contentState)).to.deep.equal(['A.', '1.', '2.', 'a.'])
  })

  it('Shift+Tab cascade preserves descendants and absorbs following old-depth siblings', () => {
    const contentState = createContentState((cs) => {
      const root = cs.createOutlineItem(1)
      const firstChild = cs.createOutlineItem(2)
      const grandChild = cs.createOutlineItem(3)
      const secondChild = cs.createOutlineItem(2)
      setRootBlocks(cs, [root, firstChild, grandChild, secondChild])
      focusOutlineBody(cs, firstChild)
      cs.outdentOutlineItem()
    })

    expect(outlineDepths(contentState)).to.deep.equal([1, 1, 2, 2])
    expect(outlineMarkers(contentState)).to.deep.equal(['I.', 'II.', 'A.', 'B.'])
  })

  it('renumbers non-contiguous followers at the old depth after indent', () => {
    const contentState = createContentState((cs) => {
      const first = cs.createOutlineItem(1)
      const second = cs.createOutlineItem(1)
      const gap = cs.createBlockP('between')
      const third = cs.createOutlineItem(1)
      setRootBlocks(cs, [first, second, gap, third])
      focusOutlineBody(cs, second)
      cs.indentOutlineItem()
    })

    expect(outlineDepths(contentState)).to.deep.equal([1, 2, 1])
    expect(outlineMarkers(contentState)).to.deep.equal(['I.', 'A.', 'II.'])
  })

  it('depth 7 Tab no-op and depth 1 Shift+Tab no-op', () => {
    const deep = createContentState((cs) => {
      const item = cs.createOutlineItem(7)
      item.children[0].children[0].text = 'deep'
      setRootBlocks(cs, [item])
      focusOutlineBody(cs, item)
      cs.indentOutlineItem()
    })

    expect(outlineDepths(deep)).to.deep.equal([7])
    expect(deep.getBlocks()[0].children[0].children[0].text).to.equal('deep')

    const shallow = createContentState((cs) => {
      const item = cs.createOutlineItem(1)
      setRootBlocks(cs, [item])
      focusOutlineBody(cs, item)
      cs.outdentOutlineItem()
    })

    expect(outlineDepths(shallow)).to.deep.equal([1])
  })

  it('Tab is a no-op when cascading would push descendants past depth 7', () => {
    const contentState = createContentState((cs) => {
      const parent = cs.createOutlineItem(6)
      const child = cs.createOutlineItem(7)
      const bodyKey = parent.children[0].children[0].key
      parent.children[0].children[0].text = 'Body'
      setRootBlocks(cs, [parent, child])
      focusOutlineBody(cs, parent, 4)

      vi.spyOn(selection, 'getCursorRange').mockReturnValue({
        start: { key: bodyKey, offset: 4 },
        end: { key: bodyKey, offset: 4 }
      })

      cs.tabHandler({
        preventDefault() {},
        shiftKey: false,
        isComposing: false
      })
    })

    expect(outlineDepths(contentState)).to.deep.equal([6, 7])
    expect(outlineMarkers(contentState)).to.deep.equal(['(1)', '(a)'])
    expect(contentState.getBlocks()[0].children[0].children[0].text).to.equal('Body')
  })

  it('tabHandler Tab at depth 7 is a no-op instead of inserting spaces', () => {
    const contentState = createContentState((cs) => {
      const item = cs.createOutlineItem(7)
      const bodyKey = item.children[0].children[0].key
      item.children[0].children[0].text = 'Body'
      setRootBlocks(cs, [item])
      focusOutlineBody(cs, item, 4)

      vi.spyOn(selection, 'getCursorRange').mockReturnValue({
        start: { key: bodyKey, offset: 4 },
        end: { key: bodyKey, offset: 4 }
      })

      cs.tabHandler({
        preventDefault() {},
        shiftKey: false,
        isComposing: false
      })
    })

    expect(outlineDepths(contentState)).to.deep.equal([7])
    expect(contentState.getBlocks()[0].children[0].children[0].text).to.equal('Body')
  })

  it('tabHandler indents outline without inserting spaces into body text', () => {
    const contentState = createContentState((cs) => {
      const item = cs.createOutlineItem(1)
      const bodyKey = item.children[0].children[0].key
      item.children[0].children[0].text = 'Body'
      setRootBlocks(cs, [item])
      focusOutlineBody(cs, item, 4)

      vi.spyOn(selection, 'getCursorRange').mockReturnValue({
        start: { key: bodyKey, offset: 4 },
        end: { key: bodyKey, offset: 4 }
      })

      cs.tabHandler({
        preventDefault() {},
        shiftKey: false,
        isComposing: false
      })
    })

    expect(outlineDepths(contentState)).to.deep.equal([2])
    expect(contentState.getBlocks()[0].children[0].children[0].text).to.equal('Body')
  })

  it('tabHandler Shift+Tab at depth 1 is a no-op instead of indenting', () => {
    const contentState = createContentState((cs) => {
      const item = cs.createOutlineItem(1)
      const bodyKey = item.children[0].children[0].key
      item.children[0].children[0].text = 'Body'
      setRootBlocks(cs, [item])
      focusOutlineBody(cs, item, 4)

      vi.spyOn(selection, 'getCursorRange').mockReturnValue({
        start: { key: bodyKey, offset: 4 },
        end: { key: bodyKey, offset: 4 }
      })

      cs.tabHandler({
        preventDefault() {},
        shiftKey: true,
        isComposing: false
      })
    })

    expect(outlineDepths(contentState)).to.deep.equal([1])
    expect(contentState.getBlocks()[0].children[0].children[0].text).to.equal('Body')
  })
})
