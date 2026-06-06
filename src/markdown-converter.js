import { marked } from 'marked'

/**
 * 将 Markdown 转换为 HTML（用于富文本预览）
 * @param {string} markdown - Markdown 文本
 * @returns {string} HTML 内容
 */
export function convertMarkdownToHtml(markdown) {
  // 配置 marked 选项
  marked.setOptions({
    breaks: true,
    gfm: true
  })
  
  // 解析 Markdown 为 HTML
  const html = marked.parse(markdown)
  
  return html
}
