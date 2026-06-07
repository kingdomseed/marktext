import copyIcon from '../../assets/pngicon/copy/2.png'
import newIcon from '../../assets/pngicon/paragraph/2.png'
import deleteIcon from '../../assets/pngicon/delete/2.png'
import turnIcon from '../../assets/pngicon/turninto/2.png'
import { isOsx } from '../../config'
import { createQuickInsertObj, filterOutlineMenuEntries } from '../quickInsert/config'

// Creates a function to generate the submenu, accepting a translation function as a parameter
const createWholeSubMenu = (t) => {
  const quickInsertObj = createQuickInsertObj(t)
  return Object.keys(quickInsertObj).reduce((acc, key) => {
    const items = quickInsertObj[key]
    return [...acc, ...items]
  }, [])
}

const COMMAND_KEY = isOsx ? '⌘' : '⌃'
const OPTION_KEY = isOsx ? '⌥' : 'Alt'
const SHIFT_KEY = isOsx ? '⇧' : 'Shift'
const RESTART_OUTLINE_GROUP_SHORTCUT = isOsx
  ? `${OPTION_KEY}${SHIFT_KEY}${COMMAND_KEY}G`
  : ''
const PARAGRAPH_BLOCKED_LABELS = new Set(['front-matter', 'hr', 'table'])
const MULTILINE_PARAGRAPH_BLOCKED_LABELS = new Set([
  ...PARAGRAPH_BLOCKED_LABELS,
  'heading 1',
  'heading 2',
  'heading 3',
  'heading 4',
  'heading 5',
  'heading 6'
])
const HEADING_LABELS = new Set([
  'paragraph',
  'heading 1',
  'heading 2',
  'heading 3',
  'heading 4',
  'heading 5',
  'heading 6',
  'outline-item'
])
const LIST_LABELS = new Set(['ul-bullet', 'ul-task', 'ol-order'])
const OUTLINE_COMPATIBLE_BLOCKED_LABELS = new Set([
  'front-matter',
  'hr',
  'table',
  ...LIST_LABELS
])

// Function to create the menu, accepting a translation function as a parameter
export const createMenu = (t) => {
  // If no translation function is provided, return the key name directly
  const translate = t || ((key) => key)

  return [
    {
      icon: copyIcon,
      label: 'duplicate',
      text: translate('frontMenu.duplicate'),
      shortCut: `⇧${COMMAND_KEY}P`
    },
    {
      icon: turnIcon,
      label: 'turnInto',
      text: translate('frontMenu.turnInto')
    },
    {
      icon: turnIcon,
      label: 'new-outline-group',
      text: translate('frontMenu.newOutlineGroup'),
      shortCut: RESTART_OUTLINE_GROUP_SHORTCUT
    },
    {
      icon: newIcon,
      label: 'new',
      text: translate('frontMenu.newParagraph'),
      shortCut: `⇧${COMMAND_KEY}N`
    },
    {
      icon: deleteIcon,
      label: 'delete',
      text: translate('frontMenu.delete'),
      shortCut: `⇧${COMMAND_KEY}D`
    }
  ]
}

// Retained for backward compatibility as the default menu export
export const menu = createMenu()

// Create the getLabel function, accepting a translation function as a parameter
export const createGetLabel = (t) => {
  // If no translation function is provided, return the key name directly
  const translate = t || ((key) => key)

  return (block) => {
    const { type, functionType, listType } = block
    let label = ''
    switch (type) {
      case 'p': {
        label = translate('frontMenu.paragraph')
        break
      }
      case 'figure': {
        if (functionType === 'table') {
          label = translate('frontMenu.table')
        } else if (functionType === 'html') {
          label = translate('frontMenu.html')
        } else if (functionType === 'multiplemath') {
          label = translate('frontMenu.mathblock')
        }
        break
      }
      case 'pre': {
        if (functionType === 'fencecode' || functionType === 'indentcode') {
          label = translate('frontMenu.pre')
        } else if (functionType === 'frontmatter') {
          label = translate('frontMenu.frontMatter')
        }
        break
      }
      case 'ul': {
        if (listType === 'task') {
          label = translate('frontMenu.ulTask')
        } else {
          label = translate('frontMenu.ulBullet')
        }
        break
      }
      case 'ol': {
        label = translate('frontMenu.olOrder')
        break
      }
      case 'blockquote': {
        label = translate('frontMenu.blockquote')
        break
      }
      case 'h1': {
        label = translate('frontMenu.heading1')
        break
      }
      case 'h2': {
        label = translate('frontMenu.heading2')
        break
      }
      case 'h3': {
        label = translate('frontMenu.heading3')
        break
      }
      case 'h4': {
        label = translate('frontMenu.heading4')
        break
      }
      case 'h5': {
        label = translate('frontMenu.heading5')
        break
      }
      case 'h6': {
        label = translate('frontMenu.heading6')
        break
      }
      case 'hr': {
        label = translate('frontMenu.hr')
        break
      }
      case 'outline-item': {
        label = translate('frontMenu.outlineItem')
        break
      }
      default:
        label = translate('frontMenu.paragraph')
        break
    }
    return label
  }
}

// Retained for backward compatibility; export the default getLabel
export const getLabel = createGetLabel()

export const createGetSubMenu = (t, outlineBlocksEnabled = true) => {
  const wholeSubMenu = filterOutlineMenuEntries(createWholeSubMenu(t), outlineBlocksEnabled)

  return (block, startBlock, endBlock) => {
    const { type } = block
    switch (type) {
      case 'p': {
        return wholeSubMenu.filter((menuItem) => {
          const blockedLabels =
            startBlock.key === endBlock.key
              ? PARAGRAPH_BLOCKED_LABELS
              : MULTILINE_PARAGRAPH_BLOCKED_LABELS

          return !blockedLabels.has(menuItem.label)
        })
      }
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6': {
        return wholeSubMenu.filter((menuItem) => {
          return HEADING_LABELS.has(menuItem.label)
        })
      }
      case 'outline-item': {
        return wholeSubMenu.filter((menuItem) => {
          return !OUTLINE_COMPATIBLE_BLOCKED_LABELS.has(menuItem.label)
        })
      }
      case 'ul':
      case 'ol': {
        return wholeSubMenu.filter((menuItem) => {
          return LIST_LABELS.has(menuItem.label)
        })
      }
      case 'blockquote': {
        return wholeSubMenu.filter((menuItem) => {
          return !OUTLINE_COMPATIBLE_BLOCKED_LABELS.has(menuItem.label)
        })
      }
      default:
        return []
    }
  }
}

// Create the default getSubMenu function
export const getSubMenu = createGetSubMenu()
