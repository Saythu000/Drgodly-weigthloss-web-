import { NextRequest, NextResponse } from 'next/server';
import { parseDocumentBuffer } from '@/lib/doc-parser';
import { ingestDocumentChunksAsync } from '@/lib/knowledge-store';
import { analyzeDocumentSample } from '@/lib/domain-analyzer';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    // URL Scrape Mode
    if (contentType.includes('application/json')) {
      const body = await req.json();
      const url = body.url;
      const category = body.category || 'CLINIC_INFO';

      if (!url || typeof url !== 'string' || !url.startsWith('http')) {
        return NextResponse.json({ success: false, error: 'Invalid URL provided' }, { status: 400 });
      }

      try {
        const response = await fetch(url, { headers: { 'User-Agent': 'DrGodlyRAGScraper/1.0' } });
        const html = await response.text();
        const cleanText = html
          .replace(/<script\b[^<]*>([\s\S]*?)<\/script>/gi, '')
          .replace(/<style\b[^<]*>([\s\S]*?)<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        const domainName = new URL(url).hostname;
        const chunks = [cleanText.slice(0, 1500), cleanText.slice(1400, 2900)].filter(Boolean);

        const doc = await ingestDocumentChunksAsync(
          `Web Page: ${domainName}`,
          'URL',
          `${cleanText.length} chars`,
          category,
          cleanText,
          chunks.length > 0 ? chunks : [cleanText]
        );

        // Trigger Dynamic Domain Persona Auto-Discovery
        const activeDomain = analyzeDocumentSample(cleanText);

        return NextResponse.json({
          success: true,
          document: doc,
          activeDomainProfile: activeDomain,
          message: `Ingested webpage from ${domainName} and updated dynamic domain persona`,
        });
      } catch (err: any) {
        return NextResponse.json({ success: false, error: `Failed to scrape URL: ${err.message}` }, { status: 500 });
      }
    }

    // Multipart File Upload Mode
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const category = (formData.get('category') as any) || 'FAQ';

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const sizeInKb = (file.size / 1024).toFixed(1) + ' KB';

    // Parse Document
    const parsedDoc = await parseDocumentBuffer(buffer, file.name);

    if (!parsedDoc.rawText || parsedDoc.rawText.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Could not extract readable text from document' }, { status: 400 });
    }

    // Ingest Chunks into Knowledge Base
    const doc = await ingestDocumentChunksAsync(
      file.name,
      parsedDoc.fileType,
      sizeInKb,
      category,
      parsedDoc.rawText,
      parsedDoc.chunks
    );

    // Trigger Dynamic Domain Persona Auto-Discovery
    const activeDomain = analyzeDocumentSample(parsedDoc.rawText);

    return NextResponse.json({
      success: true,
      document: doc,
      activeDomainProfile: activeDomain,
      message: `Ingested ${parsedDoc.chunks.length} semantic chunks from ${file.name} and updated dynamic domain persona`,
    });
  } catch (err: any) {
    console.error('Document Upload Error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Upload processing failed' }, { status: 500 });
  }
}
