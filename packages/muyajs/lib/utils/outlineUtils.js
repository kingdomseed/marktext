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

const OUTLINE_GROUP_START = /^<!-- mt:outline-group-start -->(?:\n|$)/
const OUTLINE_ITEM_LINE =
  /^([ ]*)((?:[IVXLCDM]+\.|[A-Z]+\.|\d+\.|[a-z]+\.|[ivxlcdm]+\.|\(\d+\)|\([a-z]+\)))(?:[ \t]+([^\n]*?))?(?:\n|$)/
const LINE = /^([^\n]*)(?:\n|$)/

const parseRomanNumeral = (roman) => {
  const map = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 }
  const str = roman.toUpperCase()
  let prev = 0
  let sum = 0

  for (let i = str.length - 1; i >= 0; i--) {
    const curr = map[str[i]]
    if (!curr) {
      return null
    }
    if (curr < prev) {
      sum -= curr
    } else {
      sum += curr
    }
    prev = curr
  }

  return sum
}

const parseAlphaNumeral = (value, upper = true) => {
  const str = upper ? value.toUpperCase() : value.toLowerCase()
  let result = 0
  const base = upper ? 65 : 97

  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i)
    if (code < base || code > base + 25) {
      return null
    }
    result = result * 26 + (code - base + 1)
  }

  return result
}

/**
 * Parse the numeric index encoded in a structural outline marker.
 *
 * @param {string} marker Marker text including trailing punctuation.
 * @param {number} depth Outline depth from 1 to 7.
 * @returns {number|null} Parsed marker index, if valid.
 */
export const parseMarkerIndex = (marker, depth) => {
  if (!markerMatchesDepth(marker, depth)) {
    return null
  }

  switch (depth) {
    case 1:
      return parseRomanNumeral(marker.slice(0, -1))
    case 2:
      return parseAlphaNumeral(marker.slice(0, -1), true)
    case 3:
      return parseInt(marker.slice(0, -1), 10)
    case 4:
      return parseAlphaNumeral(marker.slice(0, -1), false)
    case 5:
      return parseRomanNumeral(marker.slice(0, -1))
    case 6:
      return parseInt(marker.slice(1, -1), 10)
    case 7:
      return parseAlphaNumeral(marker.slice(1, -1), false)
    default:
      return null
  }
}

export const matchOutlineGroupStart = (src) => OUTLINE_GROUP_START.exec(src)

const buildAncestorMarkers = (lastByDepth, depth) => {
  const markers = []

  for (let d = 1; d < depth; d++) {
    if (lastByDepth[d]) {
      markers.push(lastByDepth[d])
    }
  }

  return markers
}

const buildNextLastByDepth = (lastByDepth, depth, marker) => {
  const nextLastByDepth = lastByDepth.slice()
  nextLastByDepth[depth] = marker

  for (let d = depth + 1; d <= 7; d++) {
    delete nextLastByDepth[d]
  }

  return nextLastByDepth
}

const lineStartsOutlineItem = (src, context, currentDepth, currentMarker) => {
  const cap = OUTLINE_ITEM_LINE.exec(src)
  if (!cap) {
    return false
  }

  const nextLastByDepth = buildNextLastByDepth(
    context.lastByDepth,
    currentDepth,
    currentMarker
  )
  const leadingSpaces = cap[1].length
  const marker = cap[2]
  const ancestorMarkers = buildAncestorMarkers(nextLastByDepth, 7)

  if (leadingSpaces === 0 && /^\d+\.$/.test(marker) && !context.outlineChainActive) {
    return false
  }

  const depth = depthFromIndent(leadingSpaces, marker, context.listIndentation, ancestorMarkers)
  if (depth === null) {
    return false
  }

  return !(depth === 3 && /^\d+\.$/.test(marker) && context.inListContext)
}

const parseOutlineContinuationLines = (src, continuationIndent, context, depth, marker) => {
  let rest = src
  let consumed = ''
  const lines = []

  while (rest) {
    if (OUTLINE_GROUP_START.test(rest)) {
      break
    }

    const line = LINE.exec(rest)
    if (!line || !line[0]) {
      break
    }

    const text = line[1]
    const leadingSpaces = /^ */.exec(text)[0].length
    if (leadingSpaces !== continuationIndent || !text.slice(continuationIndent)) {
      break
    }

    if (lineStartsOutlineItem(rest, context, depth, marker)) {
      break
    }

    lines.push(text.slice(continuationIndent))
    consumed += line[0]
    rest = rest.substring(line[0].length)
  }

  return { consumed, lines }
}

/**
 * Try to parse one outline marker line from import markdown.
 *
 * @param {string} src Remaining markdown source.
 * @param {Object} context Import lexer context.
 * @returns {Object|null} Parsed outline item payload.
 */
export const tryParseOutlineItem = (src, context) => {
  const {
    listIndentation,
    lastByDepth,
    outlineChainActive,
    inListContext,
    pendingGroupStart
  } = context

  const cap = OUTLINE_ITEM_LINE.exec(src)
  if (!cap) {
    return null
  }

  const leadingSpaces = cap[1].length
  const marker = cap[2]
  let body = cap[3] || ''
  const ancestorMarkers = buildAncestorMarkers(lastByDepth, 7)

  if (leadingSpaces === 0 && /^\d+\.$/.test(marker) && !outlineChainActive) {
    return null
  }

  const depth = depthFromIndent(leadingSpaces, marker, listIndentation, ancestorMarkers)
  if (depth === null) {
    return null
  }

  if (depth === 3 && /^\d+\.$/.test(marker) && inListContext) {
    return null
  }

  let groupStart = false
  let start

  if (pendingGroupStart && depth === 1) {
    groupStart = true
    start = parseMarkerIndex(marker, 1)
    if (start == null) {
      return null
    }
  }

  let consumed = cap[0]
  const continuation = parseOutlineContinuationLines(
    src.substring(consumed.length),
    leadingSpaces + markerWidth(marker),
    context,
    depth,
    marker
  )

  if (continuation.lines.length) {
    const continuationText = continuation.lines.join('\n')
    body = body ? `${body}\n${continuationText}` : continuationText
    consumed += continuation.consumed
  }

  return {
    consumed,
    depth,
    marker,
    text: body,
    groupStart,
    start
  }
}

export const updateOutlineImportState = (state, depth, marker) => {
  state.lastByDepth[depth] = marker

  for (let d = depth + 1; d <= 7; d++) {
    delete state.lastByDepth[d]
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
