import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

export const dynamic = 'force-dynamic';

const PIPELINES_FILE = path.join(process.cwd(), '.openclaw-local', 'pipelines.json');
const DEALS_FILE = path.join(process.cwd(), '.openclaw-local', 'deals.json');
const CONTACTS_FILE = path.join(process.cwd(), '.openclaw-local', 'contacts.json');

const DEFAULT_STAGES = [
  { id: 'stg-1', name: 'New Intake', probability: 10, stageType: 'open', color: '#3B82F6', position: 0 },
  { id: 'stg-2', name: 'Doctor Review', probability: 30, stageType: 'open', color: '#EAB308', position: 1 },
  { id: 'stg-3', name: 'Approved / Eligible', probability: 70, stageType: 'open', color: '#16A34A', position: 2 },
  { id: 'stg-4', name: 'Prescription Sent', probability: 90, stageType: 'open', color: '#A855F7', position: 3 },
  { id: 'stg-5', name: 'Order Placed', probability: 100, stageType: 'won', color: '#0D9488', position: 4 },
];

const DEFAULT_PIPELINES = [
  {
    id: 'pipe-1',
    name: 'GLP-1 Weightloss Pipeline',
    isDefault: true,
    position: 0,
    stages: DEFAULT_STAGES,
  },
];

const DEFAULT_DEALS = [
  {
    id: 'deal-1',
    pipelineId: 'pipe-1',
    stageId: 'stg-1',
    title: 'Kalyan Sontha - Wegovy 0.25mg Consult',
    value: 14500,
    currency: 'INR',
    status: 'open',
    assignedUserId: 'doc-1',
    assignedUserName: 'Dr. Kalyan',
    contactWaNumber: '919390834107',
    contactNumber: '+91 93908 34107',
    contactName: 'Kalyan Sontha',
    expectedCloseDate: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
    notes: 'Patient requested GLP-1 weightloss intake. Initial BMI: 31.2.',
    shippingState: 'Telangana',
    bmi: 31.2,
    clinicalStatus: 'Needs Review',
    orderCount: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'deal-2',
    pipelineId: 'pipe-1',
    stageId: 'stg-2',
    title: 'DrGodly Patient - Ozempic 1.0mg Refill',
    value: 18200,
    currency: 'INR',
    status: 'open',
    assignedUserId: 'doc-1',
    assignedUserName: 'Dr. Kalyan',
    contactWaNumber: '919876543210',
    contactNumber: '+91 98765 43210',
    contactName: 'Priya Sharma',
    expectedCloseDate: new Date(Date.now() + 86400000 * 5).toISOString().slice(0, 10),
    notes: 'Refill consultation for Ozempic maintenance dosage.',
    shippingState: 'Maharashtra',
    bmi: 28.4,
    clinicalStatus: 'Healthy',
    orderCount: 3,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'deal-3',
    pipelineId: 'pipe-1',
    stageId: 'stg-5',
    title: 'Rahul Verma - Rybelsus 7mg Intake',
    value: 12800,
    currency: 'INR',
    status: 'won',
    assignedUserId: 'doc-1',
    assignedUserName: 'Dr. Kalyan',
    contactWaNumber: '919123456789',
    contactNumber: '+91 91234 56789',
    contactName: 'Rahul Verma',
    expectedCloseDate: new Date().toISOString().slice(0, 10),
    notes: 'Prescription approved and order dispatched.',
    shippingState: 'Karnataka',
    bmi: 29.8,
    clinicalStatus: 'Healthy',
    orderCount: 2,
    createdAt: new Date().toISOString(),
  },
];

