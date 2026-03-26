import { saveAs } from 'file-saver';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';

export interface ExportMessage {
  role: 'user' | 'bot';
  text: string;
  timestamp?: string;
}

let cachedJsPDF: any = null;
let cachedDocx: any = null;
let cachedHtml2Canvas: any = null;

const loadJsPDF = async (): Promise<any> => {
  if (!cachedJsPDF) {
    const module = await import('jspdf');
    cachedJsPDF = module.default;
  }
  return cachedJsPDF;
};

const loadDocx = async (): Promise<any> => {
  if (!cachedDocx) {
    cachedDocx = await import('docx');
  }
  return cachedDocx;
};

const loadHtml2Canvas = async (): Promise<any> => {
  if (!cachedHtml2Canvas) {
    const module = await import('html2canvas');
    cachedHtml2Canvas = module.default;
  }
  return cachedHtml2Canvas;
};

const escapeHtml = (text: string): string =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

let cachedMarkdownProcessor: any = null;

const markdownToHtml = async (markdown: string): Promise<string> => {
  if (!cachedMarkdownProcessor) {
    cachedMarkdownProcessor = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkBreaks)
      .use(remarkRehype)
      .use(rehypeSanitize)
      .use(rehypeStringify);
  }

  try {
    const file = await cachedMarkdownProcessor.process(markdown || '');
    return String(file);
  } catch (error) {
    console.error('Markdown to HTML failed:', error);
    return escapeHtml(markdown || '').replace(/\n/g, '<br/>');
  }
};

type MarkdownBlock =
  | { type: 'heading'; level: number; text: string }
  | { type: 'list'; ordered: boolean; text: string; index?: number }
  | { type: 'code'; text: string }
  | { type: 'blockquote'; text: string }
  | { type: 'table'; rows: string[][] }
  | { type: 'paragraph'; text: string };

const parseMarkdownBlocks = (markdown: string): MarkdownBlock[] => {
  const lines = (markdown || '').replace(/\r\n/g, '\n').split('\n');
  const blocks: MarkdownBlock[] = [];
  let inCode = false;
  let codeLines: string[] = [];
  let paragraphLines: string[] = [];

  const flushParagraph = () => {
    if (paragraphLines.length > 0) {
      blocks.push({ type: 'paragraph', text: paragraphLines.join('\n') });
      paragraphLines = [];
    }
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.trim().startsWith('```')) {
      if (inCode) {
        blocks.push({ type: 'code', text: codeLines.join('\n') });
        codeLines = [];
        inCode = false;
      } else {
        flushParagraph();
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      continue;
    }

    const nextLine = lines[i + 1];
    const isTableHeader = line.includes('|') && nextLine && /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(nextLine);
    if (isTableHeader) {
      flushParagraph();
      const rows: string[][] = [];
      const parseRow = (rowLine: string) =>
        rowLine
          .trim()
          .replace(/^\|/, '')
          .replace(/\|$/, '')
          .split('|')
          .map((cell) => cell.trim());

      rows.push(parseRow(line));
      i += 1; // skip separator line
      while (i + 1 < lines.length && lines[i + 1].includes('|') && lines[i + 1].trim().length > 0) {
        i += 1;
        rows.push(parseRow(lines[i]));
      }
      blocks.push({ type: 'table', rows });
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        text: headingMatch[2].trim(),
      });
      continue;
    }

    const quoteMatch = line.match(/^>\s+(.*)$/);
    if (quoteMatch) {
      flushParagraph();
      blocks.push({ type: 'blockquote', text: quoteMatch[1].trim() });
      continue;
    }

    const unorderedMatch = line.match(/^[-*+]\s+(.*)$/);
    if (unorderedMatch) {
      flushParagraph();
      blocks.push({ type: 'list', ordered: false, text: unorderedMatch[1].trim() });
      continue;
    }

    const orderedMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (orderedMatch) {
      flushParagraph();
      blocks.push({
        type: 'list',
        ordered: true,
        index: Number(orderedMatch[1]),
        text: orderedMatch[2].trim(),
      });
      continue;
    }

    paragraphLines.push(line);
  }

  if (inCode && codeLines.length > 0) {
    blocks.push({ type: 'code', text: codeLines.join('\n') });
  }
  flushParagraph();

  return blocks;
};

