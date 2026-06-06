import { describe, it, expect } from 'vitest'
import ContentState from 'muya/lib/contentState'
import EventCenter from 'muya/lib/eventHandler/event'
import ExportHtml, { hasOutlineItems } from 'muya/lib/utils/exportHtml'
import ExportMarkdown from 'muya/lib/utils/exportMarkdown'
import { MUYA_DEFAULT_OPTION } from 'muya/lib/config'
import { computeMarker, indentForDepth } from 'muya/lib/utils/outlineUtils'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OutlineBlock = any

interface MuyaCtx {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  eventCenter: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contentState: any
}

const LABELS = ['one', 'two', 'three', 'four', 'five', 'six', 'seven']

const createMuyaContext = (
  listIndentation: number | string,
  options: Record<string, unknown> = {}
): MuyaCtx => {
  const ctx = {} as MuyaCtx
  ctx.options = Object.assign({}, MUYA_DEFAULT_OPTION, { listIndentation }, options)
  ctx.eventCenter = new EventCenter()
  ctx.contentState = new ContentState(ctx, ctx.options)
  return ctx
}

const buildProgrammaticFixture = (
  contentState: ContentState,
  markerIndices: number[],
  labels = LABELS
): OutlineBlock[] => {
  const blocks: OutlineBlock[] = []

  for (let depth = 1; depth <= 7; depth++) {
    const targetIndex = markerIndices[depth - 1]

    for (let sibling = 1; sibling < targetIndex; sibling++) {
      const dummy = contentState.createOutlineItem(depth)
      dummy.children[0].children[0].text = `skip-${depth}-${sibling}`
      blocks.push(dummy)
    }

    const item = contentState.createOutlineItem(depth)
    item.children[0].children[0].text = labels[depth - 1]
    blocks.push(item)
  }

  return blocks
}

const renderHybridHtml = (
  blocks: OutlineBlock[],
  listIndentation: number | string,
  options: Record<string, unknown> = {}
): string => {
  const ctx = createMuyaContext(listIndentation, {
    outlineBlocksEnabled: true,
    ...options
  })
  ctx.contentState.setBlocks(blocks)
  const markdown = new ExportMarkdown(blocks, listIndentation).generate()
  const exporter = new ExportHtml(markdown, ctx, blocks)
  return exporter.renderHybridHtml(blocks)
}

const MINIMAL_INDICES = [1, 1, 1, 1, 1, 1, 1]
const INDEX_TWO_INDICES = [2, 2, 2, 2, 2, 2, 2]
const WIDE_INDICES = [14, 10, 42, 10, 14, 99, 26]

const expectedMarker = (
  depth: number,
  markerIndices: number[]
): string => {
  const ancestorMarkers: string[] = []
  let marker = ''

  for (let d = 1; d <= depth; d++) {
    marker = computeMarker({ depth: d }, { siblingIndex: markerIndices[d - 1] - 1 })
    ancestorMarkers.push(marker)
  }

  return marker
}

