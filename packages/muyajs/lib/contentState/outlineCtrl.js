import {
  findImplicitParentInGroup,
  walkOutlineGroups
} from '../utils/outlineUtils'

const outlineCtrl = (ContentState) => {
  ContentState.prototype.getOutlineGroupForItem = function(item) {
    for (const group of walkOutlineGroups(this.blocks)) {
      if (group.includes(item)) {
        return group
      }
    }

    return null
  }

  ContentState.prototype.findImplicitParent = function(item) {
    const group = this.getOutlineGroupForItem(item)
    if (!group) {
      return null
    }

    return findImplicitParentInGroup(item, group)
  }

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

  ContentState.prototype.getOutlineItemAtCursor = function() {
    if (!this.isCollapse()) {
      return null
    }

    const { start } = this.cursor
    const startBlock = this.getBlock(start.key)
    if (!startBlock) {
      return null
    }

    const paragraph = this.getParent(startBlock)
    if (!paragraph || paragraph.type !== 'p') {
      return null
    }

    const item = this.getParent(paragraph)
    if (!item || item.type !== 'outline-item') {
      return null
    }

    return item
  }

  ContentState.prototype.isIndentableOutlineItem = function() {
    const item = this.getOutlineItemAtCursor()
    return !!item && item.depth < 7
  }

  ContentState.prototype.isOutdentableOutlineItem = function(block) {
    if (!this.isCollapse()) {
      return false
    }

    const startBlock = block || this.getBlock(this.cursor.start.key)
    const paragraph = this.getParent(startBlock)
    if (!paragraph || paragraph.type !== 'p') {
      return false
    }

    const item = this.getParent(paragraph)
    return !!item && item.type === 'outline-item' && item.depth > 1
  }

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
    const followers = []

    for (let i = itemIndex + 1; i < this.blocks.length; i++) {
      const block = this.blocks[i]

      if (block.type !== 'outline-item') {
        break
      }

      if (block.depth !== oldDepth) {
        break
      }

      if (findImplicitParentInGroup(block, group) !== oldParent) {
        break
      }

      followers.push(block)
    }

    movedItem.depth = newDepth

    const childDepth = newDepth + 1
    if (childDepth <= 7) {
      for (const follower of followers) {
        follower.depth = childDepth
      }
    }

    return true
  }

  ContentState.prototype.indentOutlineItem = function() {
    const item = this.getOutlineItemAtCursor()
    if (!item || item.depth >= 7) {
      return false
    }

    this.reparentingCascade(item, 1)
    return this.partialRender()
  }

  ContentState.prototype.outdentOutlineItem = function() {
    const item = this.getOutlineItemAtCursor()
    if (!item || item.depth <= 1) {
      return false
    }

    this.reparentingCascade(item, -1)
    return this.partialRender()
  }
}

export default outlineCtrl