const createTextRunsFromInline = (
  text: string,
  TextRun: any,
  UnderlineType: any
): any[] => {
  const runs: any[] = [];
  let remaining = text || '';
  const tokenRegex =
    /(\[([^\]]+)\]\(([^)]+)\)|\*\*\*([^*]+)\*\*\*|\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/;

  while (remaining.length > 0) {
    const match = remaining.match(tokenRegex);
    if (!match || match.index === undefined) {
      runs.push(new TextRun({ text: remaining, size: 22 }));
      break;
    }

    if (match.index > 0) {
      runs.push(new TextRun({ text: remaining.slice(0, match.index), size: 22 }));
    }

    const token = match[0];
    if (match[2] && match[3]) {
      runs.push(
        new TextRun({
          text: match[2],
          size: 22,
          color: '2563EB',
          underline: { type: UnderlineType.SINGLE },
        })
      );
      runs.push(new TextRun({ text: ` (${match[3]})`, size: 20, color: '2563EB' }));
    } else if (match[4]) {
      runs.push(new TextRun({ text: match[4], bold: true, italics: true, size: 22 }));
    } else if (match[5]) {
      runs.push(new TextRun({ text: match[5], bold: true, size: 22 }));
    } else if (match[6]) {
      runs.push(new TextRun({ text: match[6], italics: true, size: 22 }));
    } else if (match[7]) {
      runs.push(
        new TextRun({
          text: match[7],
          font: 'Consolas',
          size: 20,
          color: '111827',
        })
      );
    } else {
      runs.push(new TextRun({ text: token, size: 22 }));
    }

    remaining = remaining.slice(match.index + token.length);
  }

  return runs;
};

// Copy text to clipboard
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const result = document.execCommand('copy');
      document.body.removeChild(textArea);
      return result;
    }
  } catch (err) {
    console.error('Failed to copy text: ', err);
    return false;
  }
};

