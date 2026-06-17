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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Token = any;

// 收集列表项中的内联 token（递归跳过嵌套 list）
function collectInlineTokens(tokens: Token[]): Token[] {
  const result: Token[] = [];
  for (const token of tokens) {
    if (token.type === 'list') continue;
    if (token.type === 'text' && token.tokens) {
      result.push(...token.tokens);
    } else if (token.type === 'paragraph' && token.tokens) {
      result.push(...token.tokens);
    } else {
      result.push(token);
    }
  }
  return result;
}

async function getDocxModules() {
  const docx = await import('docx');
  return docx;
}

export async function exportToDocx(markdown: string, filename = 'document') {
  const {
    Document, Packer, Paragraph, TextRun, HeadingLevel,
    Table, TableRow, TableCell, WidthType, BorderStyle, ExternalHyperlink,
  } = await getDocxModules();

  type InlineContent = InstanceType<typeof TextRun> | InstanceType<typeof ExternalHyperlink>;

  function parseInlineTokens(tokens: Token[]): InlineContent[] {
    const runs: InlineContent[] = [];
    for (const token of tokens) {
      switch (token.type) {
        case 'text':
          runs.push(new TextRun({ text: token.text || '' }));
          break;
        case 'strong':
          runs.push(
            new TextRun({
              text: getInlineText(token.tokens || []),
              bold: true,
            })
          );
          break;
        case 'em':
          runs.push(
            new TextRun({
              text: getInlineText(token.tokens || []),
              italics: true,
            })
          );
          break;
        case 'codespan':
          runs.push(
            new TextRun({
              text: token.text || '',
              font: 'Courier New',
              size: 20,
            })
          );
          break;
        case 'link':
          runs.push(
            new ExternalHyperlink({
              children: [new TextRun({ text: token.text || '', style: 'Hyperlink' })],
              link: token.href || '#',
            })
          );
          break;
        case 'br':
          runs.push(new TextRun({ text: '', break: 1 }));
          break;
        default:
          if (token.tokens) {
            runs.push(...parseInlineTokens(token.tokens));
          } else if (token.text) {
            runs.push(new TextRun({ text: token.text }));
          }
      }
    }
    return runs;
  }

  function getInlineText(tokens: Token[]): string {
    return tokens
      .map((t: Token) => {
        if (t.tokens) return getInlineText(t.tokens);
        if (t.text) return t.text;
        return '';
      })
      .join('');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tokens: any[] = marked.lexer(markdown);
  const children: (InstanceType<typeof Paragraph> | InstanceType<typeof Table>)[] = [];

  for (const token of tokens) {
    switch (token.type) {
      case 'heading': {
        const headingLevels: Record<number, (typeof HeadingLevel)[keyof typeof HeadingLevel]> = {
          1: HeadingLevel.HEADING_1,
          2: HeadingLevel.HEADING_2,
          3: HeadingLevel.HEADING_3,
          4: HeadingLevel.HEADING_4,
          5: HeadingLevel.HEADING_5,
          6: HeadingLevel.HEADING_6,
        };
        children.push(
          new Paragraph({
            heading: headingLevels[token.depth || 1],
            children: token.tokens ? parseInlineTokens(token.tokens) : [new TextRun({ text: token.text || '' })],
          })
        );
        break;
      }
      case 'paragraph': {
        children.push(
          new Paragraph({
            children: token.tokens ? parseInlineTokens(token.tokens) : [new TextRun({ text: token.text || '' })],
          })
        );
        break;
      }
      case 'list': {
        const listItems = token.items || [];
        for (const item of listItems) {
          const inlineTokens = item.tokens
            ? collectInlineTokens(item.tokens)
            : [];
          const prefix = token.ordered ? '' : '• ';
          const content: InlineContent[] = [
            new TextRun({ text: prefix }),
            ...(inlineTokens.length > 0
              ? parseInlineTokens(inlineTokens)
              : [new TextRun({ text: item.text || '' })]),
          ];
          children.push(
            new Paragraph({
              children: content,
              indent: { left: 720 },
            })
          );
        }
        break;
      }
      case 'code': {
        const codeLines = (token.text || '').split('\n');
        for (const line of codeLines) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: line, font: 'Courier New', size: 20 })],
            })
          );
        }
        break;
      }
      case 'blockquote': {
        const bqInlineTokens = token.tokens
          ? collectInlineTokens(token.tokens)
          : [];
        const bqText = bqInlineTokens.length > 0
          ? getInlineText(bqInlineTokens)
          : token.text || '';
        children.push(
          new Paragraph({
            children: [new TextRun({ text: bqText, italics: true, color: '5a5a6e' })],
            indent: { left: 720 },
            border: {
              left: { style: BorderStyle.SINGLE, size: 3, color: 'd0d0d8' },
            },
          })
        );
        break;
      }
      case 'hr': {
        children.push(new Paragraph({ children: [] }));
        break;
      }
      case 'table': {
        const headerCells =
          token.header?.map(
            (h: Token) =>
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: h.text || '', bold: true })] })],
                width: { size: 100 / (token.header?.length || 1), type: WidthType.PERCENTAGE },
              })
          ) || [];

        const dataRows =
          token.rows?.map(
            (row: Token[]) =>
              new TableRow({
                children: row.map(
                  (cell: Token) =>
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: cell.text || '' })] })],
                    })
                ),
              })
          ) || [];

        if (headerCells.length > 0) {
          children.push(
            new Table({
              rows: [new TableRow({ children: headerCells, tableHeader: true }), ...dataRows],
              width: { size: 100, type: WidthType.PERCENTAGE },
            })
          );
        }
        break;
      }
      case 'space':
        break;
      default:
        if (token.text) {
          children.push(new Paragraph({ children: [new TextRun({ text: token.text })] }));
        }
    }
  }

  const doc = new Document({
    sections: [
      {
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${filename}.docx`);
}
