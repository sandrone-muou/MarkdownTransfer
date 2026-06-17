import { marked } from 'marked';
import { saveAs } from 'file-saver';

marked.setOptions({
  breaks: true,
  gfm: true,
});

export function convertMarkdownToHtml(markdown: string): string {
  return marked.parse(markdown) as string;
}

// ===== 导出为 TXT =====
export function exportToTxt(markdown: string, filename = 'document') {
  const html = convertMarkdownToHtml(markdown);
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  const text = tempDiv.textContent || tempDiv.innerText || '';
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  saveAs(blob, `${filename}.txt`);
}

// ===== 导出为 Word (.docx) =====
// 通过解析 HTML DOM 来构建 docx，比遍历 marked token 树更可靠

async function getDocxModules() {
  return import('docx');
}

// 从 DOM 节点提取内联内容（TextRun / ExternalHyperlink）
function parseHtmlInline(
  node: Node,
  TextRun: typeof import('docx').TextRun,
  ExternalHyperlink: typeof import('docx').ExternalHyperlink,
  baseStyle: { bold?: boolean; italics?: boolean } = {},
): InstanceType<typeof TextRun | typeof ExternalHyperlink>[] {
  const result: InstanceType<typeof TextRun | typeof ExternalHyperlink>[] = [];

  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent || '';
    if (text) {
      result.push(new TextRun({ text, ...baseStyle }));
    }
    return result;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return result;

  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();

  // 继承并叠加样式
  const style = { ...baseStyle };
  if (tag === 'strong' || tag === 'b') style.bold = true;
  if (tag === 'em' || tag === 'i') style.italics = true;

  if (tag === 'a') {
    const href = el.getAttribute('href') || '#';
    const linkText = el.textContent || '';
    result.push(
      new ExternalHyperlink({
        children: [new TextRun({ text: linkText, style: 'Hyperlink' })],
        link: href,
      })
    );
    return result;
  }

  if (tag === 'code' && !el.querySelector('pre')) {
    // 行内代码
    result.push(new TextRun({ text: el.textContent || '', font: 'Courier New', size: 20, ...baseStyle }));
    return result;
  }

  if (tag === 'br') {
    result.push(new TextRun({ text: '', break: 1 }));
    return result;
  }

  // 递归处理子节点
  for (const child of Array.from(el.childNodes)) {
    result.push(...parseHtmlInline(child, TextRun, ExternalHyperlink, style));
  }

  return result;
}

export async function exportToDocx(markdown: string, filename = 'document') {
  const {
    Document, Packer, Paragraph, TextRun, HeadingLevel,
    Table, TableRow, TableCell, WidthType, BorderStyle, ExternalHyperlink,
  } = await getDocxModules();

  const html = convertMarkdownToHtml(markdown);
  const container = document.createElement('div');
  container.innerHTML = html;

  type DocxChild = InstanceType<typeof Paragraph> | InstanceType<typeof Table>;
  const children: DocxChild[] = [];

  const headingMap: Record<string, (typeof HeadingLevel)[keyof typeof HeadingLevel]> = {
    h1: HeadingLevel.HEADING_1,
    h2: HeadingLevel.HEADING_2,
    h3: HeadingLevel.HEADING_3,
    h4: HeadingLevel.HEADING_4,
    h5: HeadingLevel.HEADING_5,
    h6: HeadingLevel.HEADING_6,
  };

  for (const el of Array.from(container.children)) {
    const tag = el.tagName.toLowerCase();

    // 标题
    if (headingMap[tag]) {
      children.push(
        new Paragraph({
          heading: headingMap[tag],
          children: parseHtmlInline(el, TextRun, ExternalHyperlink),
        })
      );
      continue;
    }

    // 段落
    if (tag === 'p') {
      children.push(
        new Paragraph({
          children: parseHtmlInline(el, TextRun, ExternalHyperlink),
        })
      );
      continue;
    }

    // 无序/有序列表
    if (tag === 'ul' || tag === 'ol') {
      const ordered = tag === 'ol';
      const items = el.querySelectorAll(':scope > li');
      items.forEach((li, index) => {
        const prefix = ordered ? `${index + 1}. ` : '• ';
        const content = [
          new TextRun({ text: prefix }),
          ...parseHtmlInline(li, TextRun, ExternalHyperlink),
        ];
        children.push(
          new Paragraph({
            children: content,
            indent: { left: 720 },
          })
        );
      });
      continue;
    }

    // 代码块
    if (tag === 'pre') {
      const codeEl = el.querySelector('code');
      const codeText = codeEl ? (codeEl.textContent || '') : (el.textContent || '');
      for (const line of codeText.split('\n')) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: line, font: 'Courier New', size: 20 })],
          })
        );
      }
      continue;
    }

    // 引用
    if (tag === 'blockquote') {
      const bqText = el.textContent || '';
      children.push(
        new Paragraph({
          children: [new TextRun({ text: bqText, italics: true, color: '5a5a6e' })],
          indent: { left: 720 },
          border: {
            left: { style: BorderStyle.SINGLE, size: 3, color: 'd0d0d8' },
          },
        })
      );
      continue;
    }

    // 表格
    if (tag === 'table') {
      const rows: InstanceType<typeof TableRow>[] = [];
      const thead = el.querySelector('thead');
      const tbody = el.querySelector('tbody') || el;

      if (thead) {
        const headerRow = thead.querySelector('tr');
        if (headerRow) {
          const cells = Array.from(headerRow.querySelectorAll('th, td'));
          rows.push(
            new TableRow({
              children: cells.map(
                (cell) =>
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: cell.textContent || '', bold: true })] })],
                    width: { size: 100 / cells.length, type: WidthType.PERCENTAGE },
                  })
              ),
              tableHeader: true,
            })
          );
        }
      }

      const bodyRows = tbody.querySelectorAll('tr');
      bodyRows.forEach((tr) => {
        // 跳过 thead 中的行
        if (thead && thead.contains(tr)) return;
        const cells = Array.from(tr.querySelectorAll('td, th'));
        if (cells.length > 0) {
          rows.push(
            new TableRow({
              children: cells.map(
                (cell) =>
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: cell.textContent || '' })] })],
                  })
              ),
            })
          );
        }
      });

      if (rows.length > 0) {
        children.push(
          new Table({
            rows,
            width: { size: 100, type: WidthType.PERCENTAGE },
          })
        );
      }
      continue;
    }

    // 水平线
    if (tag === 'hr') {
      children.push(new Paragraph({ children: [] }));
      continue;
    }

    // 其他元素作为段落
    const text = el.textContent;
    if (text) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text })],
        })
      );
    }
  }

  const doc = new Document({
    sections: [{ children }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${filename}.docx`);
}