// Export conversation to PDF with improved Vietnamese support
export const exportToPDF = async (messages: ExportMessage[], filename?: string): Promise<void> => {
  let exportFrame: HTMLIFrameElement | null = null;
  try {
    const [JsPDF, html2canvas] = await Promise.all([loadJsPDF(), loadHtml2Canvas()]);

    // Render PDF content inside a clean iframe to avoid global CSS tokens like oklch.
    exportFrame = document.createElement('iframe');
    exportFrame.style.position = 'fixed';
    exportFrame.style.left = '-10000px';
    exportFrame.style.top = '0';
    exportFrame.style.width = '920px';
    exportFrame.style.height = '1200px';
    exportFrame.style.border = '0';
    exportFrame.setAttribute('aria-hidden', 'true');
    document.body.appendChild(exportFrame);

    const frameDocument = exportFrame.contentDocument;
    if (!frameDocument) {
      throw new Error('Không thể khởi tạo tài liệu export PDF');
    }

    frameDocument.open();
    frameDocument.write(`<!doctype html><html><head><meta charset="utf-8" /></head><body style="margin:0;background:#ffffff;"></body></html>`);
    frameDocument.close();

    const styleTag = frameDocument.createElement('style');
    styleTag.textContent = `
      .md-content { font-size: 13px; line-height: 1.65; color: #111827; }
      .md-content h1 { font-size: 20px; margin: 10px 0 6px; font-weight: 700; }
      .md-content h2 { font-size: 18px; margin: 10px 0 6px; font-weight: 700; }
      .md-content h3 { font-size: 16px; margin: 10px 0 6px; font-weight: 700; }
      .md-content p { margin: 6px 0; }
      .md-content ul { margin: 6px 0 6px 18px; padding: 0; }
      .md-content ol { margin: 6px 0 6px 18px; padding: 0; }
      .md-content li { margin: 2px 0; }
      .md-content code { font-family: Consolas, "Courier New", monospace; background: #f3f4f6; padding: 1px 3px; border-radius: 4px; }
      .md-content pre { background: #f3f4f6; padding: 8px; border-radius: 6px; overflow: hidden; }
      .md-content pre code { background: transparent; padding: 0; }
      .md-content blockquote { margin: 6px 0; padding-left: 10px; border-left: 3px solid #e5e7eb; color: #6b7280; }
      .md-content table { width: 100%; border-collapse: collapse; margin: 8px 0; }
      .md-content th, .md-content td { border: 1px solid #e5e7eb; padding: 4px 6px; font-size: 12px; }
      .md-content th { background: #f9fafb; text-align: left; }
      .md-content a { color: #2563eb; text-decoration: underline; }
    `;
    frameDocument.head.appendChild(styleTag);

    const exportRoot = frameDocument.createElement('div');
    exportRoot.style.width = '900px';
    exportRoot.style.background = '#ffffff';
    exportRoot.style.color = '#111827';
    exportRoot.style.padding = '28px';
    exportRoot.style.boxSizing = 'border-box';
    exportRoot.style.fontFamily = 'Arial, Tahoma, "Segoe UI", sans-serif';

    const title = frameDocument.createElement('h1');
    title.textContent = 'Lịch sử trò chuyện';
    title.style.margin = '0 0 8px';
    title.style.fontSize = '22px';
    exportRoot.appendChild(title);

    const timestamp = frameDocument.createElement('p');
    timestamp.textContent = `Xuất vào: ${new Date().toLocaleString('vi-VN')}`;
    timestamp.style.margin = '0 0 18px';
    timestamp.style.fontSize = '12px';
    timestamp.style.color = '#6b7280';
    exportRoot.appendChild(timestamp);

    for (const message of messages) {
      const block = frameDocument.createElement('section');
      block.style.marginBottom = '16px';
      block.style.padding = '10px 12px';
      block.style.border = '1px solid #e5e7eb';
      block.style.borderRadius = '8px';

      const role = frameDocument.createElement('div');
      role.textContent = message.role === 'user' ? 'Người dùng' : 'Trợ lý AI';
      role.style.fontWeight = '700';
      role.style.color = message.role === 'user' ? '#1d4ed8' : '#047857';
      role.style.marginBottom = '6px';
      block.appendChild(role);

      const content = frameDocument.createElement('div');
      content.className = 'md-content';
      content.innerHTML = await markdownToHtml(message.text);
      content.style.whiteSpace = 'normal';
      content.style.wordBreak = 'break-word';
      block.appendChild(content);

      if (message.timestamp) {
        const time = frameDocument.createElement('div');
        time.textContent = `Thời gian: ${message.timestamp}`;
        time.style.marginTop = '8px';
        time.style.fontSize = '11px';
        time.style.color = '#6b7280';
        block.appendChild(time);
      }

      exportRoot.appendChild(block);
    }

    frameDocument.body.appendChild(exportRoot);
    if ('fonts' in frameDocument) {
      await (frameDocument as any).fonts.ready;
    }

    const canvas = await html2canvas(exportRoot, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      windowWidth: exportRoot.scrollWidth,
      windowHeight: exportRoot.scrollHeight,
    });

    const doc = new JsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const pageHeightPx = Math.floor((pageHeight * canvas.width) / imgWidth);

    let renderedPx = 0;
    let pageIndex = 0;

    while (renderedPx < canvas.height) {
      const sliceHeightPx = Math.min(pageHeightPx, canvas.height - renderedPx);
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = sliceHeightPx;

      const ctx = pageCanvas.getContext('2d');
      if (!ctx) {
        throw new Error('Không thể khởi tạo canvas context');
      }

      ctx.drawImage(
        canvas,
        0,
        renderedPx,
        canvas.width,
        sliceHeightPx,
        0,
        0,
        canvas.width,
        sliceHeightPx
      );

      if (pageIndex > 0) {
        doc.addPage();
      }

      const sliceHeightMm = (sliceHeightPx * imgWidth) / canvas.width;
      doc.addImage(pageCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, imgWidth, sliceHeightMm);

      renderedPx += sliceHeightPx;
      pageIndex += 1;
    }

    // Save the PDF
    const finalFilename = filename || `chat-history-${Date.now()}.pdf`;
    doc.save(finalFilename);
    
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw new Error('Khong the xuat file PDF');
  } finally {
    if (exportFrame && exportFrame.parentNode) {
      exportFrame.parentNode.removeChild(exportFrame);
    }
  }
};

