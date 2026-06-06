import { getOutlineRenderMeta } from './outlineUtils'
import { escapeHTML } from '../utils'

/**
 * Render one outline item as flat export HTML (not nested lists).
 *
 * @param {Object} block Outline item block.
 * @param {Object[]} blocks Top-level document blocks.
 * @param {number|string} listIndentation List indentation preference.
 * @param {string} bodyHtml Rendered body HTML for the item.
 * @returns {string} Flat outline-item markup.
 */
export const renderOutlineItemHtml = (block, blocks, listIndentation, bodyHtml) => {
  const { marker, indent } = getOutlineRenderMeta(block, blocks, listIndentation)
  const paddingStyle = indent > 0 ? ` style="padding-left: ${indent}ch"` : ''

  return (
    `<div class="outline-item" data-depth="${block.depth}"${paddingStyle}>` +
    `<span class="outline-marker">${escapeHTML(marker)}</span>` +
    `<div class="outline-body">${bodyHtml}</div>` +
    '</div>'
  )
}