function readJsonFile(filePath: string, defaultVal: any) {
  if (fs.existsSync(filePath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {}
  }
  return defaultVal;
}

function writeJsonFile(filePath: string, data: any) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function calculateMetrics(deals: any[], stages: any[]) {
  const openDeals = deals.filter((d) => d.status === 'open');
  const totalDeals = openDeals.length;
  const pipelineValue = openDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
  const avgDealSize = totalDeals > 0 ? pipelineValue / totalDeals : 0;

  const stageProbMap = new Map(stages.map((s) => [s.id, s.probability || 0]));
  const weightedValue = openDeals.reduce((sum, d) => {
    const prob = stageProbMap.get(d.stageId) || 0;
    return sum + (Number(d.value) || 0) * (prob / 100);
  }, 0);

  const now = new Date();
  const firstOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const wonThisMonth = deals.filter(
    (d) => d.status === 'won' && (d.wonAt || d.createdAt) >= firstOfCurrentMonth
  ).length;

  const lostThisMonth = deals.filter(
    (d) => d.status === 'lost' && (d.lostAt || d.createdAt) >= firstOfCurrentMonth
  ).length;

  return {
    totalDeals,
    pipelineValue,
    avgDealSize,
    weightedValue,
    wonThisMonth,
    lostThisMonth,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedPipelineId = searchParams.get('pipelineId');

    const pipelines = readJsonFile(PIPELINES_FILE, DEFAULT_PIPELINES);
    let deals = readJsonFile(DEALS_FILE, DEFAULT_DEALS);

    const selectedPipeline =
      pipelines.find((p: any) => p.id === requestedPipelineId) ||
      pipelines.find((p: any) => p.isDefault) ||
      pipelines[0];

    const currentDeals = deals.filter((d: any) => d.pipelineId === selectedPipeline.id);
    const metrics = calculateMetrics(currentDeals, selectedPipeline.stages || []);

    // Format patients array for legacy backwards compatibility
    const patients = currentDeals.map((d: any) => ({
      id: d.id,
      userId: d.id,
      name: d.contactName || d.title,
      firstName: (d.contactName || d.title).split(' ')[0] || 'Patient',
      lastName: (d.contactName || d.title).split(' ').slice(1).join(' ') || 'Card',
      phone: d.contactNumber || d.contactWaNumber || '—',
      email: d.email || 'patient@drgodly.com',
      shippingState: d.shippingState || 'Telangana',
      stage: d.stageId,
      bmi: d.bmi || 28.5,
      clinicalStatus: d.clinicalStatus || 'Healthy',
      orderCount: d.orderCount || 1,
      createdAt: d.createdAt,
      dealData: d,
    }));

    return NextResponse.json({
      success: true,
      pipelines,
      selectedPipelineId: selectedPipeline.id,
      selectedPipeline,
      stages: selectedPipeline.stages,
      deals: currentDeals,
      patients,
      metrics,
    });
  } catch (error: any) {
    console.error('Failed to GET pipelines:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to fetch pipelines' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      action,
      pipelineId,
      stageId,
      patientId,
      dealId,
      name,
      title,
      value,
      assignedUserId,
      contactWaNumber,
      contactNumber,
      contactName,
      expectedCloseDate,
      notes,
      stage,
      probability,
      color,
      stageType,
      query,
    } = body;

    let pipelines = readJsonFile(PIPELINES_FILE, DEFAULT_PIPELINES);
    let deals = readJsonFile(DEALS_FILE, DEFAULT_DEALS);

    // Search Contacts Action
    if (action === 'search-contacts' || query) {
      const searchQ = (query || '').trim().toLowerCase();
      if (!searchQ) return NextResponse.json({ success: true, contacts: [] });

      const contacts = readJsonFile(CONTACTS_FILE, []);
      const matched = contacts
        .filter(
          (c: any) =>
            (c.name && c.name.toLowerCase().includes(searchQ)) ||
            (c.phone && c.phone.includes(searchQ))
        )
        .slice(0, 15)
        .map((c: any) => ({
          waNumber: c.phone?.replace(/\D/g, '') || '',
          contactNumber: c.phone || '',
          name: c.name || 'WhatsApp Contact',
        }));

      return NextResponse.json({ success: true, contacts: matched });
    }

    // Action 1: Create Pipeline
    if (action === 'create-pipeline') {
      if (!name || !name.trim()) {
        return NextResponse.json({ success: false, error: 'Pipeline name is required' }, { status: 400 });
      }
      const newPipeline = {
        id: `pipe-${Date.now()}`,
        name: name.trim(),
        isDefault: false,
        position: pipelines.length,
        stages: DEFAULT_STAGES.map((s, idx) => ({
          ...s,
          id: `stg-${Date.now()}-${idx}`,
        })),
      };
      pipelines.push(newPipeline);
      writeJsonFile(PIPELINES_FILE, pipelines);
      return NextResponse.json({ success: true, pipeline: newPipeline });
    }

    // Action 2: Rename Pipeline
    if (action === 'rename-pipeline') {
      if (!pipelineId || !name) {
        return NextResponse.json({ success: false, error: 'pipelineId and name are required' }, { status: 400 });
      }
      pipelines = pipelines.map((p: any) => (p.id === pipelineId ? { ...p, name: name.trim() } : p));
      writeJsonFile(PIPELINES_FILE, pipelines);
      return NextResponse.json({ success: true, message: 'Pipeline renamed' });
    }

    // Action 3: Delete Pipeline
    if (action === 'delete-pipeline') {
      if (pipelines.length <= 1) {
        return NextResponse.json({ success: false, error: 'Cannot delete the only pipeline.' }, { status: 400 });
      }
      pipelines = pipelines.filter((p: any) => p.id !== pipelineId);
      deals = deals.filter((d: any) => d.pipelineId !== pipelineId);
      writeJsonFile(PIPELINES_FILE, pipelines);
      writeJsonFile(DEALS_FILE, deals);
      return NextResponse.json({ success: true, message: 'Pipeline deleted' });
    }

    // Action 4: Save / Update Stage
    if (action === 'save-stage') {
      const targetPipe = pipelines.find((p: any) => p.id === pipelineId);
      if (!targetPipe) {
        return NextResponse.json({ success: false, error: 'Pipeline not found' }, { status: 404 });
      }

      if (stageId) {
        // Edit existing stage
        targetPipe.stages = targetPipe.stages.map((s: any) =>
          s.id === stageId
            ? {
                ...s,
                name: name ? name.trim() : s.name,
                probability: probability !== undefined ? Math.max(0, Math.min(100, Number(probability))) : s.probability,
                color: color || s.color,
                stageType: stageType || s.stageType,
              }
            : s
        );
      } else {
        // Add new stage
        const newStage = {
          id: `stg-${Date.now()}`,
          name: name ? name.trim() : 'New Stage',
          probability: probability !== undefined ? Math.max(0, Math.min(100, Number(probability))) : 0,
          stageType: stageType || 'open',
          color: color || '#64748B',
          position: targetPipe.stages.length,
        };
        targetPipe.stages.push(newStage);
      }

      writeJsonFile(PIPELINES_FILE, pipelines);
      return NextResponse.json({ success: true, stages: targetPipe.stages });
    }

    // Action 5: Delete Stage
    if (action === 'delete-stage') {
      const dealCountInStage = deals.filter((d: any) => d.stageId === stageId).length;
      if (dealCountInStage > 0) {
        return NextResponse.json({ success: false, error: 'Move or delete deals in this stage first.' }, { status: 400 });
      }

      pipelines = pipelines.map((p: any) => ({
        ...p,
        stages: p.stages.filter((s: any) => s.id !== stageId),
      }));
      writeJsonFile(PIPELINES_FILE, pipelines);
      return NextResponse.json({ success: true, message: 'Stage deleted' });
    }

    // Action 6: Save / Update Deal
    if (action === 'save-deal') {
      const targetId = dealId || patientId;
      const targetPipe = pipelines.find((p: any) => p.id === pipelineId) || pipelines[0];
      const targetStage = targetPipe.stages.find((s: any) => s.id === stageId) || targetPipe.stages[0];
      const newStatus = targetStage.stageType === 'won' ? 'won' : targetStage.stageType === 'lost' ? 'lost' : 'open';

      if (targetId) {
        deals = deals.map((d: any) =>
          d.id === targetId
            ? {
                ...d,
                title: title ? title.trim() : d.title,
                value: value !== undefined ? Number(value) : d.value,
                stageId: targetStage.id,
                status: newStatus,
                assignedUserId: assignedUserId || d.assignedUserId,
                assignedUserName: assignedUserId === 'doc-1' ? 'Dr. Kalyan' : 'Unassigned',
                contactWaNumber: contactWaNumber || d.contactWaNumber,
                contactNumber: contactNumber || d.contactNumber,
                contactName: contactName || d.contactName,
                expectedCloseDate: expectedCloseDate || d.expectedCloseDate,
                notes: notes !== undefined ? notes : d.notes,
                updatedAt: new Date().toISOString(),
              }
            : d
        );
      } else {
        const newDeal = {
          id: `deal-${Date.now()}`,
          pipelineId: targetPipe.id,
          stageId: targetStage.id,
          title: title ? title.trim() : `${contactName || 'New Patient'} Intake`,
          value: Number(value) || 14500,
          currency: 'INR',
          status: newStatus,
          assignedUserId: assignedUserId || 'doc-1',
          assignedUserName: assignedUserId === 'doc-1' ? 'Dr. Kalyan' : 'Staff',
          contactWaNumber: contactWaNumber ? String(contactWaNumber).replace(/\D/g, '') : null,
          contactNumber: contactNumber || null,
          contactName: contactName || null,
          expectedCloseDate: expectedCloseDate || new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
          notes: notes || null,
          shippingState: 'Telangana',
          bmi: 28.5,
          clinicalStatus: 'Healthy',
          orderCount: 1,
          createdAt: new Date().toISOString(),
        };
        deals.unshift(newDeal);
      }

      writeJsonFile(DEALS_FILE, deals);
      return NextResponse.json({ success: true, message: 'Deal saved successfully' });
    }

    // Action 7: Move Deal Stage (Drag & Drop or Select)
    if (action === 'move-deal' || patientId || dealId) {
      const targetId = dealId || patientId;
      const targetStageId = stageId || stage;

      if (!targetId || !targetStageId) {
        return NextResponse.json({ success: false, error: 'patientId/dealId and stageId required' }, { status: 400 });
      }

      const existingDeal = deals.find((d: any) => d.id === targetId);
      if (!existingDeal) {
        return NextResponse.json({ success: false, error: 'Deal/Patient not found' }, { status: 404 });
      }

      const targetPipe = pipelines.find((p: any) => p.id === existingDeal.pipelineId) || pipelines[0];
      const targetStage = targetPipe.stages.find((s: any) => s.id === targetStageId) || { stageType: 'open' };
      const newStatus = targetStage.stageType === 'won' ? 'won' : targetStage.stageType === 'lost' ? 'lost' : 'open';

      deals = deals.map((d: any) =>
        d.id === targetId
          ? {
              ...d,
              stageId: targetStageId,
              status: newStatus,
              wonAt: newStatus === 'won' ? new Date().toISOString() : null,
              lostAt: newStatus === 'lost' ? new Date().toISOString() : null,
              updatedAt: new Date().toISOString(),
            }
          : d
      );

      writeJsonFile(DEALS_FILE, deals);
      return NextResponse.json({ success: true, message: 'Stage updated successfully' });
    }

    // Action 8: Delete Deal
    if (action === 'delete-deal') {
      const targetId = dealId || patientId;
      deals = deals.filter((d: any) => d.id !== targetId);
      writeJsonFile(DEALS_FILE, deals);
      return NextResponse.json({ success: true, message: 'Deal deleted successfully' });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('Failed to POST pipeline:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}
