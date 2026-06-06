import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import Muya from 'muya/lib'
import { MUYA_DEFAULT_OPTION } from 'muya/lib/config'

const schemaPath = resolve(__dirname, '../../../src/main/preferences/schema.json')
const enLocalePath = resolve(__dirname, '../../../static/locales/en.json')

describe('outline preference', () => {
  it('MUYA_DEFAULT_OPTION.outlineBlocksEnabled defaults to false', () => {
    expect(MUYA_DEFAULT_OPTION.outlineBlocksEnabled).to.equal(false)
  })

  it('setOptions updates outlineBlocksEnabled without re-parsing open document', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    try {
      const muya = new Muya(container, { markdown: '# Hello\n\nWorld' })
      const blocksBefore = JSON.stringify(muya.contentState.getBlocks())

      muya.setOptions({ outlineBlocksEnabled: true }, true)

      expect(muya.options.outlineBlocksEnabled).to.equal(true)
      expect(JSON.stringify(muya.contentState.getBlocks())).to.equal(blocksBefore)
    } finally {
      if (container.parentNode === document.body) {
        document.body.removeChild(container)
      }
    }
  })

  it('schema.json defines outlineBlocksEnabled as boolean default false', () => {
    const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'))

    expect(schema.outlineBlocksEnabled).to.deep.equal({
      description: 'Markdown-Enable academic-style outline blocks (Roman/letter/decimal hierarchy with block-level Tab indent).',
      type: 'boolean',
      default: false
    })
  })

  it('en.json defines outlineBlocksEnabled keys under Markdown extensions', () => {
    const en = JSON.parse(readFileSync(enLocalePath, 'utf-8'))
    const extensions = en.preferences.markdown.extensions

    expect(extensions.outlineBlocksEnabled).to.equal('Outline blocks')
    expect(extensions.outlineBlocksEnabledNotes).to.equal(
      'Enabling mid-session does not re-import the open document. Disabling mid-session keeps existing outline items editable.'
    )
    expect(en.preferences.search.items.outlineBlocksEnabled).to.equal(
      'Enable academic-style outline blocks (Roman/letter/decimal hierarchy with block-level Tab indent)'
    )
  })
})
