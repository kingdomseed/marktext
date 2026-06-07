import { expect, test } from '@playwright/test'
import type { ElectronApplication, Page } from 'playwright'
import {
  focusOutlineBody,
  getMarkdownContent,
  getOutlineItemsInEditor,
  insertOutlineViaQuickInsert,
  launchWithDoc,
  launchWithMarkdown,
  relaunchDocument,
  saveDocument,
  typeInOutlineBody,
  waitForDiskMarkdown
} from './helpers'

const OUTLINE_PREFS = { outlineBlocksEnabled: true }

test.describe('Outline blocks primary flow', () => {
  test('imports outline fixture markdown when outlineBlocksEnabled is true', async() => {
    const { app, page } = await launchWithDoc('test/e2e/data/outline.md', {
      preferences: OUTLINE_PREFS
    })

    try {
      await page.waitForSelector('.editor-component .ag-outline-item', {
        state: 'attached',
        timeout: 10000
      })
      const items = await getOutlineItemsInEditor(page)
      expect(items.length).toBeGreaterThanOrEqual(2)
      expect(items[0].marker).toBe('I.')
      expect(items[1].marker).toBe('A.')
    } finally {
      await app.close()
    }
  })

  test('quick-insert, Tab indent, save, and reopen preserve outline structure', async() => {
    let app: ElectronApplication | null = null
    let page: Page
    let filePath = ''
    let userDataDir = ''

    try {
      const launched = await launchWithMarkdown('', { preferences: OUTLINE_PREFS })
      app = launched.app
      page = launched.page
      filePath = launched.filePath
      userDataDir = launched.userDataDir

      await insertOutlineViaQuickInsert(page)
      await typeInOutlineBody(page, 'Persist me')
      await focusOutlineBody(page)
      await page.keyboard.press('Tab')
      await page.waitForTimeout(300)

      const afterTab = await getOutlineItemsInEditor(page)
      expect(afterTab[0]?.depth).toBe('2')
      expect(afterTab[0]?.marker).toBe('A.')

      await saveDocument(page, app)
      const saved = await waitForDiskMarkdown(
        filePath,
        (markdown) => markdown.includes('A. Persist me')
      )
      expect(saved).toContain('A. Persist me')

      await app.close()
      app = null

      const reopened = await relaunchDocument(userDataDir, filePath, {
        preferences: OUTLINE_PREFS
      })
      app = reopened.app
      page = reopened.page

      const restored = await getOutlineItemsInEditor(page)
      expect(restored[0]?.depth).toBe('2')
      expect(restored[0]?.marker).toBe('A.')
    } finally {
      if (app) await app.close()
    }
  })

  test('Shift+Tab outdents an outline item', async() => {
    const { app, page } = await launchWithMarkdown('', { preferences: OUTLINE_PREFS })

    try {
      await insertOutlineViaQuickInsert(page)
      await typeInOutlineBody(page, 'Outdent test')
      await focusOutlineBody(page)
      await page.keyboard.press('Tab')
      await page.waitForTimeout(300)

      let items = await getOutlineItemsInEditor(page)
      expect(items[0]?.depth).toBe('2')

      await focusOutlineBody(page)
      await page.keyboard.press('Shift+Tab')
      await page.waitForTimeout(300)

      items = await getOutlineItemsInEditor(page)
      expect(items[0]?.depth).toBe('1')
      expect(items[0]?.marker).toBe('I.')
    } finally {
      await app.close()
    }
  })

  test('Enter creates a same-depth sibling outline item', async() => {
    const { app, page } = await launchWithMarkdown('', { preferences: OUTLINE_PREFS })

    try {
      await insertOutlineViaQuickInsert(page)
      await typeInOutlineBody(page, 'Alpha')
      await focusOutlineBody(page)
      await page.keyboard.press('Enter')
      await page.waitForTimeout(300)

      const items = await getOutlineItemsInEditor(page)
      expect(items.length).toBe(2)
      expect(items[0]?.depth).toBe('1')
      expect(items[0]?.marker).toBe('I.')
      expect(items[1]?.depth).toBe('1')
      expect(items[1]?.marker).toBe('II.')
    } finally {
      await app.close()
    }
  })

  test('empty Enter on a depth-1 outline item exits to a plain paragraph', async() => {
    const { app, page } = await launchWithMarkdown('', { preferences: OUTLINE_PREFS })

    try {
      await insertOutlineViaQuickInsert(page)
      await focusOutlineBody(page)
      await page.keyboard.press('Enter')
      await page.waitForTimeout(300)

      const outlineCount = await page.locator('.editor-component .ag-outline-item').count()
      expect(outlineCount).toBe(0)
    } finally {
      await app.close()
    }
  })

  test('source mode shows structural markers after outline editing', async() => {
    const { app, page } = await launchWithMarkdown('', { preferences: OUTLINE_PREFS })

    try {
      await insertOutlineViaQuickInsert(page)
      await typeInOutlineBody(page, 'Source check')
      const markdown = await getMarkdownContent(page, app)
      expect(markdown).toMatch(/^I\. Source check/m)
    } finally {
      await app.close()
    }
  })

  test('mid-body paste keeps marker-like text literal in outline body', async() => {
    const { app, page } = await launchWithMarkdown('', { preferences: OUTLINE_PREFS })

    try {
      await insertOutlineViaQuickInsert(page)
      await typeInOutlineBody(page, 'Hello world')
      await focusOutlineBody(page)
      await page.keyboard.press('Home')
      for (let i = 0; i < 6; i++) {
        await page.keyboard.press('ArrowRight')
      }
      await page.evaluate((plain) => {
        const selection = window.getSelection()
        const anchor = selection?.anchorNode
        const target = (anchor?.nodeType === Node.TEXT_NODE ? anchor.parentElement : anchor) as
          | HTMLElement
          | null
        if (!target) return
        const dt = new DataTransfer()
        dt.setData('text/plain', plain)
        target.dispatchEvent(
          new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true })
        )
      }, ' A. footnote ')
      await page.waitForTimeout(400)
      const markdown = await getMarkdownContent(page, app)
      expect(markdown).toMatch(/I\. Hello\s+A\. footnote world/)
      expect(markdown).not.toMatch(/\n\s+A\. footnote\n/)
    } finally {
      await app.close()
    }
  })
})
