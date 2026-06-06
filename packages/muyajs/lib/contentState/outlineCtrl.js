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
}

export default outlineCtrl
