const ROMAN_VALUES = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1]
const ROMAN_UPPER = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I']
const ROMAN_LOWER = ['m', 'cm', 'd', 'cd', 'c', 'xc', 'l', 'xl', 'x', 'ix', 'v', 'iv', 'i']

// Some marker styles overlap by design: `I.` is both upper Roman and upper
// alpha, and `i.` is both lower alpha and lower Roman. Import callers must
// pair marker style with indent depth via `depthFromIndent`.
const MARKER_PATTERNS = [
  /^[IVXLCDM]+\.$/,
  /^[A-Z]+\.$/,
  /^\d+\.$/,
  /^[a-z]+\.$/,
  /^[ivxlcdm]+\.$/,
  /^\(\d+\)$/,
  /^\([a-z]+\)$/
]

const validateDepth = (depth) => {
  if (!Number.isInteger(depth) || depth < 1 || depth > 7) {
    throw new RangeError(`Outline depth must be 1-7, got ${depth}`)
  }
}

const validateIndex = (index) => {
  if (!Number.isInteger(index) || index < 1) {
    throw new RangeError(`Outline marker index must be a positive integer, got ${index}`)
  }
}

const toRoman = (num, upper = true) => {
  const syms = upper ? ROMAN_UPPER : ROMAN_LOWER
  let n = num
  let result = ''

  for (let i = 0; i < ROMAN_VALUES.length; i++) {
    while (n >= ROMAN_VALUES[i]) {
      result += syms[i]
      n -= ROMAN_VALUES[i]
    }
  }

  return result
}

const toAlpha = (num, upper = true) => {
  let n = num
  let result = ''
  const charCodeOffset = upper ? 65 : 97

  while (n > 0) {
    n -= 1
    result = String.fromCharCode(charCodeOffset + (n % 26)) + result
    n = Math.floor(n / 26)
  }

  return result
}

const formatMarker = (depth, index) => {
  validateDepth(depth)
  validateIndex(index)

  switch (depth) {
    case 1:
      return `${toRoman(index, true)}.`
    case 2:
      return `${toAlpha(index, true)}.`
    case 3:
      return `${index}.`
    case 4:
      return `${toAlpha(index, false)}.`
    case 5:
      return `${toRoman(index, false)}.`
    case 6:
      return `(${index})`
    case 7:
      return `(${toAlpha(index, false)})`
  }
}

export const computeMarker = (item, context = {}) => {
  const { depth, start, groupStart } = item
  const siblingIndex = context.siblingIndex ?? 0
  const index = groupStart && start != null ? start : siblingIndex + 1

  return formatMarker(depth, index)
}

export const markerWidth = (markerString) => {
  const trimmed = markerString.trimEnd()
  return trimmed.length + 1
}

const listIndentPadding = (markerLen, listIndentation) => {
  if (listIndentation === 'dfm') {
    return Math.max(0, 4 - markerLen)
  }

  const count =
    typeof listIndentation === 'number' ? Math.min(Math.max(listIndentation, 1), 4) : 1
  return Math.max(0, count - 1)
}

const markerForIndent = (ancestorMarkers, depth) => {
  return ancestorMarkers[depth - 1] || formatMarker(depth, 1)
}

export const indentForDepth = (depth, listIndentation, ancestorMarkers = []) => {
  validateDepth(depth)

  if (depth <= 1) {
    return 0
  }

  let indent = 0

  for (let d = 1; d < depth; d++) {
    const parentMarker = markerForIndent(ancestorMarkers, d)
    const parentMarkerLen = markerWidth(parentMarker)
    indent += parentMarkerLen + listIndentPadding(parentMarkerLen, listIndentation)
  }

  return indent
}

export const markerMatchesDepth = (marker, depth) => {
  if (depth < 1 || depth > 7) {
    return false
  }

  return MARKER_PATTERNS[depth - 1].test(marker)
}

