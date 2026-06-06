import { describe, it, expect } from 'vitest'
import ContentState from 'muya/lib/contentState'
import EventCenter from 'muya/lib/eventHandler/event'
import { Lexer } from 'muya/lib/parser/marked'
import { MUYA_DEFAULT_OPTION } from 'muya/lib/config'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Block = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Token = Record<string, any>

const createContentState = (options: Record<string, unknown> = {}) => {
  const muya: {
    options: Record<string, unknown>
    eventCenter: unknown
    container: HTMLDivElement
    blur(): void
    contentState?: ContentState
  } = {
    options: Object.assign({}, MUYA_DEFAULT_OPTION, options),
    eventCenter: new EventCenter(),
    container: document.createElement('div'),
    blur() {}
  }
  const contentState = new ContentState(muya, muya.options)
  muya.contentState = contentState
  return contentState
}

const importMarkdown = (markdown: string, options: Record<string, unknown> = {}) => {
  const contentState = createContentState(options)
  contentState.importMarkdown(markdown)
  return contentState.getBlocks()
}

const parseTokens = (markdown: string, options: Record<string, unknown> = {}): Token[] => {
  const lexer = new Lexer({
    disableInline: true,
    footnote: options.footnote ?? false,
    outlineBlocksEnabled: options.outlineBlocksEnabled ?? false,
    listIndentation: options.listIndentation ?? 1
  })
  return lexer.lex(markdown)
}

const outlineItems = (blocks: Block[]) => blocks.filter((block) => block.type === 'outline-item')

const outlineBodies = (blocks: Block[]) =>
  outlineItems(blocks).map((item) => item.children[0].children[0].text)

const outlineDepths = (blocks: Block[]) => outlineItems(blocks).map((item) => item.depth)

