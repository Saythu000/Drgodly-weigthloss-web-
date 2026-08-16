// ponytail: clean multi-format document parser & chunker

export interface ExtractedDocument {
  title: string;
  fileType: string;
  rawText: string;
  chunks: string[];
}

/**
 * Splits document text into semantic chunks with overlapping boundaries.
 */
export function chunkText(text: string, chunkSize = 700, overlap = 100): string[] {
  const cleaned = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  if (!cleaned) return [];
  if (cleaned.length <= chunkSize) return [cleaned];

  const chunks: string[] = [];
  let startIndex = 0;

  while (startIndex < cleaned.length) {
    let endIndex = startIndex + chunkSize;

    if (endIndex < cleaned.length) {
      // Find a natural break (newline or period) near the end
      const lastBreak = cleaned.lastIndexOf('\n', endIndex);
      const lastPeriod = cleaned.lastIndexOf('. ', endIndex);
      const breakPoint = Math.max(lastBreak, lastPeriod);

      if (breakPoint > startIndex + 200) {
        endIndex = breakPoint + 1;
      }
    }

    const chunk = cleaned.substring(startIndex, endIndex).trim();
    if (chunk.length > 20) {
      chunks.push(chunk);
    }

    startIndex = endIndex - overlap;
  }

  return chunks;
}

/**
 * Parses CSV text lines into formatted key-value semantic statements.
 */
export function parseCSVText(csvContent: string): { title: string; text: string } {
  const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { title: 'CSV Document', text: '' };

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
  const recordTexts: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''));
    const fields: string[] = [];
    for (let j = 0; j < headers.length; j++) {
      if (values[j]) {
        fields.push(`${headers[j]}: ${values[j]}`);
      }
    }
    if (fields.length > 0) {
      recordTexts.push(`Record ${i}: ${fields.join(' | ')}`);
    }
  }

  return {
    title: 'CSV Data Sheet',
    text: recordTexts.join('\n\n'),
  };
}

/**
 * Extracts raw text from uploaded Buffer according to file MIME type or extension.
 */
export async function parseDocumentBuffer(
  buffer: Buffer,
  filename: string
): Promise<ExtractedDocument> {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  let rawText = '';
  let fileType = ext.toUpperCase();

  try {
    if (ext === 'pdf') {
      try {
        const pdfParseModule = await import('pdf-parse');
        const PDFParseClass = (pdfParseModule as any).PDFParse || (pdfParseModule as any).default || pdfParseModule;
        if (typeof PDFParseClass === 'function' && PDFParseClass.prototype && PDFParseClass.prototype.getText) {
          const parser = new PDFParseClass({ data: buffer });
          const parsed = await parser.getText();
          rawText = typeof parsed === 'string' ? parsed : (parsed?.text || '');
        } else if (typeof pdfParseModule === 'function') {
          const pdfData = await (pdfParseModule as any)(buffer);
          rawText = pdfData.text || '';
        } else {
          rawText = buffer.toString('utf-8');
        }
      } catch (pdfErr: any) {
        console.error('PDF Parse Error:', pdfErr);
        rawText = buffer.toString('utf-8');
      }
      fileType = 'PDF';
    } else if (ext === 'csv' || ext === 'tsv') {
      const parsed = parseCSVText(buffer.toString('utf-8'));
      rawText = parsed.text;
      fileType = 'CSV/Excel';
    } else if (ext === 'json') {
      const parsedJson = JSON.parse(buffer.toString('utf-8'));
      rawText = typeof parsedJson === 'string' ? parsedJson : JSON.stringify(parsedJson, null, 2);
      fileType = 'JSON';
    } else {
      // txt, md, doc, default
      rawText = buffer.toString('utf-8');
      fileType = ext ? ext.toUpperCase() : 'TXT';
    }
  } catch (err: any) {
    console.error(`Error parsing document ${filename}:`, err);
    rawText = buffer.toString('utf-8');
  }

  const chunks = chunkText(rawText);

  return {
    title: filename.replace(/\.[^/.]+$/, ''),
    fileType,
    rawText,
    chunks,
  };
}
