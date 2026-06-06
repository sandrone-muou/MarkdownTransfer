import { convertMarkdownToHtml } from './markdown-converter.js'

// DOM 元素
const markdownInput = document.getElementById('markdown-input')
const previewOutput = document.getElementById('preview-output')
const copyBtn = document.getElementById('copy-btn')
const clearBtn = document.getElementById('clear-btn')

// 初始化应用
function init() {
  // 绑定事件监听器
  markdownInput.addEventListener('input', handleRealTimePreview)
  copyBtn.addEventListener('click', handleCopy)
  clearBtn.addEventListener('click', handleClear)
  
  // 添加示例 Markdown
  addExampleMarkdown()
  
  console.log('initialized')
}

// 实时预览
function handleRealTimePreview() {
  const markdown = markdownInput.value
  
  if (!markdown.trim()) {
    previewOutput.innerHTML = '<p class="placeholder">输入 Markdown 后在此预览富文本效果</p>'
    return
  }
  
  try {
    const html = convertMarkdownToHtml(markdown)
    previewOutput.innerHTML = html
  } catch (error) {
    console.error('parse error:', error)
    previewOutput.innerHTML = '<p class="error">格式错误</p>'
  }
}

// 处理复制
async function handleCopy() {
  const markdown = markdownInput.value
  
  if (!markdown.trim()) {
    showNotification('请输入 Markdown 内容', 'warning')
    return
  }
  
  try {
    // 获取预览区域的 HTML 内容
    const htmlContent = previewOutput.innerHTML
    
    // 创建一个临时的 div 元素来包含 HTML 内容
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = htmlContent
    
    // 使用现代 Clipboard API 复制富文本
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const clipboardItem = new ClipboardItem({ 'text/html': blob, 'text/plain': new Blob([tempDiv.textContent], { type: 'text/plain' }) })
    
    await navigator.clipboard.write([clipboardItem])
    
    showNotification('已复制', 'success')
  } catch (error) {
    console.error('copy error:', error)
    
    // 如果现代 API 失败，使用传统方法
    try {
      const range = document.createRange()
      range.selectNodeContents(previewOutput)
      const selection = window.getSelection()
      selection.removeAllRanges()
      selection.addRange(range)
      document.execCommand('copy')
      selection.removeAllRanges()
      
      showNotification('已复制', 'success')
    } catch (fallbackError) {
      console.error('fallback copy error:', fallbackError)
      showNotification('复制失败，请手动选中预览内容复制', 'error')
    }
  }
}

// 处理清空
function handleClear() {
  markdownInput.value = ''
  previewOutput.innerHTML = '<p class="placeholder">输入 Markdown 后在此预览富文本效果</p>'
}

// 显示通知
function showNotification(message, type = 'info') {
  // 创建通知元素
  const notification = document.createElement('div')
  notification.className = `notification notification-${type}`
  notification.textContent = message
  
  // 添加到页面
  document.body.appendChild(notification)
  
  // 显示动画
  setTimeout(() => {
    notification.classList.add('show')
  }, 10)
  
  // 3秒后移除
  setTimeout(() => {
    notification.classList.remove('show')
    setTimeout(() => {
      document.body.removeChild(notification)
    }, 300)
  }, 3000)
}

// 添加示例 Markdown
function addExampleMarkdown() {
  const exampleMarkdown = `# Markdown Transfer 使用示例

欢迎使用 Markdown Transfer，这是一款免费的在线 Markdown 转富文本工具。

## 核心功能

- **实时预览**：左侧输入 Markdown，右侧即时显示富文本效果
- **一键复制**：点击「复制富文本」按钮，直接粘贴到 Word、WPS
- **手动复制**：直接选中预览区域内容复制
- **客户端处理**：所有转换在浏览器本地完成，保护隐私

## 支持的 Markdown 语法

1. 标题（H1-H6）
2. **粗体** 和 *斜体*
3. 有序列表和无序列表
4. 代码块和行内代码
5. 引用块
6. 链接
7. 表格

> Markdown Transfer 让文档转换变得简单高效。

\`\`\`javascript
// 示例代码
function hello() {
  console.log('Hello, Markdown Transfer!')
}
\`\`\`

| 功能 | 说明 | 状态 |
|------|------|------|
| 实时预览 | 输入即转换 | 已上线 |
| 一键复制 | 支持 Word 粘贴 | 已上线 |
| 表格转换 | 保留格式 | 已上线 |`
  
  markdownInput.value = exampleMarkdown
  handleRealTimePreview()
}

// 启动应用
init()
