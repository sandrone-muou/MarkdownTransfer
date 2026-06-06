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
    previewOutput.innerHTML = '<p class="placeholder">输入 Markdown 后在此预览</p>'
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
  previewOutput.innerHTML = '<p class="placeholder">输入 Markdown 后在此预览</p>'
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
  const exampleMarkdown = `# Markdown 转富文本

将 Markdown 文本转换为富文本格式，粘贴到 Word 时保留格式。

## 功能

- **实时预览**：左侧输入，右侧即时显示
- **一键复制**：点击「复制富文本」按钮
- **手动复制**：直接选中预览内容复制

## 语法支持

1. 标题（h1-h6）
2. 粗体和*斜体*
3. 有序列表和无序列表
4. 代码块
5. 引用
6. 表格

> 引用文本示例

\`\`\`javascript
console.log('Hello, World!')
\`\`\`

| 项目 | 说明 | 状态 |
|------|------|------|
| 功能A | 已实现 | 完成 |
| 功能B | 开发中 | 进行中 |`
  
  markdownInput.value = exampleMarkdown
  handleRealTimePreview()
}

// 启动应用
init()
