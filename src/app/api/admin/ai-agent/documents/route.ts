import { NextRequest, NextResponse } from 'next/server';
import { getKnowledgeDocumentsLocal, deleteKnowledgeDocumentAsync } from '@/lib/knowledge-store';
import { getActiveDomainProfile } from '@/lib/domain-analyzer';

export async function GET() {
  try {
    const docs = getKnowledgeDocumentsLocal();
    const activeDomain = getActiveDomainProfile();
    return NextResponse.json({ success: true, documents: docs, activeDomainProfile: activeDomain });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const filename = searchParams.get('filename');

    if (!id || !filename) {
      return NextResponse.json({ success: false, error: 'Document id and filename required' }, { status: 400 });
    }

    // Execute 4-tier document purge & persona reset if documents reach 0
    await deleteKnowledgeDocumentAsync(id, filename);

    const remainingDocs = getKnowledgeDocumentsLocal();
    const updatedDomain = getActiveDomainProfile();

    return NextResponse.json({
      success: true,
      message: `Document '${filename}' purged completely from database and search indices.`,
      remainingDocumentsCount: remainingDocs.length,
      activeDomainProfile: updatedDomain,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
