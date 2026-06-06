import ExportHtml from 'muya/lib/utils/exportHtml'

const markdownToHtml = async(
  markdown: string,
  muya?: unknown,
  blocks?: unknown[]
): Promise<string> => {
  const html = await new ExportHtml(markdown, muya, blocks).renderHtml()
  return `<article class="markdown-body">${html}</article>`
}

export default markdownToHtml
