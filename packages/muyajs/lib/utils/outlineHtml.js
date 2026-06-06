import { escapeHTML } from '../utils'

/**
 * Render one outline item as flat export HTML (not nested lists).
 *
 * @param {Object} block Outline item block.
 * @param {{marker: string, indent: number, siblingIndex: number}} renderMeta Precomputed render metadata.
 * @param {string} bodyHtml Rendered body HTML for the item.
 * @returns {string} Flat outline-item markup.
 */
export const renderOutlineItemHtml = (block, renderMeta, bodyHtml) => {
  const { marker, indent } = renderMeta
  const depth = Number.parseInt(block.depth, 10)
  const depthAttr = Number.isInteger(depth) && depth >= 1 ? ` data-depth="${depth}"` : ''
  const paddingStyle = indent > 0 ? ` style="padding-left: ${indent}ch"` : ''

  return (
    `<div class="outline-item"${depthAttr}${paddingStyle}>` +
    `<span class="outline-marker">${escapeHTML(marker)}</span>` +
    `<div class="outline-body">${bodyHtml}</div>` +
    '</div>'
  )
}
