// ponytail: clean multi-format document parser & chunker

// Polyfill browser globals required by pdfjs-dist / pdf-parse in Node.js environments
if (typeof (global as any).DOMMatrix === 'undefined') {
  (global as any).DOMMatrix = class DOMMatrix {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    matrixTransform() { return { x: 0, y: 0 }; }
  };
}
if (typeof (global as any).ImageData === 'undefined') {
  (global as any).ImageData = class ImageData {};
}
if (typeof (global as any).Path2D === 'undefined') {
  (global as any).Path2D = class Path2D {};
}

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
 * Cleans extracted PDF text to strip raw PDF binary stream artifacts,
 * unprintable control characters, and PDF formatting metadata.
 */
export function cleanPDFText(text: string): string {
  if (!text) return '';

  let cleaned = text;

  // If text contains raw PDF binary headers/objects, filter out binary commands
  if (cleaned.includes('%PDF-') || cleaned.includes('endobj') || cleaned.includes('00000 n')) {
    const lines = cleaned.split('\n').filter((line) => {
      const trimmed = line.trim();
      if (/^(%PDF|[\d\s]+obj|endobj|xref|trailer|startxref|[\d\s]+[nf]|\/Type|\/Font|\/MediaBox|\/Contents|\/ProcSet|\/ExtGState)/i.test(trimmed)) {
        return false;
      }
      // Must contain at least 4 alphanumeric words/characters
      const alphaCount = (trimmed.match(/[a-zA-Z0-9]/g) || []).length;
      return alphaCount >= 4;
    });
    cleaned = lines.join('\n');
  }

  // Remove non-printable binary control characters
  cleaned = cleaned.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F-\x9F\uFFFD]/g, ' ').replace(/\s+/g, ' ').trim();

  return cleaned;
}

/**
 * Fallback PDF text extractor that parses PDF text streams (Tj/TJ operations)
 * directly from raw PDF buffer without requiring pdfjs workers or DOM elements.
 */
export function extractPDFTextFallback(buffer: Buffer): string {
  const str = buffer.toString('latin1');
  const textMatches: string[] = [];

  const tjRegex = /\(([^()\r\n]+)\)\s*Tj/g;
  let match;
  while ((match = tjRegex.exec(str)) !== null) {
    if (match[1] && match[1].trim().length > 0) {
      textMatches.push(match[1].trim());
    }
  }

  const arrayTjRegex = /\[\s*((?:\([^()\r\n]+\)\s*|-?\d+\s*)+)\]\s*TJ/gi;
  while ((match = arrayTjRegex.exec(str)) !== null) {
    const inner = match[1];
    const itemRegex = /\(([^()\r\n]+)\)/g;
    let item;
    const lineParts: string[] = [];
    while ((item = itemRegex.exec(inner)) !== null) {
      if (item[1]) lineParts.push(item[1]);
    }
    if (lineParts.length > 0) {
      textMatches.push(lineParts.join(' '));
    }
  }

  const rawExtracted = textMatches.join('\n');
  return cleanPDFText(rawExtracted);
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
        // Direct import of pdf-parse lib to avoid test execution & worker bundling issues
        // @ts-ignore
        const pdfParseModule = await import('pdf-parse/lib/pdf-parse.js');
        const pdfParse = pdfParseModule.default || pdfParseModule;

        if (typeof pdfParse === 'function') {
          const pdfData = await pdfParse(buffer);
          rawText = pdfData?.text || '';
        }
      } catch (pdfErr: any) {
        console.error('pdf-parse primary error, trying fallback stream extractor:', pdfErr?.message || pdfErr);
      }

      // If primary parser returned empty or failed, use fallback PDF stream extractor
      if (!rawText || rawText.trim().length === 0) {
        rawText = extractPDFTextFallback(buffer);
      }

      // Sanitize text to ensure no binary PDF stream leaks into database
      rawText = cleanPDFText(rawText);
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
    rawText = '';
  }

  // Cap maximum chunks to 150 per document to protect DB
  const rawChunks = chunkText(rawText);
  const chunks = rawChunks.slice(0, 150);

  return {
    title: filename.replace(/\.[^/.]+$/, ''),
    fileType,
    rawText,
    chunks,
  };
}
