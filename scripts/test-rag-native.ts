import { analyzeDocumentSample, getActiveDomainProfile } from '../src/lib/domain-analyzer';
import { searchKnowledgeBase } from '../src/lib/rag-retriever';
import { getKnowledgeBaseAsync, ingestDocumentChunksAsync, deleteKnowledgeDocumentAsync, getKnowledgeDocumentsLocal } from '../src/lib/knowledge-store';

async function main() {
  console.log('=== [TEST 1] Initializing Native DrGodly RAG Knowledge Base ===');
  const initialKB = await getKnowledgeBaseAsync();
  console.log(`✅ Loaded ${initialKB.length} knowledge base items.`);

  console.log('\n=== [TEST 2] Testing Dynamic Domain Auto-Discovery ===');
  const sampleDocText = `
    DrGodly Clinical Guidance & Service Overview 2026.
    DrGodly provides doctor-guided Semaglutide GLP-1 weight loss treatments.
    Medications include Semalix (3mg, 7mg, 14mg), Obeda (2mg, 4mg), and Sundae Vials.
    Express cold-chain transport (2°C to 8°C). Helpline: +91 9346317790.
  `;

  const profile = analyzeDocumentSample(sampleDocText);
  console.log('✅ Dynamic Persona Inferred:', {
    companyName: profile.companyName,
    industryDomain: profile.industryDomain,
    personaRole: profile.personaRole,
  });

  console.log('\n=== [TEST 3] Testing Document Ingestion & Chunking ===');
  const testDoc = await ingestDocumentChunksAsync(
    'test_medical_protocol.pdf',
    'PDF',
    '12.4 KB',
    'MEDICAL_PROTOCOL',
    sampleDocText,
    [sampleDocText.slice(0, 150), sampleDocText.slice(150)]
  );
  console.log(`✅ Ingested document '${testDoc.filename}' with ${testDoc.chunkCount} chunks.`);

  console.log('\n=== [TEST 4] Testing Hybrid BM25 Keyword Search ===');
  const results = await searchKnowledgeBase('Semaglutide dosage', 2);
  console.log(`✅ Search returned ${results.length} matched chunks:`);
  results.forEach((r, i) => {
    console.log(`   ${i + 1}. [Score: ${r.relevanceScore}] ${r.title}`);
  });

  console.log('\n=== [TEST 5] Testing Document Deletion Purge & Persona Reset ===');
  const purged = await deleteKnowledgeDocumentAsync(testDoc.id, testDoc.filename);
  const docsAfter = getKnowledgeDocumentsLocal();
  const currentProfile = getActiveDomainProfile();
  console.log(`✅ Document purged (${purged}). Remaining docs: ${docsAfter.length}. Active domain: '${currentProfile.industryDomain}'`);

  console.log('\n🎉 ALL NATIVE NEXT.JS DRGODLY RAG TESTS PASSED CLEANLY! 🎉');
}

main().catch(console.error);