// Export conversation to Word document
export const exportToWord = async (messages: ExportMessage[], filename?: string): Promise<void> => {
  try {
    const { Document, Packer, Paragraph, TextRun, UnderlineType, Table, TableRow, TableCell, WidthType } = await loadDocx();

    const buildTableFromRows = (rows: string[][]) =>
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: rows.map((row, rowIndex) =>
          new TableRow({
            children: row.map(
              (cell) =>
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: cell,
                          bold: rowIndex === 0,
                          size: rowIndex === 0 ? 22 : 20,
                        }),
                      ],
                      spacing: { after: 0 },
                    }),
                  ],
                })
            ),
          })
        ),
      });

    const buildParagraphsFromBlocks = (blocks: MarkdownBlock[]) =>
      blocks.flatMap((block) => {
        if (block.type === 'heading') {
          const size = block.level === 1 ? 32 : block.level === 2 ? 28 : block.level === 3 ? 26 : 24;
          return [
            new Paragraph({
              children: [new TextRun({ text: block.text, bold: true, size })],
              spacing: { after: 220 },
            }),
          ];
        }

        if (block.type === 'list') {
          const runs = createTextRunsFromInline(block.text, TextRun, UnderlineType);
          if (block.ordered) {
            const index = block.index ?? 1;
            return [
              new Paragraph({
                children: [new TextRun({ text: `${index}. `, size: 22 }), ...runs],
                spacing: { after: 120 },
              }),
            ];
          }

          return [
            new Paragraph({
              children: runs,
              bullet: { level: 0 },
              spacing: { after: 120 },
            }),
          ];
        }

        if (block.type === 'code') {
          const codeRuns = block.text.split('\n').map((line, index) =>
            new TextRun({
              text: line,
              font: 'Consolas',
              size: 20,
              color: '111827',
              break: index === 0 ? undefined : 1,
            })
          );
          return [
            new Paragraph({
              children: codeRuns,
              spacing: { after: 200 },
            }),
          ];
        }

        if (block.type === 'blockquote') {
          return [
            new Paragraph({
              children: [
                new TextRun({
                  text: block.text,
                  italics: true,
                  color: '6B7280',
                  size: 22,
                }),
              ],
              spacing: { after: 160 },
            }),
          ];
        }

        if (block.type === 'table') {
          return [buildTableFromRows(block.rows)];
        }

        const runs = createTextRunsFromInline(block.text, TextRun, UnderlineType);
        return [
          new Paragraph({
            children: runs.length > 0 ? runs : [new TextRun({ text: '', size: 22 })],
            spacing: { after: 160 },
          }),
        ];
      });

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Lịch sử trò chuyện",
                  bold: true,
                  size: 32,
                }),
              ],
              spacing: { after: 400 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Xuất vào: ${new Date().toLocaleString('vi-VN')}`,
                  size: 20,
                  color: "666666",
                }),
              ],
              spacing: { after: 400 },
            }),
            ...messages.flatMap((message) => {
              const blocks = parseMarkdownBlocks(message.text);
              const contentParagraphs =
                blocks.length > 0
                  ? buildParagraphsFromBlocks(blocks)
                  : [
                      new Paragraph({
                        children: [new TextRun({ text: message.text, size: 22 })],
                        spacing: { after: 200 },
                      }),
                    ];

              return [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: message.role === 'user' ? 'Người dùng:' : 'Trợ lý AI:',
                      bold: true,
                      size: 24,
                      color: message.role === 'user' ? '0066CC' : '009900',
                    }),
                  ],
                  spacing: { before: 200, after: 100 },
                }),
                ...contentParagraphs,
                ...(message.timestamp
                  ? [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: `Thời gian: ${message.timestamp}`,
                            size: 18,
                            color: "888888",
                            italics: true,
                          }),
                        ],
                        spacing: { after: 300 },
                      }),
                    ]
                  : []),
              ];
            }),
          ],
        },
      ],
    });

    // Sử dụng toBlob thay vì toBuffer để tương thích với browser
    const blob = await Packer.toBlob(doc);

    const finalFilename = filename || `chat-history-${Date.now()}.docx`;
    saveAs(blob, finalFilename);
  } catch (error) {
    console.error('Error exporting to Word:', error);
    throw new Error('Không thể xuất file Word');
  }
};

// Export a single message to PDF
export const exportMessageToPDF = async (message: ExportMessage, filename?: string): Promise<void> => {
  await exportToPDF([message], filename);
};

// Export a single message to Word
export const exportMessageToWord = async (message: ExportMessage, filename?: string): Promise<void> => {
  await exportToWord([message], filename);
};