export const depthFromIndent = (leadingSpaces, marker, listIndentation, ancestorMarkers = []) => {
  for (let depth = 1; depth <= 7; depth++) {
    if (
      leadingSpaces === indentForDepth(depth, listIndentation, ancestorMarkers) &&
      markerMatchesDepth(marker, depth)
    ) {
      return depth
    }
  }

  return null
}

/**
 * Find the nearest preceding outline item one depth above in a logical group.
 *
 * @param {Object} item Outline item to resolve.
 * @param {Object[]} group Logical outline group from `walkOutlineGroups`.
 * @returns {Object|null} The implicit parent, if one exists.
 */
export const findImplicitParentInGroup = (item, group) => {
  const itemIndex = group.indexOf(item)
  if (itemIndex < 0) {
    return null
  }

  for (let i = itemIndex - 1; i >= 0; i--) {
    if (group[i].depth === item.depth - 1) {
      return group[i]
    }
  }

  return null
}

const ROOT_PARENT = {}

const getSiblingCountMap = (siblingCounts, parent) => {
  const parentKey = parent || ROOT_PARENT
  let countMap = siblingCounts.get(parentKey)

  if (!countMap) {
    countMap = new Map()
    siblingCounts.set(parentKey, countMap)
  }

  return countMap
}

const buildAncestorMarkersFromParents = (item, parentByItem, markerByItem) => {
  const markers = []
  let current = parentByItem.get(item)

  while (current) {
    markers.unshift(markerByItem.get(current))
    current = parentByItem.get(current)
  }

  return markers
}

/**
 * Compute render metadata for all outline items in one document walk.
 *
 * @param {Object[]} blocks Top-level document blocks.
 * @param {number|string} listIndentation Existing list indentation preference.
 * @returns {Map<Object, {marker: string, indent: number, siblingIndex: number}>} Metadata by item.
 */
export const getOutlineRenderMetaMap = (blocks, listIndentation) => {
  const metaByItem = new Map()

  for (const group of walkOutlineGroups(blocks)) {
    const lastByDepth = []
    const parentByItem = new Map()
    const markerByItem = new Map()
    const siblingCounts = new Map()

    for (const item of group) {
      const parent = item.depth > 1 ? lastByDepth[item.depth - 1] || null : null
      const countMap = getSiblingCountMap(siblingCounts, parent)
      const siblingIndex = countMap.get(item.depth) || 0
      const marker = computeMarker(item, { siblingIndex })

      parentByItem.set(item, parent)
      markerByItem.set(item, marker)
      countMap.set(item.depth, siblingIndex + 1)
      lastByDepth[item.depth] = item

      const ancestorMarkers = buildAncestorMarkersFromParents(item, parentByItem, markerByItem)

      metaByItem.set(item, {
        marker,
        indent: indentForDepth(item.depth, listIndentation, ancestorMarkers),
        siblingIndex
      })
    }
  }

  return metaByItem
}

/**
 * Compute marker, sibling index, and cumulative indent for rendering one item.
 *
 * @param {Object} item Outline item to render.
 * @param {Object[]} blocks Top-level document blocks.
 * @param {number|string} listIndentation Existing list indentation preference.
 * @returns {{marker: string, indent: number, siblingIndex: number}} Render metadata.
 */
export const getOutlineRenderMeta = (item, blocks, listIndentation) => {
  const meta = getOutlineRenderMetaMap(blocks, listIndentation).get(item)
  if (meta) {
    return meta
  }

  return {
    marker: computeMarker(item),
    indent: indentForDepth(item.depth, listIndentation),
    siblingIndex: 0
  }
}

export function * walkOutlineGroups(blocks) {
  let currentGroup = []

  for (const block of blocks) {
    if (block.type !== 'outline-item') {
      continue
    }

    if (block.groupStart && currentGroup.length > 0) {
      yield currentGroup
      currentGroup = []
    }

    currentGroup.push(block)
  }

  if (currentGroup.length > 0) {
    yield currentGroup
  }
}
