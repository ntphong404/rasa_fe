import { saveAs } from 'file-saver';

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

    messages.forEach((message) => {
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
      content.innerHTML = escapeHtml(message.text).replace(/\n/g, '<br/>');
      content.style.fontSize = '13px';
      content.style.lineHeight = '1.65';
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
    });

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
    const { Document, Packer, Paragraph, TextRun } = await loadDocx();
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
            ...messages.flatMap((message) => [
              new Paragraph({
                children: [
                  new TextRun({
                    text: message.role === 'user' ? '👤 Người dùng:' : '🤖 Trợ lý AI:',
                    bold: true,
                    size: 24,
                    color: message.role === 'user' ? '0066CC' : '009900',
                  }),
                ],
                spacing: { before: 200, after: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: message.text,
                    size: 22,
                  }),
                ],
                spacing: { after: 200 },
              }),
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
            ]),
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