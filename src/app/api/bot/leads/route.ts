import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AttributionData } from '@/lib/tracking/attribution';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Fetch Intakes from Neon PostgreSQL
    const intakes = await prisma.intake.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    }).catch(() => []);

    // 2. Fetch CRM Leads
    const crmLeads = await prisma.lead.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    }).catch(() => []);

    // 3. Fetch Eligibility records
    const eligibilities = await prisma.eligibility.findMany().catch(() => []);

    // 4. Fetch Orders count per user
    const orders = await prisma.whatsappOrder.findMany().catch(() => []);

    // Map Intakes to PatientLeads
    const seenPhones = new Set<string>();

    const patients = intakes.map((intake) => {
      seenPhones.add(intake.phone);
      const eligibility = eligibilities.find((e) => e.userId === intake.userId);
      const userOrders = orders.filter((o) => o.userId === intake.userId);

      let clinicalStatus = 'Lead';
      if (eligibility) {
        clinicalStatus = eligibility.status === 'eligible' ? 'Healthy' : 'Doctor Review';
      }

      const attr: AttributionData | undefined = (intake.preferences as any)?.attribution;

      return {
        id: intake.id,
        userId: intake.userId,
        phoneNumber: intake.phone,
        whatsappJid: (intake.preferences as any)?.whatsappJid || intake.phone,
        name: `${intake.firstName} ${intake.lastName}`.trim() || 'Patient',
        firstName: intake.firstName,
        lastName: intake.lastName,
        email: intake.email,
        area: intake.shippingState || '—',
        clinicalStatus, // 'Healthy' | 'Doctor Review' | 'Lead'
        orderCount: userOrders.length,
        height: intake.height || null,
        weight: intake.weight || null,
        goalWeight: intake.goalWeight || null,
        gender: intake.gender || '—',
        dateOfBirth: intake.dateOfBirth ? new Date(intake.dateOfBirth).toISOString() : null,
        healthData: intake.healthData || {},
        history: intake.history || {},
        additionalInfo: intake.additionalInfo || '',
        attribution: attr || null,
        createdAt: intake.createdAt ? new Date(intake.createdAt).toISOString() : new Date().toISOString(),
        orders: userOrders.map((o) => ({
          id: o.id,
          productName: o.productName,
          price: Number(o.price),
          paymentMethod: o.paymentMethod,
          status: o.status,
          createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : new Date().toISOString(),
        })),
      };
    });

    // Also include any leads from prisma.lead that weren't in intakes
    crmLeads.forEach((lead) => {
      if (!seenPhones.has(lead.phoneNumber)) {
        seenPhones.add(lead.phoneNumber);
        const attr: AttributionData | undefined = (lead.healthFlags as any)?.attribution;

        patients.push({
          id: lead.id,
          userId: `user-${lead.phoneNumber}`,
          phoneNumber: lead.phoneNumber,
          whatsappJid: lead.phoneNumber,
          name: lead.name || 'Web Patient',
          firstName: lead.name?.split(' ')[0] || 'Patient',
          lastName: lead.name?.split(' ').slice(1).join(' ') || '',
          email: '',
          area: '—',
          clinicalStatus: (lead.intakeStatus === 'APPROVED' ? 'Healthy' : lead.intakeStatus === 'DOCTOR_REVIEW' ? 'Doctor Review' : 'Lead') as any,
          orderCount: 0,
          height: null,
          weight: null,
          goalWeight: null,
          gender: '—',
          dateOfBirth: null,
          healthData: lead.healthFlags || {},
          history: {},
          additionalInfo: lead.preferredMedication ? `Preferred: ${lead.preferredMedication}` : '',
          attribution: attr || null,
          createdAt: lead.createdAt ? new Date(lead.createdAt).toISOString() : new Date().toISOString(),
          orders: [],
        });
      }
    });

    return NextResponse.json({
      success: true,
      patients,
    });
  } catch (error) {
    console.error('Failed to fetch patient leads:', error);
    return NextResponse.json({
      success: true,
      patients: [],
    });
  }
}
