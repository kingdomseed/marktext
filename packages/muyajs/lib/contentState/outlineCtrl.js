const outlineCtrl = (ContentState) => {
  /**
   * Find the nearest preceding outline item at depth - 1 in the same group.
   *
   * Stub only; implemented by the outline editing issue slices.
   */
  ContentState.prototype.findImplicitParent = function(_item) {
    return null
  }

  /**
   * Find same-depth outline items that share this item's implicit parent.
   *
   * Stub only; implemented by the outline editing issue slices.
   */
  ContentState.prototype.findOutlineSiblings = function(_item) {
    return []
  }
}

export default outlineCtrl
