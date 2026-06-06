import { describe, it, expect } from 'vitest'
import ContentState from 'muya/lib/contentState'
import EventCenter from 'muya/lib/eventHandler/event'
import { MUYA_DEFAULT_OPTION } from 'muya/lib/config'
import { getOutlineRenderMetaMap } from 'muya/lib/utils/outlineUtils'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OutlineBlock = any

const createContentState = (setup: (contentState: ContentState) => void) => {
  const muya = {
    options: Object.assign({}, MUYA_DEFAULT_OPTION),
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

describe('outline Enter / Backspace / Shift+Enter', () => {
  it('Enter with non-empty body creates a new same-depth sibling below', () => {
    const contentState = createContentState((cs) => {
      const item = cs.createOutlineItem(1)
      item.children[0].children[0].text = 'Point'
      setRootBlocks(cs, [item])
      focusOutlineBody(cs, item, 5)
      cs.enterInOutlineItem(item, item.children[0], cs.cursor.start)
    })

    const outlines = contentState.getBlocks().filter((block) => block.type === 'outline-item')

    expect(outlines).to.have.length(2)
    expect(outlineDepths(contentState)).to.deep.equal([1, 1])
    expect(outlineMarkers(contentState)).to.deep.equal(['I.', 'II.'])
    expect(outlines[0].children[0].children[0].text).to.equal('Point')
    expect(outlines[1].children[0].children[0].text).to.equal('')
  })

  it('Enter after a parent inserts the sibling after existing descendants', () => {
    const contentState = createContentState((cs) => {
      const parent = cs.createOutlineItem(1)
      const child = cs.createOutlineItem(2)
      parent.children[0].children[0].text = 'Parent'
      child.children[0].children[0].text = 'Child'
      setRootBlocks(cs, [parent, child])
      focusOutlineBody(cs, parent, 6)
      cs.enterInOutlineItem(parent, parent.children[0], cs.cursor.start)
    })

    const outlines = contentState.getBlocks().filter((block) => block.type === 'outline-item')

    expect(outlines).to.have.length(3)
    expect(outlineDepths(contentState)).to.deep.equal([1, 2, 1])
    expect(outlineMarkers(contentState)).to.deep.equal(['I.', 'A.', 'II.'])
    expect(contentState.findImplicitParent(outlines[1])?.key).to.equal(outlines[0].key)
    expect(outlines[2].children[0].children[0].text).to.equal('')
  })

  it('Enter on empty body at depth 1 becomes a plain paragraph', () => {
    const contentState = createContentState((cs) => {
      const item = cs.createOutlineItem(1)
      setRootBlocks(cs, [item])
      focusOutlineBody(cs, item)
      cs.enterInOutlineItem(item, item.children[0], cs.cursor.start)
    })

    expect(contentState.getBlocks()).to.have.length(1)
    expect(contentState.getBlocks()[0].type).to.equal('p')
    expect(outlineDepths(contentState)).to.deep.equal([])
  })

  it('Enter on empty body at depth 3 outdents to depth 2 with cascade', () => {
    const contentState = createContentState((cs) => {
      const first = cs.createOutlineItem(1)
      const second = cs.createOutlineItem(2)
      const third = cs.createOutlineItem(3)
      setRootBlocks(cs, [first, second, third])
      focusOutlineBody(cs, third)
      cs.enterInOutlineItem(third, third.children[0], cs.cursor.start)
    })

    expect(outlineDepths(contentState)).to.deep.equal([1, 2, 2])
    expect(outlineMarkers(contentState)).to.deep.equal(['I.', 'A.', 'B.'])
  })

  it('Shift+Enter inserts a soft line break within the same outline body', () => {
    const contentState = createContentState((cs) => {
      const item = cs.createOutlineItem(1)
      const bodyKey = item.children[0].children[0].key
      item.children[0].children[0].text = 'Point'
      setRootBlocks(cs, [item])
      cs.cursor = {
        start: { key: bodyKey, offset: 5 },
        end: { key: bodyKey, offset: 5 },
        isEdit: false
      }

      const span = item.children[0].children[0]
      const left = 5
      span.text = span.text.substring(0, left) + '\n' + span.text.substring(left)
    })

    expect(contentState.getBlocks()).to.have.length(1)
    expect(contentState.getBlocks()[0].children[0].children[0].text).to.equal('Point\n')
  })

  it('Backspace at body start merges with an adjacent same-depth sibling', () => {
    const contentState = createContentState((cs) => {
      const first = cs.createOutlineItem(1)
      const second = cs.createOutlineItem(1)
      first.children[0].children[0].text = 'One'
      second.children[0].children[0].text = 'Two'
      setRootBlocks(cs, [first, second])
      focusOutlineBody(cs, second)
      cs.handleOutlineBackspace(second, 'MERGE', first)
    })

    expect(contentState.getBlocks()).to.have.length(1)
    expect(contentState.getBlocks()[0].type).to.equal('outline-item')
    expect(contentState.getBlocks()[0].children[0].children[0].text).to.equal('OneTwo')
  })

  it('Backspace at body start outdents when there is no adjacent sibling', () => {
    const contentState = createContentState((cs) => {
      const first = cs.createOutlineItem(1)
      const second = cs.createOutlineItem(2)
      const third = cs.createOutlineItem(3)
      third.children[0].children[0].text = 'Child'
      setRootBlocks(cs, [first, second, third])
      focusOutlineBody(cs, third)
      cs.handleOutlineBackspace(third, 'OUTDENT')
    })

    expect(outlineDepths(contentState)).to.deep.equal([1, 2, 2])
    expect(outlineMarkers(contentState)).to.deep.equal(['I.', 'A.', 'B.'])
  })

  it('Backspace at body start on depth 1 with no adjacent sibling exits to plain paragraph', () => {
    const contentState = createContentState((cs) => {
      const item = cs.createOutlineItem(1)
      item.children[0].children[0].text = 'Solo'
      setRootBlocks(cs, [item])
      focusOutlineBody(cs, item)
      cs.handleOutlineBackspace(item, 'EXIT')
    })

    expect(contentState.getBlocks()).to.have.length(1)
    expect(contentState.getBlocks()[0].type).to.equal('p')
    expect(contentState.getBlocks()[0].children[0].text).to.equal('Solo')
  })

  it('exiting a parent to paragraph promotes existing descendants', () => {
    const contentState = createContentState((cs) => {
      const parent = cs.createOutlineItem(1)
      const child = cs.createOutlineItem(2)
      parent.children[0].children[0].text = 'Parent'
      child.children[0].children[0].text = 'Child'
      setRootBlocks(cs, [parent, child])
      focusOutlineBody(cs, parent)
      cs.handleOutlineBackspace(parent, 'EXIT')
    })

    const blocks = contentState.getBlocks()

    expect(blocks).to.have.length(2)
    expect(blocks[0].type).to.equal('p')
    expect(blocks[0].children[0].text).to.equal('Parent')
    expect(outlineDepths(contentState)).to.deep.equal([1])
    expect(outlineMarkers(contentState)).to.deep.equal(['I.'])
    expect(contentState.findImplicitParent(blocks[1])).to.equal(null)
  })

  it('Backspace on an empty item deletes it and renumbers siblings', () => {
    const contentState = createContentState((cs) => {
      const first = cs.createOutlineItem(1)
      const second = cs.createOutlineItem(1)
      const third = cs.createOutlineItem(1)
      setRootBlocks(cs, [first, second, third])
      focusOutlineBody(cs, second)
      cs.handleOutlineBackspace(second, 'DELETE')
    })

    expect(outlineDepths(contentState)).to.deep.equal([1, 1])
    expect(outlineMarkers(contentState)).to.deep.equal(['I.', 'II.'])
  })

  it('Backspace on an empty parent deletes it and promotes descendants', () => {
    const contentState = createContentState((cs) => {
      const parent = cs.createOutlineItem(1)
      const child = cs.createOutlineItem(2)
      child.children[0].children[0].text = 'Child'
      setRootBlocks(cs, [parent, child])
      focusOutlineBody(cs, parent)
      cs.handleOutlineBackspace(parent, 'DELETE')
    })

    const outlines = contentState.getBlocks().filter((block) => block.type === 'outline-item')

    expect(outlines).to.have.length(1)
    expect(outlineDepths(contentState)).to.deep.equal([1])
    expect(outlineMarkers(contentState)).to.deep.equal(['I.'])
    expect(outlines[0].children[0].children[0].text).to.equal('Child')
    expect(contentState.findImplicitParent(outlines[0])).to.equal(null)
  })

  it('deleting a group-start parent transfers the restart to the promoted child', () => {
    const contentState = createContentState((cs) => {
      const previous = cs.createOutlineItem(1)
      const parent = cs.createOutlineItem(1, { groupStart: true, start: 11 })
      const child = cs.createOutlineItem(2)
      setRootBlocks(cs, [previous, parent, child])
      focusOutlineBody(cs, parent)
      cs.handleOutlineBackspace(parent, 'DELETE')
    })

    const outlines = contentState.getBlocks().filter((block) => block.type === 'outline-item')

    expect(outlineDepths(contentState)).to.deep.equal([1, 1])
    expect(outlineMarkers(contentState)).to.deep.equal(['I.', 'XI.'])
    expect(outlines[1].groupStart).to.equal(true)
    expect(outlines[1].start).to.equal(11)
  })

  it('Backspace does not merge across an intervening paragraph', () => {
    const contentState = createContentState((cs) => {
      const first = cs.createOutlineItem(1)
      const gap = cs.createBlockP('between')
      const second = cs.createOutlineItem(1)
      second.children[0].children[0].text = 'Two'
      setRootBlocks(cs, [first, gap, second])
      focusOutlineBody(cs, second)

      expect(cs.getAdjacentPriorOutlineSibling(second)).to.equal(null)
      cs.handleOutlineBackspace(second, 'EXIT')
    })

    expect(contentState.getBlocks()).to.have.length(3)
    expect(contentState.getBlocks()[0].type).to.equal('outline-item')
    expect(contentState.getBlocks()[1].type).to.equal('p')
    expect(contentState.getBlocks()[2].type).to.equal('p')
    expect(contentState.getBlocks()[2].children[0].text).to.equal('Two')
  })

  it('Enter mid-body splits into two same-depth siblings at the cursor', () => {
    const contentState = createContentState((cs) => {
      const item = cs.createOutlineItem(2)
      item.children[0].children[0].text = 'AlphaBeta'
      setRootBlocks(cs, [item])
      focusOutlineBody(cs, item, 5)
      cs.enterInOutlineItem(item, item.children[0], cs.cursor.start)
    })

    const outlines = contentState.getBlocks().filter((block) => block.type === 'outline-item')

    expect(outlines).to.have.length(2)
    expect(outlineDepths(contentState)).to.deep.equal([2, 2])
    expect(outlines[0].children[0].children[0].text).to.equal('Alpha')
    expect(outlines[1].children[0].children[0].text).to.equal('Beta')
  })

  it('Enter mid-body preserves existing descendants under the original item', () => {
    const contentState = createContentState((cs) => {
      const parent = cs.createOutlineItem(1)
      const child = cs.createOutlineItem(2)
      parent.children[0].children[0].text = 'AlphaBeta'
      child.children[0].children[0].text = 'Child'
      setRootBlocks(cs, [parent, child])
      focusOutlineBody(cs, parent, 5)
      cs.enterInOutlineItem(parent, parent.children[0], cs.cursor.start)
    })

    const outlines = contentState.getBlocks().filter((block) => block.type === 'outline-item')

    expect(outlines).to.have.length(3)
    expect(outlineDepths(contentState)).to.deep.equal([1, 2, 1])
    expect(outlineMarkers(contentState)).to.deep.equal(['I.', 'A.', 'II.'])
    expect(outlines[0].children[0].children[0].text).to.equal('Alpha')
    expect(outlines[1].children[0].children[0].text).to.equal('Child')
    expect(outlines[2].children[0].children[0].text).to.equal('Beta')
    expect(contentState.findImplicitParent(outlines[1])?.key).to.equal(outlines[0].key)
  })
})
