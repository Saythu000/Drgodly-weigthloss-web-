import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [patientsCount, ordersCount, revenueAgg, pendingReviewsCount] = await Promise.all([
      prisma.intake.count().catch(() => 0),
      prisma.whatsappOrder.count().catch(() => 0),
      prisma.whatsappOrder.aggregate({
        _sum: {
          price: true,
        },
      }).catch(() => ({ _sum: { price: null } })),
      prisma.eligibility.count({
        where: {
          status: 'not_eligible',
        },
      }).catch(() => 0),
    ]);

    const totalRevenueNum = revenueAgg._sum.price ? Number(revenueAgg._sum.price) : 0;

    return NextResponse.json({
      success: true,
      totalPatients: patientsCount,
      totalOrders: ordersCount,
      totalRevenue: totalRevenueNum,
      pendingReviews: pendingReviewsCount,
    });
  } catch (error) {
    console.error('Failed to fetch Overview metrics:', error);
    return NextResponse.json({
      success: true,
      totalPatients: 0,
      totalOrders: 0,
      totalRevenue: 0,
      pendingReviews: 0,
    });
  }
}
