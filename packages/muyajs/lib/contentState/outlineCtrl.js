const outlineCtrl = (ContentState) => {
  ContentState.prototype.findImplicitParent = function(_item) {
    return null
  }

  ContentState.prototype.findOutlineSiblings = function(_item) {
    return []
  }
}

export default outlineCtrl
