import { describe, it, expect, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import Muya from 'muya/lib'
import { CLASS_OR_ID } from 'muya/lib/config'
import {
  findNearestParagraph,
  findOutMostParagraph,
  isBlockContainer
} from 'muya/lib/selection/dom'
import { indentForDepth } from 'muya/lib/utils/outlineUtils'

interface MuyaHarness {
  muya: Muya
  container: HTMLDivElement
  editor: HTMLDivElement
}

const createMuyaHarness = (
  setup: (contentState: Muya['contentState']) => void,
  listIndentation: number | string = 2
): MuyaHarness => {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const muya = new Muya(host, { markdown: '', listIndentation })
  const container = muya.container

  setup(muya.contentState)
  muya.contentState.render(false)

  const editor = (container.querySelector(`#${CLASS_OR_ID.AG_EDITOR_ID}`) ??
    container.firstElementChild) as HTMLDivElement
  return { muya, container, editor }
}

const destroyMuyaHarness = ({ muya, container }: MuyaHarness) => {
  muya.destroy()
  if (container.parentNode === document.body) {
    document.body.removeChild(container)
  }
}

const appendStyle = (stylePath: string) => {
  const style = document.createElement('style')
  style.textContent = readFileSync(resolve(process.cwd(), stylePath), 'utf8')
  document.head.appendChild(style)
  return style
}

const appendEditorStyles = () => [
  appendStyle('../muyajs/lib/assets/styles/index.css'),
  appendStyle('../muyajs/themes/default.css')
]

describe('outline WYSIWYG render', () => {
  let harness: MuyaHarness | null = null

  afterEach(() => {
    if (harness) {
      destroyMuyaHarness(harness)
      harness = null
    }
  })

  it('renders depth-1 structural marker I. separate from body text', () => {
    harness = createMuyaHarness((contentState) => {
      const item = contentState.createOutlineItem(1)
      const bodyKey = item.children[0].children[0].key
      item.children[0].children[0].text = 'Top-level point'
      contentState.setBlocks([item])
      contentState.cursor = {
        start: { key: bodyKey, offset: 0 },
        end: { key: bodyKey, offset: 0 },
        isEdit: false
      }
    })

    const outline = harness.editor.querySelector('.ag-outline-item') as HTMLDivElement
    const marker = outline.querySelector('.ag-outline-marker') as HTMLSpanElement
    const body = outline.querySelector('p.ag-paragraph span') as HTMLSpanElement

    expect(outline).to.not.equal(null)
    expect(outline.dataset.depth).to.equal('1')
    expect(outline.dataset.marker).to.equal('I.')
    expect(marker.textContent).to.equal('I.')
    expect(marker.getAttribute('contenteditable')).to.equal('false')
    expect(body.textContent).to.equal('Top-level point')
    expect(body.textContent).to.not.include('I.')
  })

  it('keeps collapsed caret offsets in body span only', () => {
    harness = createMuyaHarness((contentState) => {
      const item = contentState.createOutlineItem(1)
      const bodyKey = item.children[0].children[0].key
      contentState.setBlocks([item])
      contentState.cursor = {
        start: { key: bodyKey, offset: 0 },
        end: { key: bodyKey, offset: 0 },
        isEdit: false
      }
    })

    const bodyKey = harness.muya.contentState.cursor.start.key
    const bodySpan = harness.editor.querySelector('p.ag-paragraph span') as HTMLSpanElement
    const marker = harness.editor.querySelector('.ag-outline-marker') as HTMLSpanElement

    expect(bodySpan.id).to.equal(bodyKey)
    expect(marker.id).to.not.equal(bodyKey)
    expect(harness.muya.contentState.cursor.start.offset).to.equal(0)
  })

  it('renders depth-3 decimal marker with cumulative indent', () => {
    harness = createMuyaHarness((contentState) => {
      const d1 = contentState.createOutlineItem(1)
      const d2 = contentState.createOutlineItem(2)
      const d3 = contentState.createOutlineItem(3)
      contentState.setBlocks([d1, d2, d3])
    }, 2)

    const outlines = harness.editor.querySelectorAll('.ag-outline-item')
    const depth3 = outlines[2] as HTMLDivElement
    const marker = depth3.querySelector('.ag-outline-marker') as HTMLSpanElement
    const expectedIndent = indentForDepth(3, 2, ['I.', 'A.'])

    expect(marker.textContent).to.equal('1.')
    expect(depth3.getAttribute('style')).to.equal(`padding-left: ${expectedIndent}ch`)
  })

  it('aligns multi-line body continuation under body text after marker', () => {
    harness = createMuyaHarness((contentState) => {
      const item = contentState.createOutlineItem(1)
      item.children[0].children[0].text = 'First line\nSecond line'
      contentState.setBlocks([item])
    })

    const outline = harness.editor.querySelector('.ag-outline-item') as HTMLDivElement
    const marker = outline.querySelector('.ag-outline-marker') as HTMLSpanElement
    const bodyParagraph = outline.querySelector('p.ag-paragraph') as HTMLParagraphElement
    const bodySpan = bodyParagraph.querySelector('span') as HTMLSpanElement

    expect(marker.nextElementSibling).to.equal(bodyParagraph)
    expect(bodyParagraph.classList.contains('ag-paragraph')).to.equal(true)
    expect(bodySpan.classList.contains('ag-paragraph-content')).to.equal(true)
    expect(bodySpan.textContent).to.equal('First line\nSecond line')
    expect(bodySpan.textContent).to.not.include('I.')
  })

  it('uses ag-outline-item root container, not list item ancestry', () => {
    harness = createMuyaHarness((contentState) => {
      contentState.setBlocks([contentState.createOutlineItem(1)])
    })

    const outline = harness.editor.querySelector('.ag-outline-item') as HTMLDivElement

    expect(outline.tagName).to.equal('DIV')
    expect(outline.classList.contains('ag-outline-item')).to.equal(true)
    expect(outline.closest('li')).to.equal(null)
    expect(outline.closest('ol')).to.equal(null)
    expect(outline.closest('ul')).to.equal(null)
  })

  it('shows the front menu icon when an outline item is active', () => {
    const editorStyles = appendEditorStyles()
    try {
      harness = createMuyaHarness((contentState) => {
        const item = contentState.createOutlineItem(1)
        const bodyKey = item.children[0].children[0].key
        contentState.setBlocks([item])
        contentState.cursor = {
          start: { key: bodyKey, offset: 0 },
          end: { key: bodyKey, offset: 0 },
          isEdit: false
        }
      })

      const outline = harness.editor.querySelector('.ag-outline-item') as HTMLDivElement
      const frontIcon = outline.querySelector('.ag-front-icon') as HTMLAnchorElement
      const frontIconImage = frontIcon.querySelector('img.icon-inner') as HTMLImageElement
      const bodyParagraph = outline.querySelector('p.ag-paragraph') as HTMLParagraphElement

      expect(outline.classList.contains('ag-active')).to.equal(true)
      expect(frontIcon.getAttribute('contenteditable')).to.equal('false')
      expect(frontIconImage.getAttribute('src')).to.include('order_list')
      expect(getComputedStyle(frontIcon).display).to.equal('block')
      expect(['0', '0px']).to.include(getComputedStyle(bodyParagraph).marginTop)
    } finally {
      editorStyles.forEach((style) => style.remove())
    }
  })

  it('participates in focus mode opacity without root ag-paragraph class', () => {
    const editorStyles = appendEditorStyles()
    try {
      harness = createMuyaHarness((contentState) => {
        const first = contentState.createOutlineItem(1)
        const second = contentState.createOutlineItem(1)
        const secondBodyKey = second.children[0].children[0].key
        contentState.setBlocks([first, second])
        contentState.cursor = {
          start: { key: secondBodyKey, offset: 0 },
          end: { key: secondBodyKey, offset: 0 },
          isEdit: false
        }
      })
      harness.editor.classList.add('ag-focus-mode')

      const outlines = harness.editor.querySelectorAll('.ag-outline-item')
      const inactive = outlines[0] as HTMLDivElement
      const active = outlines[1] as HTMLDivElement

      expect(inactive.classList.contains('ag-paragraph')).to.equal(false)
      expect(getComputedStyle(inactive).opacity).to.equal('0.25')
      expect(active.classList.contains('ag-active')).to.equal(true)
      expect(getComputedStyle(active).opacity).to.equal('1')
    } finally {
      editorStyles.forEach((style) => style.remove())
    }
  })

  it('treats the outline root as the outmost block while keeping body span nearest', () => {
    harness = createMuyaHarness((contentState) => {
      contentState.setBlocks([contentState.createOutlineItem(1)])
    })

    const outline = harness.editor.querySelector('.ag-outline-item') as HTMLDivElement
    const bodyParagraph = outline.querySelector('p.ag-paragraph') as HTMLParagraphElement
    const bodySpan = bodyParagraph.querySelector('span') as HTMLSpanElement

    expect(findNearestParagraph(bodySpan)).to.equal(bodySpan)
    expect(findOutMostParagraph(bodySpan)).to.equal(outline)
    expect(isBlockContainer(outline)).to.equal(true)
  })
})