describe('markdown outline HTML export', () => {
  it('renders a single depth-1 outline item with flat outline-item markup and I. marker', () => {
    const ctx = createMuyaContext(1, { outlineBlocksEnabled: true })
    const item = ctx.contentState.createOutlineItem(1)
    item.children[0].children[0].text = 'Solo'
    const blocks = [item]
    const html = renderHybridHtml(blocks, 1)

    expect(html).to.include('class="outline-item"')
    expect(html).to.include('class="outline-marker"')
    expect(html).to.include('class="outline-body"')
    expect(html).to.include('>I.<')
    expect(html).to.include('Solo')
    expect(html).not.to.include('<ol')
  })

  it.each([1, 2, 'dfm'] as const)(
    'renders the minimal index fixture tree at listIndentation %s',
    (listIndentation) => {
      const ctx = createMuyaContext(listIndentation)
      const blocks = buildProgrammaticFixture(ctx.contentState, MINIMAL_INDICES)
      const html = renderHybridHtml(blocks, listIndentation)

      expect(html.match(/class="outline-item"/g)?.length).to.equal(7)
      expect(html).to.include(`>${expectedMarker(1, MINIMAL_INDICES)}<`)
      expect(html).to.include(`>${expectedMarker(3, MINIMAL_INDICES)}<`)
      expect(html).to.include('seven')
      expect(html).not.to.include('<ol')
    }
  )

  it.each([1, 2, 'dfm'] as const)(
    'renders the index-2 fixture tree at listIndentation %s',
    (listIndentation) => {
      const ctx = createMuyaContext(listIndentation)
      const blocks = buildProgrammaticFixture(ctx.contentState, INDEX_TWO_INDICES)
      const html = renderHybridHtml(blocks, listIndentation)

      expect(html).to.include(`>${expectedMarker(1, INDEX_TWO_INDICES)}<`)
      expect(html).to.include(`>${expectedMarker(2, INDEX_TWO_INDICES)}<`)
      expect(html).to.include('skip-1-1')
      expect(html).not.to.include('<ol')
    }
  )

  it.each([1, 2, 'dfm'] as const)(
    'renders the wide-marker fixture tree at listIndentation %s',
    (listIndentation) => {
      const ctx = createMuyaContext(listIndentation)
      const blocks = buildProgrammaticFixture(ctx.contentState, WIDE_INDICES)
      const html = renderHybridHtml(blocks, listIndentation)

      expect(html).to.include('XIV.')
      expect(html).to.include('(99)')
      expect(html).to.include('(z)')
      expect(html).not.to.include('<ol')
    }
  )

  it('aligns multi-line body continuation under the body column', () => {
    const ctx = createMuyaContext(1, { outlineBlocksEnabled: true })
    ctx.contentState.importMarkdown('I. first line\n   second line\n')
    const blocks = ctx.contentState.getBlocks()
    const html = renderHybridHtml(blocks, 1)

    expect(html).to.include('first line')
    expect(html).to.include('second line')
    expect(html).to.include('class="outline-body"')
  })

  it('omits the group-start sentinel from HTML output', () => {
    const ctx = createMuyaContext(1, { outlineBlocksEnabled: true })
    ctx.contentState.importMarkdown('I. First\n<!-- mt:outline-group-start -->\nXI. Restart\n')
    const blocks = ctx.contentState.getBlocks()
    const html = renderHybridHtml(blocks, 1)

    expect(html).not.to.include('mt:outline-group-start')
    expect(html).to.include('>XI.<')
    expect(html).to.include('Restart')
  })

  it('does not render indented depth-3 outline lines as code blocks', () => {
    const ctx = createMuyaContext(1, { outlineBlocksEnabled: true })
    const blocks = buildProgrammaticFixture(ctx.contentState, MINIMAL_INDICES)
    const depthThree = blocks.find((block: OutlineBlock) => block.depth === 3)
    depthThree.children[0].children[0].text = 'Three'
    const html = renderHybridHtml(blocks, 1)

    expect(html).to.include('class="outline-item"')
    expect(html).to.include('outline-marker">1.')
    expect(html).to.include('Three')
    expect(html).not.to.match(/<pre[^>]*>[\s\S]*1\. Three/)
    expect(html).not.to.match(/<code[^>]*>[\s\S]*1\. Three/)
  })

  it('interleaves outline items and paragraphs in document order', async() => {
    const ctx = createMuyaContext(1, { outlineBlocksEnabled: true })
    ctx.contentState.importMarkdown('I. One\n\nInterlude\n\nII. Two\n')
    const blocks = ctx.contentState.getBlocks()
    const markdown = new ExportMarkdown(blocks, 1).generate()
    const exporter = new ExportHtml(markdown, ctx, blocks)
    const html = await exporter.renderHtml()

    const oneIndex = html.indexOf('>I.<')
    const interludeIndex = html.indexOf('Interlude')
    const twoIndex = html.indexOf('>II.<')

    expect(oneIndex).to.be.greaterThan(-1)
    expect(interludeIndex).to.be.greaterThan(oneIndex)
    expect(twoIndex).to.be.greaterThan(interludeIndex)
  })

  it('uses the marked() path when the block tree has no outline items', async() => {
    const markdown = '# Heading\n\nPlain paragraph.\n'
    const ctx = createMuyaContext(1)
    ctx.contentState.importMarkdown(markdown)
    const blocks = ctx.contentState.getBlocks()

    expect(hasOutlineItems(blocks)).to.equal(false)

    const markdownOnly = await new ExportHtml(markdown).renderHtml()
    const withBlocks = await new ExportHtml(markdown, ctx, blocks).renderHtml()

    expect(withBlocks).to.equal(markdownOnly)
  })

  it('detects outline items and routes ExportHtml through the hybrid seam', async() => {
    const ctx = createMuyaContext(1, { outlineBlocksEnabled: true })
    const item = ctx.contentState.createOutlineItem(1)
    item.children[0].children[0].text = 'Hybrid'
    const blocks = [item]
    const markdown = new ExportMarkdown(blocks, 1).generate()

    expect(hasOutlineItems(blocks)).to.equal(true)

    const html = await new ExportHtml(markdown, ctx, blocks).renderHtml()
    expect(html).to.include('class="outline-item"')
    expect(html).to.include('Hybrid')
    expect(html).not.to.include('<ol')
  })

  it('applies cumulative indent styling from listIndentation settings', () => {
    const ctx = createMuyaContext(2, { outlineBlocksEnabled: true })
    const blocks = buildProgrammaticFixture(ctx.contentState, MINIMAL_INDICES).filter(
      (block: OutlineBlock) => block.depth <= 2
    )
    const depthTwo = blocks.find((block: OutlineBlock) => block.depth === 2)
    const indent = indentForDepth(2, 2, ['I.'])
    const html = renderHybridHtml(blocks, 2)

    expect(indent).to.be.greaterThan(0)
    expect(html).to.include(`padding-left: ${indent}ch`)
    expect(depthTwo).to.not.equal(undefined)
  })
})
