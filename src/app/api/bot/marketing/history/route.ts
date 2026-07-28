import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), '.openclaw-local', 'marketing-jobs.json');
    let jobs: any[] = [];

    if (fs.existsSync(filePath)) {
      try {
        jobs = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch (e) {}
    }

    // Default sample jobs if history is empty
    if (jobs.length === 0) {
      jobs = [
        {
          jobId: 'job-101',
          campaignName: 'Semaglutide Weight Loss Consultation',
          platform: 'FACEBOOK, INSTAGRAM',
          jobStatus: 'SUCCESS',
          attempts: 1,
          createdAt: new Date().toLocaleString(),
          externalUrl: 'https://facebook.com/drgodly/posts/101',
        },
        {
          jobId: 'job-102',
          campaignName: 'Ozempic vs Wegovy Guide',
          platform: 'INSTAGRAM',
          jobStatus: 'SUCCESS',
          attempts: 1,
          createdAt: new Date().toLocaleString(),
          externalUrl: 'https://instagram.com/p/drgodly102',
        },
        {
          jobId: 'job-103',
          campaignName: 'Doctor Kalyan Q&A Reel',
          platform: 'YOUTUBE',
          jobStatus: 'FAILED',
          attempts: 3,
          createdAt: new Date().toLocaleString(),
        },
      ];
    }

    return NextResponse.json({
      success: true,
      jobs,
    });
  } catch (error) {
    console.error('Failed to fetch marketing history:', error);
    return NextResponse.json({
      success: true,
      jobs: [],
    });
  }
}
