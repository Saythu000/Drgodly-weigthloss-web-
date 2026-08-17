import fs from 'node:fs';
import path from 'node:path';
import { prisma } from './prisma';
import { resetDomainProfile } from './domain-analyzer';

export interface KnowledgeItem {
  id: string;
  title: string;
  category: 'FAQ' | 'MEDICAL_PROTOCOL' | 'PRICING_POLICY' | 'CLINIC_INFO';
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const KB_FILE_PATH = path.join(process.cwd(), '.openclaw-local', 'knowledge-base.json');

const INITIAL_KNOWLEDGE: KnowledgeItem[] = [
  {
    id: 'kb-01',
    title: 'DrGodly Overview & Operating Hours',
    category: 'CLINIC_INFO',
    content: 'DrGodly Telehealth Center operates Monday through Saturday from 9:00 AM to 8:00 PM IST. Helpline: +91 9346317790. Consultations are available online nationwide.',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-02',
    title: 'Available GLP-1 Medications & Dosages',
    category: 'MEDICAL_PROTOCOL',
    content: 'DrGodly provides doctor-guided Semaglutide treatments: 1) Semalix oral tablets (Torrent Pharma: 3mg, 7mg, 14mg), 2) Obeda pre-filled injectable pens (Dr. Reddys: 2mg, 4mg), 3) Sundae multi-dose vials (Eris Lifesciences: 0.25mg, 0.5mg, 1mg). Prescriptions are required following doctor evaluation.',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-03',
    title: 'The 4-Step Patient Journey',
    category: 'CLINIC_INFO',
    content: 'Step 1: Online Medical Assessment (BMI, medical history). Step 2: Licensed Doctor Consultation & Prescription. Step 3: Express Temperature-Controlled Delivery (2°C to 8°C cold-chain packaging). Step 4: Continuous Clinical Support.',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-04',
    title: 'Pricing & Consultation Policy',
    category: 'PRICING_POLICY',
    content: 'Consultation and GLP-1 prescription assessment fees are fixed per evaluation. All orders include express cold-chain delivery. Payments processed securely via Razorpay.',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export async function getKnowledgeBaseAsync(): Promise<KnowledgeItem[]> {
  try {
    const dbItems = await prisma.knowledgeBase.findMany({
      orderBy: { createdAt: 'desc' },
    });
    if (dbItems && dbItems.length > 0) {
      return dbItems.map((item: any) => ({
        id: item.id,
        title: item.title,
        category: item.category as any,
        content: item.content,
        isActive: item.isActive,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      }));
    }
  } catch (e) {
    console.warn('Prisma DB unavailable for KnowledgeBase, falling back to local storage file.');
  }

  return getKnowledgeBaseLocal();
}

export function getKnowledgeBaseLocal(): KnowledgeItem[] {
  try {
    if (fs.existsSync(KB_FILE_PATH)) {
      const data = fs.readFileSync(KB_FILE_PATH, 'utf8');
      return JSON.parse(data);
    }
    saveKnowledgeBaseLocal(INITIAL_KNOWLEDGE);
    return INITIAL_KNOWLEDGE;
  } catch (e) {
    return INITIAL_KNOWLEDGE;
  }
}

export function getKnowledgeBase(): KnowledgeItem[] {
  return getKnowledgeBaseLocal();
}

export function saveKnowledgeBaseLocal(items: KnowledgeItem[]): void {
  try {
    const dir = path.dirname(KB_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(KB_FILE_PATH, JSON.stringify(items, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving Knowledge Base locally:', e);
  }
}

export async function addKnowledgeItemAsync(title: string, category: KnowledgeItem['category'], content: string): Promise<KnowledgeItem> {
  try {
    const created = await prisma.knowledgeBase.create({
      data: {
        title: title.trim(),
        category,
        content: content.trim(),
        isActive: true,
        chunks: {
          create: [
            {
              chunkIndex: 0,
              chunkContent: content.trim(),
            },
          ],
        },
      },
    });

    const item: KnowledgeItem = {
      id: created.id,
      title: created.title,
      category: created.category as any,
      content: created.content,
      isActive: created.isActive,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };

    const local = getKnowledgeBaseLocal();
    local.unshift(item);
    saveKnowledgeBaseLocal(local);

    return item;
  } catch (e) {
    console.warn('Prisma DB write failed, adding knowledge item to local storage.');
    return addKnowledgeItem(title, category, content);
  }
}

export function addKnowledgeItem(title: string, category: KnowledgeItem['category'], content: string): KnowledgeItem {
  const items = getKnowledgeBaseLocal();
  const newItem: KnowledgeItem = {
    id: `kb-${Date.now()}`,
    title: title.trim(),
    category,
    content: content.trim(),
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  items.unshift(newItem);
  saveKnowledgeBaseLocal(items);
  return newItem;
}

export interface KnowledgeDocument {
  id: string;
  filename: string;
  fileType: string;
  fileSize: string;
  category: 'FAQ' | 'MEDICAL_PROTOCOL' | 'PRICING_POLICY' | 'CLINIC_INFO';
  chunkCount: number;
  status: 'INDEXED' | 'PROCESSING' | 'ERROR';
  createdAt: string;
  updatedAt: string;
}

const DOCS_FILE_PATH = path.join(process.cwd(), '.openclaw-local', 'knowledge-documents.json');

export function getKnowledgeDocumentsLocal(): KnowledgeDocument[] {
  try {
    if (fs.existsSync(DOCS_FILE_PATH)) {
      const data = fs.readFileSync(DOCS_FILE_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    // fallback empty
  }
  return [];
}

export function saveKnowledgeDocumentsLocal(docs: KnowledgeDocument[]): void {
  try {
    const dir = path.dirname(DOCS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DOCS_FILE_PATH, JSON.stringify(docs, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving Knowledge Documents locally:', e);
  }
}

export async function ingestDocumentChunksAsync(
  filename: string,
  fileType: string,
  fileSize: string,
  category: KnowledgeItem['category'],
  rawText: string,
  chunks: string[]
): Promise<KnowledgeDocument> {
  const docId = `doc-${Date.now()}`;
  const doc: KnowledgeDocument = {
    id: docId,
    filename,
    fileType,
    fileSize,
    category,
    chunkCount: chunks.length,
    status: 'INDEXED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const localItems = getKnowledgeBaseLocal();

  const chunkObjects = chunks.map((chunk, i) => ({
    title: `${filename} (Part ${i + 1}/${chunks.length})`,
    category,
    content: `[Source Document: ${filename}]\n${chunk}`,
    isActive: true,
  }));

  try {
    await prisma.knowledgeBase.createMany({
      data: chunkObjects,
    });
  } catch (e) {
    // Fallback to parallel Promise.all if createMany fails
    await Promise.all(
      chunkObjects.map((item) =>
        prisma.knowledgeBase.create({ data: item }).catch(() => null)
      )
    );
  }

  for (let i = 0; i < chunkObjects.length; i++) {
    localItems.unshift({
      id: `kb-doc-${Date.now()}-${i}`,
      title: chunkObjects[i].title,
      category,
      content: chunkObjects[i].content,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  saveKnowledgeBaseLocal(localItems);

  const docs = getKnowledgeDocumentsLocal();
  docs.unshift(doc);
  saveKnowledgeDocumentsLocal(docs);

  return doc;
}

export async function deleteKnowledgeItemAsync(id: string): Promise<boolean> {
  try {
    await prisma.knowledgeBase.delete({ where: { id } });
    deleteKnowledgeItem(id);
    return true;
  } catch (e) {
    return deleteKnowledgeItem(id);
  }
}

export function deleteKnowledgeItem(id: string): boolean {
  const items = getKnowledgeBaseLocal();
  const filtered = items.filter((item) => item.id !== id);
  if (filtered.length !== items.length) {
    saveKnowledgeBaseLocal(filtered);
    return true;
  }
  return false;
}

export async function deleteKnowledgeDocumentAsync(docId: string, filename: string): Promise<boolean> {
  // 1. Purge from Document Metadata JSON
  const remainingDocs = getKnowledgeDocumentsLocal().filter((d) => d.id !== docId);
  saveKnowledgeDocumentsLocal(remainingDocs);

  // 2. Purge chunks from Local KB JSON
  const localItems = getKnowledgeBaseLocal().filter((item) => !item.title.startsWith(filename));
  saveKnowledgeBaseLocal(localItems);

  // 3. Purge chunks from Prisma DB
  try {
    const dbItems = await prisma.knowledgeBase.findMany({
      where: { title: { startsWith: filename } },
    });
    for (const item of dbItems) {
      await prisma.knowledgeBase.delete({ where: { id: item.id } });
    }
  } catch (e) {
    // Ignore DB errors
  }

  // 4. If 0 uploaded documents remain, reset dynamic domain profile
  if (remainingDocs.length === 0) {
    resetDomainProfile();
  }

  return true;
}