describe('markdown outline import', () => {
  it('pref off imports I. Top as a plain paragraph', () => {
    const blocks = importMarkdown('I. Top', { outlineBlocksEnabled: false })

    expect(blocks).to.have.length(1)
    expect(blocks[0].type).to.equal('p')
    expect(blocks[0].children[0].text).to.equal('I. Top')
  })

  it('pref on imports I. Top at depth 1 as outline-item', () => {
    const blocks = importMarkdown('I. Top', { outlineBlocksEnabled: true })

    expect(outlineItems(blocks)).to.have.length(1)
    expect(outlineDepths(blocks)).to.deep.equal([1])
    expect(outlineBodies(blocks)).to.deep.equal(['Top'])
  })

  it('pref on keeps 0-indent 1. foo as an ordered list, not outline depth 3', () => {
    const blocks = importMarkdown('1. foo', { outlineBlocksEnabled: true })

    expect(outlineItems(blocks)).to.have.length(0)
    expect(blocks[0].type).to.equal('ol')
    expect(blocks[0].children[0].type).to.equal('li')
  })

  it('imports indent and marker disagreement as a plain paragraph', () => {
    const blocks = importMarkdown('  I. mismatch', {
      outlineBlocksEnabled: true,
      listIndentation: 2
    })

    expect(outlineItems(blocks)).to.have.length(0)
    expect(blocks[0].type).to.equal('p')
    expect(blocks[0].children[0].text).to.equal('  I. mismatch')
  })

  it('continues ambiguous N. from a preceding outline chain', () => {
    const blocks = importMarkdown('I. Top\n        1. child', {
      outlineBlocksEnabled: true,
      listIndentation: 2
    })

    expect(outlineDepths(blocks)).to.deep.equal([1, 3])
    expect(outlineBodies(blocks)).to.deep.equal(['Top', 'child'])
  })

  it('continues ambiguous N. from a preceding list chain', () => {
    const blocks = importMarkdown('1. list\n    1. nested', {
      outlineBlocksEnabled: true,
      listIndentation: 1
    })

    expect(outlineItems(blocks)).to.have.length(0)
    expect(blocks[0].type).to.equal('ol')
    const firstLi = blocks[0].children[0]
    const nestedOl = firstLi.children.find((child: Block) => child.type === 'ol')
    expect(nestedOl, 'expected nested ordered list inside first item').toBeDefined()
    expect(nestedOl.children[0].children[0].children[0].text).to.equal('nested')
  })

  it('imports depth 4-7 markers when indent and marker agree', () => {
    const markdown = [
      'I. Root',
      '   A. Letter',
      '      1. Number',
      '         a. lower',
      '            i. roman',
      '               (1) paren',
      '                   (a) last'
    ].join('\n')

    const blocks = importMarkdown(markdown, {
      outlineBlocksEnabled: true,
      listIndentation: 1
    })

    expect(outlineDepths(blocks)).to.deep.equal([1, 2, 3, 4, 5, 6, 7])
    expect(outlineBodies(blocks)).to.deep.equal([
      'Root',
      'Letter',
      'Number',
      'lower',
      'roman',
      'paren',
      'last'
    ])
  })

  it('honors group-start sentinel before XI. with groupStart and start', () => {
    const blocks = importMarkdown('II. First\n<!-- mt:outline-group-start -->\nXI. Restart', {
      outlineBlocksEnabled: true,
      listIndentation: 1
    })

    const items = outlineItems(blocks)
    expect(items).to.have.length(2)
    expect(items[0].groupStart).to.equal(false)
    expect(items[1].groupStart).to.equal(true)
    expect(items[1].start).to.equal(11)
    expect(outlineBodies(blocks)).to.deep.equal(['First', 'Restart'])
  })

  it('keeps XI. after II. as continuation without a group-start sentinel', () => {
    const blocks = importMarkdown('II. First\nXI. Third', {
      outlineBlocksEnabled: true,
      listIndentation: 1
    })

    const items = outlineItems(blocks)
    expect(items).to.have.length(2)
    expect(items[1].groupStart).to.equal(false)
    expect(items[1].start).to.equal(undefined)
    expect(outlineBodies(blocks)).to.deep.equal(['First', 'Third'])
  })

  it('does not leak group-start sentinel across an intervening paragraph', () => {
    const blocks = importMarkdown(
      'II. First\n<!-- mt:outline-group-start -->\nplain text\n\nXI. Later',
      {
        outlineBlocksEnabled: true,
        listIndentation: 1
      }
    )

    const items = outlineItems(blocks)
    expect(items).to.have.length(2)
    expect(items[1].groupStart).to.equal(false)
    expect(items[1].start).to.equal(undefined)
    expect(outlineBodies(blocks)).to.deep.equal(['First', 'Later'])
  })

  it('does not leak group-start sentinel through a non-root outline item', () => {
    const blocks = importMarkdown(
      'I. First\n<!-- mt:outline-group-start -->\n   A. Child\nXI. Later',
      {
        outlineBlocksEnabled: true,
        listIndentation: 1
      }
    )

    const items = outlineItems(blocks)
    expect(outlineDepths(blocks)).to.deep.equal([1, 2, 1])
    expect(items.map((item) => item.groupStart)).to.deep.equal([false, false, false])
    expect(items[2].start).to.equal(undefined)
    expect(outlineBodies(blocks)).to.deep.equal(['First', 'Child', 'Later'])
  })

  it('preserves outline import context across intervening non-outline blocks', () => {
    const blocks = importMarkdown('XIV. Root\n# Gap\n     A. Child', {
      outlineBlocksEnabled: true,
      listIndentation: 1
    })

    expect(outlineItems(blocks)).to.have.length(2)
    expect(blocks[1].type).to.equal('h1')
    expect(outlineDepths(blocks)).to.deep.equal([1, 2])
    expect(outlineBodies(blocks)).to.deep.equal(['Root', 'Child'])
  })

  it('parses outline markers before the indented code rule', () => {
    const tokens = parseTokens('I. Top\n   A. Child', {
      outlineBlocksEnabled: true,
      listIndentation: 1
    })

    expect(tokens.filter((token) => token.type === 'outline_item')).to.have.length(2)
    expect(tokens.some((token) => token.type === 'code')).to.equal(false)

    const blocks = importMarkdown('I. Top\n   A. Child', {
      outlineBlocksEnabled: true,
      listIndentation: 1
    })

    expect(outlineDepths(blocks)).to.deep.equal([1, 2])
  })

  it('imports multi-line outline markdown structurally via markdownToState', () => {
    const contentState = createContentState({ outlineBlocksEnabled: true, listIndentation: 1 })
    const blocks = contentState.markdownToState('I. One\n   A. Two\n      1. Three')

    expect(outlineDepths(blocks)).to.deep.equal([1, 2, 3])
    expect(outlineBodies(blocks)).to.deep.equal(['One', 'Two', 'Three'])
  })

  it('keeps marker-like blockquote content as quoted paragraph text', () => {
    const blocks = importMarkdown('> I. quoted', { outlineBlocksEnabled: true })

    expect(outlineItems(blocks)).to.have.length(0)
    expect(blocks[0].type).to.equal('blockquote')
    expect(blocks[0].children[0].type).to.equal('p')
    expect(blocks[0].children[0].children[0].text).to.equal('I. quoted')
  })

  it('keeps marker-like footnote content as footnote paragraph text', () => {
    const tokens = parseTokens('Body[^1]\n\n[^1]: I. footnote', {
      footnote: true,
      outlineBlocksEnabled: true
    })

    expect(tokens.some((token) => token.type === 'outline_item')).to.equal(false)
    expect(tokens).to.deep.include({ type: 'paragraph', text: 'I. footnote' })
  })

  it('preserves body continuation lines in one imported outline item', () => {
    const blocks = importMarkdown('I. first\n   continued', {
      outlineBlocksEnabled: true,
      listIndentation: 1
    })

    expect(outlineItems(blocks)).to.have.length(1)
    expect(outlineDepths(blocks)).to.deep.equal([1])
    expect(outlineBodies(blocks)).to.deep.equal(['first\ncontinued'])
  })

  it('stops body continuation before a valid nested outline item', () => {
    const blocks = importMarkdown('I. first\n   continued\n   A. child', {
      outlineBlocksEnabled: true,
      listIndentation: 1
    })

    expect(outlineItems(blocks)).to.have.length(2)
    expect(outlineDepths(blocks)).to.deep.equal([1, 2])
    expect(outlineBodies(blocks)).to.deep.equal(['first\ncontinued', 'child'])
  })

  it('keeps task lists and 1) delimiters unchanged when pref is on', () => {
    const taskBlocks = importMarkdown('- [ ] Task item', { outlineBlocksEnabled: true })
    expect(taskBlocks[0].type).to.equal('ul')
    expect(taskBlocks[0].children[0].listItemType).to.equal('task')

    const parenBlocks = importMarkdown('1) ordered', { outlineBlocksEnabled: true })
    expect(parenBlocks[0].type).to.equal('ol')
    expect(outlineItems(parenBlocks)).to.have.length(0)
  })
})
