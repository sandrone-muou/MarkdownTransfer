'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { convertMarkdownToHtml, exportToDocx, exportToTxt } from './lib/export';
import styles from './page.module.css';

const EXAMPLE_MARKDOWN = `# Markdown Transfer 使用示例

欢迎使用 Markdown Transfer，这是一款免费的在线 Markdown 转富文本工具。

## 核心功能

- **实时预览**：左侧输入 Markdown，右侧即时显示富文本效果
- **一键复制**：点击「复制富文本」按钮，直接粘贴到 Word、WPS
- **导出 Word**：将 Markdown 转换为 .docx 文件下载
- **导出 TXT**：将 Markdown 导出为纯文本文件
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
| 导出 Word | .docx 格式 | 已上线 |
| 导出 TXT | 纯文本格式 | 已上线 |`;

type NotificationType = 'success' | 'warning' | 'error';

export default function Home() {
  const [markdown, setMarkdown] = useState(EXAMPLE_MARKDOWN);
  const [notification, setNotification] = useState<{
    message: string;
    type: NotificationType;
    show: boolean;
  } | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNotification = useCallback((message: string, type: NotificationType = 'success') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setNotification({ message, type, show: true });
    timerRef.current = setTimeout(() => {
      setNotification((prev) => (prev ? { ...prev, show: false } : null));
    }, 3000);
  }, []);

  const html = markdown.trim()
    ? convertMarkdownToHtml(markdown)
    : '<p class="placeholder">输入 Markdown 后在此预览富文本效果</p>';

  const handleCopy = useCallback(async () => {
    if (!markdown.trim()) {
      showNotification('请输入 Markdown 内容', 'warning');
      return;
    }
    try {
      const htmlContent = convertMarkdownToHtml(markdown);
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const clipboardItem = new ClipboardItem({
        'text/html': blob,
        'text/plain': new Blob([tempDiv.textContent], { type: 'text/plain' }),
      });
      await navigator.clipboard.write([clipboardItem]);
      showNotification('已复制', 'success');
    } catch {
      try {
        const range = document.createRange();
        if (previewRef.current) {
          range.selectNodeContents(previewRef.current);
          const selection = window.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);
          document.execCommand('copy');
          selection?.removeAllRanges();
          showNotification('已复制', 'success');
        }
      } catch {
        showNotification('复制失败，请手动选中预览内容复制', 'error');
      }
    }
  }, [markdown, showNotification]);

  const handleExportDocx = useCallback(async () => {
    if (!markdown.trim()) {
      showNotification('请输入 Markdown 内容', 'warning');
      return;
    }
    try {
      await exportToDocx(markdown, 'document');
      showNotification('Word 文件已导出', 'success');
    } catch {
      showNotification('导出失败', 'error');
    }
  }, [markdown, showNotification]);

  const handleExportTxt = useCallback(() => {
    if (!markdown.trim()) {
      showNotification('请输入 Markdown 内容', 'warning');
      return;
    }
    try {
      exportToTxt(markdown, 'document');
      showNotification('TXT 文件已导出', 'success');
    } catch {
      showNotification('导出失败', 'error');
    }
  }, [markdown, showNotification]);

  const handleClear = useCallback(() => {
    setMarkdown('');
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const notificationClass = notification
    ? `${styles.notification} ${styles[`notification${notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}`]} ${notification.show ? styles.show : ''}`
    : '';

  return (
    <div className={styles.app}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.brandMark}>M</div>
          <div className={styles.brandText}>
            <h1>Markdown</h1>
            <span>Transfer</span>
          </div>
        </div>

        <nav className={styles.nav}>
          <button className={`${styles.navBtn} ${styles.primary}`} onClick={handleCopy} aria-label="复制富文本到剪贴板">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            复制富文本
          </button>
          <button className={styles.navBtn} onClick={handleExportDocx} aria-label="导出为 Word 文档">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            导出 Word
          </button>
          <button className={styles.navBtn} onClick={handleExportTxt} aria-label="导出为 TXT 文件">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
            </svg>
            导出 TXT
          </button>
          <button className={styles.navBtn} onClick={handleClear} aria-label="清空编辑器内容">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            清空
          </button>
        </nav>

        <div className={styles.hintBox}>
          <p>输入 Markdown 文本，右侧实时预览。支持复制富文本、导出 Word 和 TXT 文件。</p>
        </div>

        <a
          href="https://github.com/sandrone-muou/MarkdownTransfer"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.githubLink}
          aria-label="查看 GitHub 仓库"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          GitHub
        </a>
      </aside>

      <main className={styles.workspace}>
        <div className={`${styles.pane} ${styles.editorPane}`}>
          <div className={styles.paneHeader}>
            <div className={styles.paneTitle}>
              <span className={styles.paneIcon}>M</span>
              <span className={styles.paneLabel}>Markdown</span>
            </div>
            <span className={styles.paneStatus}>实时编辑</span>
          </div>
          <textarea
            className={styles.markdownInput}
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            placeholder="在此输入 Markdown 内容，右侧实时转换为富文本预览..."
            spellCheck={false}
            aria-label="Markdown 编辑器"
          />
        </div>

        <div className={styles.pane}>
          <div className={styles.paneHeader}>
            <div className={styles.paneTitle}>
              <span className={styles.paneIcon}>R</span>
              <span className={styles.paneLabel}>富文本</span>
            </div>
            <span className={styles.paneStatus}>可选中复制</span>
          </div>
          <div
            ref={previewRef}
            className={styles.previewOutput}
            contentEditable
            suppressContentEditableWarning
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </main>

      {notification && <div className={notificationClass}>{notification.message}</div>}
    </div>
  );
}
