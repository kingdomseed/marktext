import { describe, it, expect } from 'vitest'
import ContentState from 'muya/lib/contentState'
import EventCenter from 'muya/lib/eventHandler/event'
import { MUYA_DEFAULT_OPTION } from 'muya/lib/config'
import {
  createQuickInsertObj,
  filterOutlineQuickInsertObj,
  filterOutlineMenuEntries
} from 'muya/lib/ui/quickInsert/config'
import { createGetSubMenu } from 'muya/lib/ui/frontMenu/config'
import { getOutlineRenderMetaMap } from 'muya/lib/utils/outlineUtils'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Block = any

const createContentState = (
  options: Record<string, unknown> = {},
  setup?: (contentState: ContentState) => void
) => {
  const muya = {
    options: Object.assign({}, MUYA_DEFAULT_OPTION, options),
    eventCenter: new EventCenter(),
    container: document.createElement('div'),
    blur() {}
  }
  const contentState = new ContentState(muya, muya.options)
  muya.contentState = contentState
  contentState.partialRender = () => contentState
  setup?.(contentState)
  return contentState
}

const linkRootBlocks = (blocks: Block[]) => {
  blocks.forEach((block, index) => {
    block.parent = null
    block.preSibling = index > 0 ? blocks[index - 1].key : null
    block.nextSibling = index < blocks.length - 1 ? blocks[index + 1].key : null
  })
}

const setRootBlocks = (contentState: ContentState, blocks: Block[]) => {
  linkRootBlocks(blocks)
  contentState.setBlocks(blocks)
}

const focusSpan = (contentState: ContentState, spanKey: string, offset = 0) => {
  contentState.cursor = {
    start: { key: spanKey, offset },
    end: { key: spanKey, offset },
    isEdit: false
  }
}

const collectQuickInsertLabels = (outlineBlocksEnabled: boolean) => {
  const obj = filterOutlineQuickInsertObj(createQuickInsertObj(), outlineBlocksEnabled)
  return Object.values(obj)
    .flat()
    .map((item) => item.label)
}

