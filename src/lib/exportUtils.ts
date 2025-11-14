import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';

export interface ExportMessage {
  role: 'user' | 'bot';
  text: string;
  timestamp?: string;
}

// Helper function to split text into lines that fit within the page width
const splitTextToLines = (doc: jsPDF, text: string, maxWidth: number): string[] => {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const textWidth = doc.getTextWidth(testLine);
    
    if (textWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
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
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Set font that supports Unicode better
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - (margin * 2);
    let yPosition = margin;

    // Add title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Lich su tro chuyen', margin, yPosition);
    yPosition += 15;

    // Add timestamp
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const currentDate = new Date().toLocaleString('vi-VN');
    doc.text(`Xuat vao: ${currentDate}`, margin, yPosition);
    yPosition += 15;

    // Process each message
    for (const message of messages) {
      // Check if we need a new page
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = margin;
      }

      // Add role label
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      
      if (message.role === 'user') {
        doc.setTextColor(0, 100, 200); // Blue for user
        doc.text('Nguoi dung:', margin, yPosition);
      } else {
        doc.setTextColor(0, 150, 0); // Green for bot
        doc.text('Tro ly AI:', margin, yPosition);
      }
      
      yPosition += 8;

      // Add message content
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0); // Black for content
      doc.setFontSize(10);

      // Split text into lines that fit the page width
      const textLines = splitTextToLines(doc, message.text, maxWidth);
      
      for (const line of textLines) {
        // Check if we need a new page
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = margin;
        }
        
        doc.text(line, margin, yPosition);
        yPosition += 6;
      }

      // Add timestamp if available
      if (message.timestamp) {
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128); // Gray
        doc.text(`Thoi gian: ${message.timestamp}`, margin, yPosition);
        yPosition += 5;
      }

      yPosition += 10; // Space between messages
    }

    // Save the PDF
    const finalFilename = filename || `chat-history-${Date.now()}.pdf`;
    doc.save(finalFilename);
    
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw new Error('Khong the xuat file PDF');
  }
};

// Export conversation to Word document
export const exportToWord = async (messages: ExportMessage[], filename?: string): Promise<void> => {
  try {
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