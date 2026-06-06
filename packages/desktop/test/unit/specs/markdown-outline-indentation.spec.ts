import { describe, it, expect } from 'vitest'
import ContentState from 'muya/lib/contentState'
import EventCenter from 'muya/lib/eventHandler/event'
import ExportMarkdown from 'muya/lib/utils/exportMarkdown'
import { MUYA_DEFAULT_OPTION } from 'muya/lib/config'
import { indentForDepth, computeMarker } from 'muya/lib/utils/outlineUtils'

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

const buildExpectedMarkdown = (
  listIndentation: number | string,
  markerIndices: number[],
  labels = LABELS
): string => {
  const lines: string[] = []
  const ancestorMarkers: string[] = []

  for (let depth = 1; depth <= 7; depth++) {
    const marker = computeMarker(
      { depth },
      { siblingIndex: markerIndices[depth - 1] - 1 }
    )
    const indent = indentForDepth(depth, listIndentation, ancestorMarkers)
    lines.push(`${' '.repeat(indent)}${marker} ${labels[depth - 1]}`)
    ancestorMarkers.push(marker)
  }

  return `${lines.join('\n')}\n`
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

const roundTripMarkdown = (
  markdown: string,
  listIndentation: number | string,
  options: Record<string, unknown> = {}
): string => {
  const ctx = createMuyaContext(listIndentation, {
    outlineBlocksEnabled: true,
    ...options
  })
  ctx.contentState.importMarkdown(markdown)
  const blocks = ctx.contentState.getBlocks()
  return new ExportMarkdown(blocks, listIndentation).generate()
}

const verifyRoundTrip = (
  markdown: string,
  listIndentation: number | string,
  options: Record<string, unknown> = {}
): void => {
  expect(roundTripMarkdown(markdown, listIndentation, options)).to.equal(markdown)
}

const exportProgrammaticFixture = (
  listIndentation: number | string,
  markerIndices: number[]
): string => {
  const ctx = createMuyaContext(listIndentation)
  const blocks = buildProgrammaticFixture(ctx.contentState, markerIndices)
  ctx.contentState.setBlocks(blocks)
  return new ExportMarkdown(blocks, listIndentation).generate()
}

const extractLabelLines = (markdown: string): string[] => {
  return markdown
    .trim()
    .split('\n')
    .filter((line) => LABELS.some((label) => line.endsWith(` ${label}`)))
}

const MINIMAL_INDICES = [1, 1, 1, 1, 1, 1, 1]
const INDEX_TWO_INDICES = [2, 2, 2, 2, 2, 2, 2]
const WIDE_INDICES = [14, 10, 42, 10, 14, 99, 26]

describe('markdown outline export round-trip', () => {
  it('exports a single depth-1 outline item with I. marker and zero indent', () => {
    const markdown = 'I. Solo\n'
    expect(roundTripMarkdown(markdown, 1)).to.equal(markdown)
  })

  it('exports a single depth-2 outline item with an A. marker', () => {
    const ctx = createMuyaContext(1, { outlineBlocksEnabled: true })
    const item = ctx.contentState.createOutlineItem(2)
    item.children[0].children[0].text = 'Persist me'
    ctx.contentState.setBlocks([item])

    const exported = new ExportMarkdown(ctx.contentState.getBlocks(), 1).generate()
    expect(exported).to.equal('   A. Persist me\n')
  })

  it.each([1, 2, 'dfm'] as const)(
    'round-trips the minimal index fixture tree at listIndentation %s',
    (listIndentation) => {
      const markdown = buildExpectedMarkdown(listIndentation, MINIMAL_INDICES)
      verifyRoundTrip(markdown, listIndentation)
    }
  )

  it.each([1, 2, 'dfm'] as const)(
    'exports the index-2 fixture tree at listIndentation %s',
    (listIndentation) => {
      const exported = exportProgrammaticFixture(listIndentation, INDEX_TWO_INDICES)
      const expectedLabels = extractLabelLines(
        buildExpectedMarkdown(listIndentation, INDEX_TWO_INDICES)
      )

      expect(extractLabelLines(exported)).to.deep.equal(expectedLabels)
      expect(exported).to.include('I. skip-1-1')
      expect(exported).to.include('A. skip-2-1')
    }
  )

  it.each([1, 2, 'dfm'] as const)(
    'exports the wide-marker fixture tree at listIndentation %s',
    (listIndentation) => {
      const exported = exportProgrammaticFixture(listIndentation, WIDE_INDICES)
      const expectedLabels = extractLabelLines(
        buildExpectedMarkdown(listIndentation, WIDE_INDICES)
      )

      expect(extractLabelLines(exported)).to.deep.equal(expectedLabels)
      expect(exported).to.include('XIII. skip-1-13')
      expect(exported).to.include('I. skip-2-9')
    }
  )

  it('round-trips group-start sentinel and restart root metadata', () => {
    const markdown = 'I. First\n<!-- mt:outline-group-start -->\nXI. Restart\n'
    verifyRoundTrip(markdown, 1)

    const ctx = createMuyaContext(1, { outlineBlocksEnabled: true })
    ctx.contentState.importMarkdown(markdown)
    const restart = ctx.contentState
      .getBlocks()
      .find((block: { groupStart?: boolean }) => block.groupStart)
    expect(restart?.groupStart).to.equal(true)
    expect(restart?.start).to.equal(11)
  })

  it('exports multi-line body continuation aligned under body text', () => {
    const markdown = 'I. first line\n   second line\n'
    verifyRoundTrip(markdown, 1)
  })

  it('round-trips an outline item after prose with a block boundary', () => {
    const markdown = 'Intro paragraph\n\nI. One\n'
    verifyRoundTrip(markdown, 1)
  })

  it('round-trips prose between outline siblings without breaking continuation', () => {
    const markdown = 'I. One\n\nInterlude\n\nII. Two\n'
    verifyRoundTrip(markdown, 1)
  })

  it('exports existing outline items when outlineBlocksEnabled is false', () => {
    const ctx = createMuyaContext(1, { outlineBlocksEnabled: false })
    const item = ctx.contentState.createOutlineItem(1)
    item.children[0].children[0].text = 'Body'
    ctx.contentState.setBlocks([item])

    const exported = new ExportMarkdown(ctx.contentState.getBlocks(), 1).generate()
    expect(exported).to.equal('I. Body\n')
  })
})
