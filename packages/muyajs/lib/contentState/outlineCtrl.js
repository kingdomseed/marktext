import {
  findImplicitParentInGroup,
  walkOutlineGroups
} from '../utils/outlineUtils'

const outlineCtrl = (ContentState) => {
  /**
   * Find the logical outline group that owns an outline item.
   *
   * @param {Object} item Outline item to resolve.
   * @returns {Object[]|null} Logical outline group, if found.
   */
  ContentState.prototype.getOutlineGroupForItem = function(item) {
    for (const group of walkOutlineGroups(this.blocks)) {
      if (group.includes(item)) {
        return group
      }
    }

    return null
  }

  /**
   * Find the nearest preceding outline item at depth - 1 in the same group.
   *
   * @param {Object} item Outline item to resolve.
   * @returns {Object|null} The implicit parent, if one exists.
   */
  ContentState.prototype.findImplicitParent = function(item) {
    const group = this.getOutlineGroupForItem(item)
    if (!group) {
      return null
    }

    return findImplicitParentInGroup(item, group)
  }

  /**
   * Find same-depth outline items that share this item's implicit parent.
   *
   * @param {Object} item Outline item to resolve.
   * @returns {Object[]} Logical siblings in the same outline group.
   */
  ContentState.prototype.findOutlineSiblings = function(item) {
    const group = this.getOutlineGroupForItem(item)
    if (!group) {
      return []
    }

    const parent = findImplicitParentInGroup(item, group)

    return group.filter((candidate) => {
      return (
        candidate.depth === item.depth &&
        findImplicitParentInGroup(candidate, group) === parent
      )
    })
  }

  /**
   * Return the outline item that owns a text or paragraph block, if any.
   *
   * @param {Object} block Text or paragraph block to resolve.
   * @returns {Object|null} Owning outline item.
   */
  ContentState.prototype.getOutlineItemForBlock = function(block) {
    if (!block) {
      return null
    }

    const paragraph = block.type === 'p' ? block : this.getParent(block)
    if (!paragraph || paragraph.type !== 'p') {
      return null
    }

    const item = this.getParent(paragraph)
    if (!item || item.type !== 'outline-item') {
      return null
    }

    return item
  }

  /**
   * Return the outline item that owns the collapsed cursor, if any.
   *
   * @returns {Object|null} Outline item at the cursor.
   */
  ContentState.prototype.getOutlineItemAtCursor = function() {
    if (!this.isCollapse()) {
      return null
    }

    const { start } = this.cursor
    const startBlock = this.getBlock(start.key)
    if (!startBlock) {
      return null
    }

    return this.getOutlineItemForBlock(startBlock)
  }

  /**
   * Check whether Tab can indent the outline item at the cursor.
   *
   * @param {Object} [block] Text block at the cursor.
   * @returns {boolean} True when the current outline item can indent.
   */
  ContentState.prototype.isIndentableOutlineItem = function(block) {
    const item = block ? this.getOutlineItemForBlock(block) : this.getOutlineItemAtCursor()
    return !!item && item.depth < 7
  }

  /**
   * Check whether Shift+Tab can outdent an outline item.
   *
   * @param {Object} [block] Text block at the cursor.
   * @returns {boolean} True when the current outline item can outdent.
   */
  ContentState.prototype.isOutdentableOutlineItem = function(block) {
    if (!this.isCollapse()) {
      return false
    }

    const startBlock = block || this.getBlock(this.cursor.start.key)
    const item = this.getOutlineItemForBlock(startBlock)
    return !!item && item.type === 'outline-item' && item.depth > 1
  }

  /**
   * Change an outline item's depth and apply the AR-1 reparenting cascade.
   *
   * Existing descendants shift with the moved item. Following contiguous
   * same-depth siblings become children of the moved item at new depth + 1,
   * and their descendants shift with them.
   *
   * @param {Object} movedItem Outline item being moved.
   * @param {number} deltaDepth Depth change for the moved item.
   * @returns {boolean} True when the cascade was applied.
   */
  ContentState.prototype.reparentingCascade = function(movedItem, deltaDepth) {
    const oldDepth = movedItem.depth
    const newDepth = oldDepth + deltaDepth

    if (newDepth < 1 || newDepth > 7) {
      return false
    }

    const group = this.getOutlineGroupForItem(movedItem)
    if (!group) {
      return false
    }

    const oldParent = findImplicitParentInGroup(movedItem, group)
    const itemIndex = this.findIndex(this.blocks, movedItem)
    const movedItems = [{ item: movedItem, depthDelta: deltaDepth }]
    let descendantDepthDelta = deltaDepth

    // Logical groups span paragraphs, but cascade only moves the physically
    // contiguous outline run after the moved item.
    for (let i = itemIndex + 1; i < this.blocks.length; i++) {
      const block = this.blocks[i]

      if (block.type !== 'outline-item' || !group.includes(block)) {
        break
      }

      if (block.depth > oldDepth) {
        movedItems.push({ item: block, depthDelta: descendantDepthDelta })
        continue
      }

      if (block.depth !== oldDepth || findImplicitParentInGroup(block, group) !== oldParent) {
        break
      }

      // Same-depth followers become children of the moved item. For outdent,
      // that means a zero depth delta: they stay at oldDepth under a shallower parent.
      descendantDepthDelta = deltaDepth + 1
      movedItems.push({ item: block, depthDelta: descendantDepthDelta })
    }

    for (const { item, depthDelta } of movedItems) {
      const nextDepth = item.depth + depthDelta
      if (nextDepth < 1 || nextDepth > 7) {
        return false
      }
    }

    for (const { item, depthDelta } of movedItems) {
      item.depth += depthDelta
    }

    return true
  }

  /**
   * Indent the outline item at the cursor one depth level.
   *
   * @param {Object} [item] Outline item to indent.
   * @returns {Object|boolean} Render result, or false when no change happened.
   */
  ContentState.prototype.indentOutlineItem = function(item = this.getOutlineItemAtCursor()) {
    if (!item || item.depth >= 7) {
      return false
    }

    return this.reparentingCascade(item, 1) ? this.partialRender() : false
  }

  /**
   * Outdent the outline item at the cursor one depth level.
   *
   * @param {Object} [item] Outline item to outdent.
   * @returns {Object|boolean} Render result, or false when no change happened.
   */
  ContentState.prototype.outdentOutlineItem = function(item = this.getOutlineItemAtCursor()) {
    if (!item || item.depth <= 1) {
      return false
    }

    return this.reparentingCascade(item, -1) ? this.partialRender() : false
  }

  /**
   * Find following outline descendants that currently belong under an item.
   *
   * Non-outline blocks are transparent for outline parentage, so this walks the
   * logical group until the next outline item at this depth or higher.
   *
   * @param {Object} item Outline item whose descendants should be collected.
   * @returns {Object[]} Following descendant outline items.
   */
  ContentState.prototype.getFollowingOutlineDescendants = function(item) {
    const group = this.getOutlineGroupForItem(item)
    const itemIndex = this.findIndex(this.blocks, item)
    if (!group || itemIndex < 0) {
      return []
    }

    const descendants = []
    for (let i = itemIndex + 1; i < this.blocks.length; i++) {
      const block = this.blocks[i]
      if (block.type !== 'outline-item') {
        continue
      }

      if (!group.includes(block) || block.depth <= item.depth) {
        break
      }

      descendants.push(block)
    }

    return descendants
  }

  /**
   * Find the next outline item in the same logical group.
   *
   * @param {Object} item Outline item to search after.
   * @returns {Object|null} Next outline item in the same group.
   */
  ContentState.prototype.getNextOutlineItemInGroup = function(item) {
    const group = this.getOutlineGroupForItem(item)
    const itemIndex = this.findIndex(this.blocks, item)
    if (!group || itemIndex < 0) {
      return null
    }

    for (let i = itemIndex + 1; i < this.blocks.length; i++) {
      const block = this.blocks[i]
      if (block.type !== 'outline-item') {
        continue
      }

      return group.includes(block) ? block : null
    }

    return null
  }

  /**
   * Preserve an explicit group boundary when removing its current root item.
   *
   * @param {Object} item Outline item that may own the group-start marker.
   */
  ContentState.prototype.transferOutlineGroupStart = function(item) {
    if (!item.groupStart) {
      return
    }

    const nextItem = this.getNextOutlineItemInGroup(item)
    if (!nextItem) {
      return
    }

    nextItem.groupStart = true
    nextItem.start = item.start
  }

  /**
   * Promote nested outline items after their owning wrapper is removed.
   *
   * @param {Object} item Outline item being removed or converted.
   */
  ContentState.prototype.promoteOutlineDescendants = function(item) {
    const descendants = this.getFollowingOutlineDescendants(item)
    descendants.forEach((descendant) => {
      descendant.depth -= 1
    })
  }

  /**
   * Resolve where a new same-depth sibling should be inserted.
   *
   * @param {Object} item Outline item that receives a new sibling.
   * @returns {Object} Last existing descendant, or the item itself.
   */
  ContentState.prototype.getOutlineSiblingInsertionReference = function(item) {
    const descendants = this.getFollowingOutlineDescendants(item)
    return descendants[descendants.length - 1] || item
  }

  /**
   * Check whether an outline item's editable body is empty.
   *
   * @param {Object} item Outline item to inspect.
   * @returns {boolean} True when the body has no text.
   */
  ContentState.prototype.isOutlineBodyEmpty = function(item) {
    const paragraph = item.children[0]
    if (!paragraph || paragraph.type !== 'p') {
      return true
    }

    return paragraph.children.every((child) => !child.text)
  }

  /**
   * Find an immediately adjacent prior same-depth outline sibling.
   *
   * @param {Object} item Outline item to inspect.
   * @returns {Object|null} Adjacent prior sibling, if one exists.
   */
  ContentState.prototype.getAdjacentPriorOutlineSibling = function(item) {
    const index = this.findIndex(this.blocks, item)
    if (index <= 0) {
      return null
    }

    const previous = this.blocks[index - 1]
    if (previous.type !== 'outline-item' || previous.depth !== item.depth) {
      return null
    }

    const parent = this.findImplicitParent(item)
    const previousParent = this.findImplicitParent(previous)

    return parent === previousParent ? previous : null
  }

  /**
   * Insert a same-depth sibling without stealing existing descendants.
   *
   * @param {Object} item Outline item receiving a new sibling.
   * @returns {Object} Render result.
   */
  ContentState.prototype.insertOutlineSibling = function(item) {
    const newItem = this.createOutlineItem(item.depth)
    const reference = this.getOutlineSiblingInsertionReference(item)
    this.insertAfter(newItem, reference)
    const key = newItem.children[0].children[0].key

    this.cursor = {
      start: { key, offset: 0 },
      end: { key, offset: 0 },
      isEdit: true
    }

    return this.partialRender()
  }

  /**
   * Convert an outline item into a plain paragraph and promote descendants.
   *
   * @param {Object} item Outline item to convert.
   * @returns {Object} Render result.
   */
  ContentState.prototype.exitOutlineToParagraph = function(item) {
    const index = this.findIndex(this.blocks, item)
    const bodyText = item.children[0].children.map((child) => child.text).join('\n')
    const newBlock = this.createBlockP(bodyText)
    const previous = item.preSibling ? this.getBlock(item.preSibling) : null
    const next = item.nextSibling ? this.getBlock(item.nextSibling) : null

    newBlock.preSibling = item.preSibling
    newBlock.nextSibling = item.nextSibling

    if (previous) {
      previous.nextSibling = newBlock.key
    }

    if (next) {
      next.preSibling = newBlock.key
    }

    this.promoteOutlineDescendants(item)
    this.transferOutlineGroupStart(item)
    this.blocks.splice(index, 1, newBlock)

    const key = newBlock.children[0].key
    this.cursor = {
      start: { key, offset: 0 },
      end: { key, offset: 0 },
      isEdit: true
    }

    return this.partialRender()
  }

  /**
   * Merge an outline item body into its adjacent prior sibling.
   *
   * @param {Object} item Outline item being merged.
   * @param {Object} priorSibling Adjacent same-depth outline sibling.
   * @returns {Object} Render result.
   */
  ContentState.prototype.mergeOutlineSiblings = function(item, priorSibling) {
    const priorParagraph = priorSibling.children[0]
    const itemParagraph = item.children[0]
    const priorSpan = priorParagraph.children[0]
    const itemSpan = itemParagraph.children[0]
    const offset = priorSpan.text.length

    priorSpan.text += itemSpan.text
    this.removeBlock(item)

    this.cursor = {
      start: { key: priorSpan.key, offset },
      end: { key: priorSpan.key, offset },
      isEdit: true
    }

    return this.partialRender()
  }

  /**
   * Delete an outline item and promote any nested descendants.
   *
   * @param {Object} item Outline item to delete.
   * @returns {Object} Render result.
   */
  ContentState.prototype.deleteOutlineItem = function(item) {
    const index = this.findIndex(this.blocks, item)
    let key
    let offset = 0

    const previous = index > 0 ? this.blocks[index - 1] : null
    if (previous?.type === 'outline-item') {
      const span = previous.children[0].children[0]
      key = span.key
      offset = span.text.length
    } else if (index < this.blocks.length - 1) {
      const next = this.blocks[index + 1]
      if (next.type === 'outline-item') {
        key = next.children[0].children[0].key
      } else if (next.type === 'p') {
        key = next.children[0].key
      }
    }

    this.promoteOutlineDescendants(item)
    this.transferOutlineGroupStart(item)
    this.removeBlock(item)

    if (key) {
      this.cursor = {
        start: { key, offset },
        end: { key, offset },
        isEdit: true
      }
    }

    return this.partialRender()
  }

  /**
   * Handle Enter inside an outline item body.
   *
   * @param {Object} outlineItem Outline item at the cursor.
   * @param {Object} bodyBlock Paragraph body block.
   * @param {Object} start Cursor start position.
   * @returns {Object|boolean} Render result, or false when no change happened.
   */
  ContentState.prototype.enterInOutlineItem = function(outlineItem, bodyBlock, start) {
    const activeLine = this.getBlock(start.key)
    const text = activeLine.text
    const left = start.offset
    const right = text.length - left

    if (left === 0 && right === 0 && this.isOutlineBodyEmpty(outlineItem)) {
      if (outlineItem.depth === 1) {
        return this.exitOutlineToParagraph(outlineItem)
      }

      return this.outdentOutlineItem(outlineItem)
    }

    if (left !== 0 && right !== 0) {
      const newBodyBlock = this.chopBlockByCursor(bodyBlock, start.key, start.offset)
      const newItem = this.createOutlineItem(outlineItem.depth)
      newItem.children = [newBodyBlock]
      newBodyBlock.parent = newItem.key
      const reference = this.getOutlineSiblingInsertionReference(outlineItem)
      this.insertAfter(newItem, reference)

      const key = newBodyBlock.children[0].key
      this.cursor = {
        start: { key, offset: 0 },
        end: { key, offset: 0 },
        isEdit: true
      }

      return this.partialRender()
    }

    if (left !== 0 && right === 0) {
      return this.insertOutlineSibling(outlineItem)
    }

    if (left === 0 && right !== 0) {
      const newItem = this.createOutlineItem(outlineItem.depth)
      this.insertBefore(newItem, outlineItem)

      const key = outlineItem.children[0].children[0].key
      this.cursor = {
        start: { key, offset: 0 },
        end: { key, offset: 0 },
        isEdit: true
      }

      return this.partialRender()
    }

    return this.insertOutlineSibling(outlineItem)
  }

  /**
   * Dispatch an outline-specific Backspace action.
   *
   * @param {Object} outlineItem Outline item at the cursor.
   * @param {string} info Backspace action kind.
   * @param {Object} [priorSibling] Adjacent sibling for merge actions.
   * @returns {Object|boolean} Render result, or false when no action matched.
   */
  /**
   * Find the nearest preceding outline item for Turn Into depth continuation.
   *
   * @param {Object} referenceBlock Block being converted or inserted near.
   * @returns {Object|null} Nearest preceding outline item, if any.
   */
  ContentState.prototype.findNearestPrecedingOutlineItem = function(referenceBlock) {
    const outmost = this.findOutMostBlock(referenceBlock)
    const index = this.findIndex(this.blocks, outmost)
    if (index < 0) {
      return null
    }

    for (let i = index - 1; i >= 0; i--) {
      if (this.blocks[i].type === 'outline-item') {
        return this.blocks[i]
      }
    }

    return null
  }

  /**
   * Resolve Turn Into depth from nearest preceding outline item in the group.
   *
   * @param {Object} referenceBlock Block being converted.
   * @returns {number} Outline depth from 1 to 7.
   */
  ContentState.prototype.getOutlineTurnIntoDepth = function(referenceBlock) {
    const preceding = this.findNearestPrecedingOutlineItem(referenceBlock)
    return preceding ? preceding.depth : 1
  }

  /**
   * Mark an outline item as the root of a new logical group.
   *
   * @param {Object} item Outline item to restart.
   * @param {number} [start=1] Restart marker index for depth-1 Roman marker.
   * @returns {Object} Render result.
   */
  ContentState.prototype.restartOutlineGroup = function(item, start = 1) {
    if (!item || item.type !== 'outline-item' || item.depth !== 1) {
      return false
    }

    item.groupStart = true
    item.start = start
    return this.partialRender()
  }

  /**
   * Extract editable text from a top-level block being turned into outline.
   *
   * @param {Object} block Top-level paragraph, heading, or blockquote block.
   * @returns {string} Body text to preserve.
   */
  ContentState.prototype.getBlockBodyTextForOutline = function(block) {
    if (!block) {
      return ''
    }

    if (block.type === 'p') {
      return block.children.map((child) => child.text).join('\n')
    }

    if (/^h[1-6]$/.test(block.type)) {
      return block.children[0]?.text || ''
    }

    if (block.type === 'blockquote') {
      return block.children
        .filter((child) => child.type === 'p')
        .map((child) => child.children.map((span) => span.text).join('\n'))
        .join('\n')
    }

    return ''
  }

  /**
   * Replace a top-level block with an outline item, preserving body text.
   *
   * @param {Object} block Top-level block to convert.
   * @param {number} depth Target outline depth.
   * @param {boolean} [insertMode=false] Insert after instead of replacing.
   * @returns {Object|boolean} Render result, or false when conversion failed.
   */
  ContentState.prototype.replaceBlockWithOutlineItem = function(
    block,
    depth,
    insertMode = false
  ) {
    const bodyText = this.getBlockBodyTextForOutline(block)
    const item = this.createOutlineItem(depth)
    item.children[0].children[0].text = bodyText

    if (insertMode) {
      this.insertAfter(item, block)
    } else {
      const index = this.findIndex(this.blocks, block)
      if (index < 0) {
        return false
      }

      item.preSibling = block.preSibling
      item.nextSibling = block.nextSibling

      const previous = block.preSibling ? this.getBlock(block.preSibling) : null
      const next = block.nextSibling ? this.getBlock(block.nextSibling) : null

      if (previous) {
        previous.nextSibling = item.key
      }

      if (next) {
        next.preSibling = item.key
      }

      this.blocks.splice(index, 1, item)
    }

    const key = item.children[0].children[0].key
    const offset = bodyText.length
    this.cursor = {
      start: { key, offset },
      end: { key, offset },
      isEdit: true
    }

    return this.partialRender()
  }

  /**
   * Convert a top-level block into an outline item using Turn Into rules.
   *
   * @param {Object} block Editable block at the cursor.
   * @param {boolean} [insertMode=false] Insert after the source block.
   * @returns {Object|boolean} Render result, or false when conversion failed.
   */
  ContentState.prototype.turnBlockIntoOutlineItem = function(block, insertMode = false) {
    const outmost = this.findOutMostBlock(block)
    if (!outmost || outmost.type === 'outline-item') {
      return false
    }

    if (!/^(p|blockquote|h[1-6])$/.test(outmost.type)) {
      return false
    }

    const depth = this.getOutlineTurnIntoDepth(block)
    return this.replaceBlockWithOutlineItem(outmost, depth, insertMode)
  }

  /**
   * Convert an outline item into a heading and promote nested descendants.
   *
   * @param {Object} item Outline item to convert.
   * @param {number} level Heading level from 1 to 6.
   * @returns {Object|boolean} Render result, or false when conversion failed.
   */
  ContentState.prototype.turnOutlineIntoHeading = function(item, level) {
    if (!item || item.type !== 'outline-item' || level < 1 || level > 6) {
      return false
    }

    const bodyText = this.getBlockBodyTextForOutline(item.children[0])
    const heading = this.createBlock(`h${level}`, { headingStyle: 'atx' })
    const content = this.createBlock('span', {
      text: `${'#'.repeat(level)}${String.fromCharCode(160)}${bodyText}`,
      functionType: 'atxLine'
    })

    this.appendChild(heading, content)
    this.promoteOutlineDescendants(item)
    this.transferOutlineGroupStart(item)

    const index = this.findIndex(this.blocks, item)
    if (index < 0) {
      return false
    }

    heading.preSibling = item.preSibling
    heading.nextSibling = item.nextSibling

    const previous = item.preSibling ? this.getBlock(item.preSibling) : null
    const next = item.nextSibling ? this.getBlock(item.nextSibling) : null

    if (previous) {
      previous.nextSibling = heading.key
    }

    if (next) {
      next.preSibling = heading.key
    }

    this.blocks.splice(index, 1, heading)

    const key = content.key
    const offset = content.text.length
    this.cursor = {
      start: { key, offset },
      end: { key, offset },
      isEdit: true
    }

    return this.partialRender()
  }

  /**
   * Convert an outline item into a blockquote and promote nested descendants.
   *
   * @param {Object} item Outline item to convert.
   * @returns {Object|boolean} Render result, or false when conversion failed.
   */
  ContentState.prototype.turnOutlineIntoBlockquote = function(item) {
    if (!item || item.type !== 'outline-item') {
      return false
    }

    const bodyText = this.getBlockBodyTextForOutline(item.children[0])
    const quoteBlock = this.createBlock('blockquote')
    const paragraph = this.createBlockP(bodyText)

    this.appendChild(quoteBlock, paragraph)
    this.promoteOutlineDescendants(item)
    this.transferOutlineGroupStart(item)

    const index = this.findIndex(this.blocks, item)
    if (index < 0) {
      return false
    }

    quoteBlock.preSibling = item.preSibling
    quoteBlock.nextSibling = item.nextSibling

    const previous = item.preSibling ? this.getBlock(item.preSibling) : null
    const next = item.nextSibling ? this.getBlock(item.nextSibling) : null

    if (previous) {
      previous.nextSibling = quoteBlock.key
    }

    if (next) {
      next.preSibling = quoteBlock.key
    }

    this.blocks.splice(index, 1, quoteBlock)

    const key = paragraph.children[0].key
    const offset = bodyText.length
    this.cursor = {
      start: { key, offset },
      end: { key, offset },
      isEdit: true
    }

    return this.partialRender()
  }

  ContentState.prototype.handleOutlineBackspace = function(outlineItem, info, priorSibling) {
    switch (info) {
      case 'DELETE':
        return this.deleteOutlineItem(outlineItem)
      case 'MERGE':
        return this.mergeOutlineSiblings(outlineItem, priorSibling)
      case 'OUTDENT':
        return this.outdentOutlineItem(outlineItem)
      case 'EXIT':
        return this.exitOutlineToParagraph(outlineItem)
      default:
        return false
    }
  }
}

export default outlineCtrl
