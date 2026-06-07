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
      description: 'Markdown-Enable outline blocks.',
      type: 'boolean',
      default: false
    })
  })

  it('en.json defines concise outline preference copy', () => {
    const en = JSON.parse(readFileSync(enLocalePath, 'utf-8'))
    const extensions = en.preferences.markdown.extensions

    expect(extensions.outlineBlocksEnabled).to.equal('Outline blocks')
    expect(en.preferences.search.items.outlineBlocksEnabled).to.equal('Enable outline blocks')
  })

  it('all source locale files define outline preference labels', () => {
    const localeFiles = readdirSync(localesPath)
      .filter(file => file.endsWith('.json') && !file.endsWith('.min.json'))

    localeFiles.forEach(file => {
      const locale = JSON.parse(readFileSync(resolve(localesPath, file), 'utf-8'))
      const extensions = locale.preferences.markdown.extensions
      const searchItems = locale.preferences.search.items

      expect(extensions.outlineBlocksEnabled, file).to.be.a('string')
      expect(extensions.outlineBlocksEnabled, file).to.not.equal('')
      expect(searchItems.outlineBlocksEnabled, file).to.be.a('string')
      expect(searchItems.outlineBlocksEnabled, file).to.not.equal('')
    })
  })

  it('all source locale files define outline creation UI keys', () => {
    const localeFiles = readdirSync(localesPath)
      .filter(file => file.endsWith('.json') && !file.endsWith('.min.json'))

    localeFiles.forEach(file => {
      const locale = JSON.parse(readFileSync(resolve(localesPath, file), 'utf-8'))

      expect(locale.quickInsert.outlineItem.title, file).to.be.a('string')
      expect(locale.quickInsert.outlineItem.title, file).to.not.equal('')
      expect(locale.quickInsert.outlineItem.subtitle, file).to.be.a('string')
      expect(locale.quickInsert.outlineItem.subtitle, file).to.not.equal('')
      expect(locale.frontMenu.outlineItem, file).to.be.a('string')
      expect(locale.frontMenu.outlineItem, file).to.not.equal('')
      expect(locale.frontMenu.newOutlineGroup, file).to.be.a('string')
      expect(locale.frontMenu.newOutlineGroup, file).to.not.equal('')
      expect(locale.commands.paragraph.restartOutlineGroup, file).to.be.a('string')
      expect(locale.commands.paragraph.restartOutlineGroup, file).to.not.equal('')
    })
  })

  it('uses a compact front-menu label for starting a new outline', () => {
    const locale = JSON.parse(readFileSync(resolve(localesPath, 'en.json'), 'utf-8'))

    expect(locale.frontMenu.newOutlineGroup).to.equal('New Outline')
    expect(locale.commands.paragraph.restartOutlineGroup).to.equal('Restart Outline')
  })
})