describe('outline UI gating and Turn Into', () => {
  it('removes outline quick-insert entries when outlineBlocksEnabled is false', () => {
    expect(collectQuickInsertLabels(false)).to.not.include('outline-item')
    expect(collectQuickInsertLabels(true)).to.include('outline-item')
  })

  it('removes outline front-menu entries when outlineBlocksEnabled is false', () => {
    const enabled = createGetSubMenu(undefined, true) as ReturnType<typeof createGetSubMenu>
    const disabled = createGetSubMenu(undefined, false) as ReturnType<typeof createGetSubMenu>
    const paragraph = { type: 'p' }
    const span = { key: 'span-1' }

    const enabledLabels = enabled(paragraph, span, span).map((item) => item.label)
    const disabledLabels = disabled(paragraph, span, span).map((item) => item.label)

    expect(enabledLabels).to.include('outline-item')
    expect(disabledLabels).to.not.include('outline-item')
    expect(filterOutlineMenuEntries([{ label: 'new-outline-group' }], false)).to.have.length(0)
  })

  it('quick-insert creates a depth-1 outline item from an empty paragraph', () => {
    const contentState = createContentState({ outlineBlocksEnabled: true }, (cs) => {
      const paragraph = cs.createBlockP('')
      setRootBlocks(cs, [paragraph])
      focusSpan(cs, paragraph.children[0].key)
      cs.updateParagraph('outline-item', true)
    })

    const blocks = contentState.getBlocks()
    expect(blocks).to.have.length(2)
    expect(blocks[0].type).to.equal('p')
    expect(blocks[1].type).to.equal('outline-item')
    expect(blocks[1].depth).to.equal(1)
  })

  it('Turn Into paragraph uses context continuation depth after a preceding outline item', () => {
    const contentState = createContentState({ outlineBlocksEnabled: true }, (cs) => {
      const first = cs.createOutlineItem(1)
      first.children[0].children[0].text = 'Top'
      const paragraph = cs.createBlockP('Nested')
      setRootBlocks(cs, [first, paragraph])
      focusSpan(cs, paragraph.children[0].key)
      cs.updateParagraph('outline-item')
    })

    const outlines = contentState.getBlocks().filter((block) => block.type === 'outline-item')
    expect(outlines).to.have.length(2)
    expect(outlines[1].depth).to.equal(1)
  })

  it('Turn Into outline to paragraph promotes nested descendants one depth level', () => {
    const contentState = createContentState({ outlineBlocksEnabled: true }, (cs) => {
      const root = cs.createOutlineItem(1)
      const child = cs.createOutlineItem(2)
      root.children[0].children[0].text = 'Root'
      child.children[0].children[0].text = 'Child'
      setRootBlocks(cs, [root, child])
      focusSpan(cs, root.children[0].children[0].key)
      cs.updateParagraph('paragraph')
    })

    const blocks = contentState.getBlocks()
    expect(blocks[0].type).to.equal('p')
    expect(blocks[0].children[0].text).to.equal('Root')
    expect(blocks[1].type).to.equal('outline-item')
    expect(blocks[1].depth).to.equal(1)
  })

  it('denies direct Turn Into between outline and list types', () => {
    const contentState = createContentState({ outlineBlocksEnabled: true }, (cs) => {
      const item = cs.createOutlineItem(1)
      item.children[0].children[0].text = 'Point'
      setRootBlocks(cs, [item])
      focusSpan(cs, item.children[0].children[0].key)
    })

    const spanKey = contentState.getBlocks()[0].children[0].children[0].key
    const block = contentState.getBlock(spanKey)

    expect(contentState.isAllowedTransformation(block, 'ol-order', false)).to.equal(false)
    expect(contentState.isAllowedTransformation(block, 'ul-bullet', false)).to.equal(false)
  })

  it('blocks multiline Turn Into when an outline item is involved', () => {
    const contentState = createContentState({ outlineBlocksEnabled: true }, (cs) => {
      const item = cs.createOutlineItem(1)
      item.children[0].children[0].text = 'Point'
      setRootBlocks(cs, [item])
      focusSpan(cs, item.children[0].children[0].key)
    })

    const spanKey = contentState.getBlocks()[0].children[0].children[0].key
    const block = contentState.getBlock(spanKey)

    expect(contentState.isAllowedTransformation(block, 'paragraph', true)).to.equal(false)
    expect(contentState.isAllowedTransformation(block, 'heading 2', true)).to.equal(false)
  })

  it('restartOutlineGroup sets groupStart and start on a depth-1 item', () => {
    const contentState = createContentState({ outlineBlocksEnabled: true }, (cs) => {
      const item = cs.createOutlineItem(1)
      setRootBlocks(cs, [item])
      cs.restartOutlineGroup(item, 11)
    })

    const item = contentState.getBlocks()[0]
    expect(item.groupStart).to.equal(true)
    expect(item.start).to.equal(11)

    const meta = getOutlineRenderMetaMap(contentState.getBlocks(), 1).get(item)
    expect(meta?.marker).to.equal('XI.')
  })

  it('Turn Into heading and outline in both directions', () => {
    const headingState = createContentState({ outlineBlocksEnabled: true }, (cs) => {
      const heading = cs.createBlock('h2', { headingStyle: 'atx' })
      const content = cs.createBlock('span', {
        text: `##${String.fromCharCode(160)}Section`,
        functionType: 'atxLine'
      })
      cs.appendChild(heading, content)
      setRootBlocks(cs, [heading])
      focusSpan(cs, content.key)
      cs.updateParagraph('outline-item')
    })

    expect(headingState.getBlocks()[0].type).to.equal('outline-item')
    expect(headingState.getBlocks()[0].depth).to.equal(1)
    expect(headingState.getBlocks()[0].children[0].children[0].text).to.equal(
      `##${String.fromCharCode(160)}Section`
    )

    const outlineState = createContentState({ outlineBlocksEnabled: true }, (cs) => {
      const item = cs.createOutlineItem(1)
      item.children[0].children[0].text = 'Section'
      setRootBlocks(cs, [item])
      focusSpan(cs, item.children[0].children[0].key)
      cs.updateParagraph('heading 2')
    })

    expect(outlineState.getBlocks()[0].type).to.equal('h2')
    expect(outlineState.getBlocks()[0].children[0].text).to.include('Section')
  })

  it('Turn Into blockquote and outline in both directions', () => {
    const quoteToOutline = createContentState({ outlineBlocksEnabled: true }, (cs) => {
      const quote = cs.createBlock('blockquote')
      const paragraph = cs.createBlockP('Quoted')
      cs.appendChild(quote, paragraph)
      setRootBlocks(cs, [quote])
      focusSpan(cs, paragraph.children[0].key)
      cs.updateParagraph('outline-item')
    })

    expect(quoteToOutline.getBlocks()[0].type).to.equal('outline-item')
    expect(quoteToOutline.getBlocks()[0].children[0].children[0].text).to.equal('Quoted')

    const outlineToQuote = createContentState({ outlineBlocksEnabled: true }, (cs) => {
      const item = cs.createOutlineItem(1)
      item.children[0].children[0].text = 'Quoted'
      setRootBlocks(cs, [item])
      focusSpan(cs, item.children[0].children[0].key)
      cs.updateParagraph('blockquote')
    })

    expect(outlineToQuote.getBlocks()[0].type).to.equal('blockquote')
    expect(outlineToQuote.getBlocks()[0].children[0].children[0].text).to.equal('Quoted')
  })

  it('keeps existing outline items editable when outlineBlocksEnabled is false', () => {
    const contentState = createContentState({ outlineBlocksEnabled: false }, (cs) => {
      const item = cs.createOutlineItem(2)
      item.children[0].children[0].text = 'Still editable'
      setRootBlocks(cs, [item])
      focusSpan(cs, item.children[0].children[0].key, 5)
      cs.enterInOutlineItem(item, item.children[0], cs.cursor.start)
    })

    const outlines = contentState.getBlocks().filter((block) => block.type === 'outline-item')
    expect(outlines).to.have.length(2)
    expect(outlines[0].children[0].children[0].text).to.equal('Still')
    expect(outlines[1].depth).to.equal(2)
  })
})
