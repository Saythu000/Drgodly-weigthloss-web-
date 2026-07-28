import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Fetch Intakes from Neon PostgreSQL
    const intakes = await prisma.intake.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    }).catch(() => []);

    // 2. Fetch Eligibility records
    const eligibilities = await prisma.eligibility.findMany().catch(() => []);

    // 3. Fetch Orders count per user
    const orders = await prisma.whatsappOrder.findMany().catch(() => []);

    // Map Intakes to PatientLeads matching drgodly-bot logic
    const patients = intakes.map((intake) => {
      const eligibility = eligibilities.find((e) => e.userId === intake.userId);
      const userOrders = orders.filter((o) => o.userId === intake.userId);

      let clinicalStatus = 'Lead';
      if (eligibility) {
        clinicalStatus = eligibility.status === 'eligible' ? 'Healthy' : 'Doctor Review';
      }

      return {
        id: intake.id,
        userId: intake.userId,
        phoneNumber: intake.phone,
        whatsappJid: (intake.preferences as any)?.whatsappJid || intake.phone,
        name: `${intake.firstName} ${intake.lastName}`,
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
