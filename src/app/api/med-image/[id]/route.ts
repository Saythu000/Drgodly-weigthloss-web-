import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id) {
    return new NextResponse('Missing image ID', { status: 400 });
  }

  try {
    // Fetch directly from Google usercontent without client Referer blocking
    const targetUrl = `https://lh3.googleusercontent.com/d/${encodeURIComponent(id)}`;
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (response.ok) {
      const contentType = response.headers.get('content-type') || 'image/png';
      const arrayBuffer = await response.arrayBuffer();

      return new NextResponse(arrayBuffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        },
      });
    }

    // Secondary fallback: Google Drive thumbnail endpoint
    const thumbUrl = `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w600`;
    const thumbRes = await fetch(thumbUrl);

    if (thumbRes.ok) {
      const contentType = thumbRes.headers.get('content-type') || 'image/jpeg';
      const arrayBuffer = await thumbRes.arrayBuffer();

      return new NextResponse(arrayBuffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        },
      });
    }
  } catch (error) {
    console.error(`Error proxying medication image ${id}:`, error);
  }

  // Fallback to local placeholder
  return NextResponse.redirect(new URL('/placeholder-med.png', _request.url));
}
