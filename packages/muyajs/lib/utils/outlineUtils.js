const ROMAN_VALUES = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1]
const ROMAN_UPPER = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I']
const ROMAN_LOWER = ['m', 'cm', 'd', 'cd', 'c', 'xc', 'l', 'xl', 'x', 'ix', 'v', 'iv', 'i']

const MARKER_PATTERNS = [
  /^[IVXLCDM]+\.$/,
  /^[A-Z]\.$/,
  /^\d+\.$/,
  /^[a-z]\.$/,
  /^[ivxlcdm]+\.$/,
  /^\(\d+\)$/,
  /^\([a-z]\)$/
]

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

const formatMarker = (depth, index) => {
  switch (depth) {
    case 1:
      return `${toRoman(index, true)}.`
    case 2:
      return `${String.fromCharCode(64 + index)}.`
    case 3:
      return `${index}.`
    case 4:
      return `${String.fromCharCode(96 + index)}.`
    case 5:
      return `${toRoman(index, false)}.`
    case 6:
      return `(${index})`
    case 7:
      return `(${String.fromCharCode(96 + index)})`
    default:
      throw new RangeError(`Outline depth must be 1–7, got ${depth}`)
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

  return Math.max(0, Number(listIndentation) - 1)
}

export const indentForDepth = (depth, listIndentation) => {
  if (depth <= 1) {
    return 0
  }

  let indent = 0

  for (let d = 1; d < depth; d++) {
    const parentMarker = formatMarker(d, 1)
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

export const depthFromIndent = (leadingSpaces, marker, listIndentation) => {
  for (let depth = 1; depth <= 7; depth++) {
    if (
      leadingSpaces === indentForDepth(depth, listIndentation) &&
      markerMatchesDepth(marker, depth)
    ) {
      return depth
    }
  }

  return null
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
