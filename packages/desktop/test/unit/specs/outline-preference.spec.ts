import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'fs'
import { resolve } from 'path'
import Muya from 'muya/lib'
import { MUYA_DEFAULT_OPTION } from 'muya/lib/config'

const schemaPath = resolve(__dirname, '../../../src/main/preferences/schema.json')
const localesPath = resolve(__dirname, '../../../static/locales')
const enLocalePath = resolve(localesPath, 'en.json')

describe('outline preference', () => {
  it('MUYA_DEFAULT_OPTION.outlineBlocksEnabled defaults to false', () => {
    expect(MUYA_DEFAULT_OPTION.outlineBlocksEnabled).to.equal(false)
  })

  it('setOptions updates outlineBlocksEnabled without re-parsing open document', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    let muya

    try {
      muya = new Muya(container, { markdown: '# Hello\n\nWorld' })
      const blocksBefore = JSON.stringify(muya.contentState.getBlocks())

      muya.setOptions({ outlineBlocksEnabled: true }, true)

      expect(muya.options.outlineBlocksEnabled).to.equal(true)
      expect(JSON.stringify(muya.contentState.getBlocks())).to.equal(blocksBefore)
    } finally {
      const muyaContainer = muya?.container
      muya?.destroy()
      if (muyaContainer?.parentNode === document.body) {
        document.body.removeChild(muyaContainer)
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

  it('all source locale files define outlineBlocksEnabled keys', () => {
    const localeFiles = readdirSync(localesPath)
      .filter(file => file.endsWith('.json') && !file.endsWith('.min.json'))

    localeFiles.forEach(file => {
      const locale = JSON.parse(readFileSync(resolve(localesPath, file), 'utf-8'))
      const extensions = locale.preferences.markdown.extensions
      const searchItems = locale.preferences.search.items

      expect(extensions.outlineBlocksEnabled, file).to.be.a('string')
      expect(extensions.outlineBlocksEnabled, file).to.not.equal('')
      expect(extensions.outlineBlocksEnabledNotes, file).to.be.a('string')
      expect(extensions.outlineBlocksEnabledNotes, file).to.not.equal('')
      expect(searchItems.outlineBlocksEnabled, file).to.be.a('string')
      expect(searchItems.outlineBlocksEnabled, file).to.not.equal('')
    })
  })
})
