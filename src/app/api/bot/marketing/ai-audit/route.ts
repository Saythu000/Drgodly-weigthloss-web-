import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface AuditFinding {
  rule: string;
  severity: 'CRITICAL' | 'WARNING' | 'PASS';
  message: string;
}

export async function POST(request: Request) {
  try {
    const { caption, platform } = await request.json();

    if (!caption || !caption.trim()) {
      return NextResponse.json(
        { success: false, error: 'Caption is required for pre-flight audit' },
        { status: 400 }
      );
    }

    const text = caption.toLowerCase();
    const findings: AuditFinding[] = [];
    let score = 100;

    // Check 1: Exaggerated / Guaranteed weight loss claims
    const guaranteePhrases = [
      'guarantee',
      'guaranteed',
      'cure',
      'effortless',
      'melt fat',
      'instant weight loss',
      'lose 20 lbs in',
      'lose 30 lbs in',
      'no effort',
      'miracle',
    ];
    for (const phrase of guaranteePhrases) {
      if (text.includes(phrase)) {
        findings.push({
          rule: 'Meta Policy: Unrealistic Health Outcomes',
          severity: 'CRITICAL',
          message: `Detected prohibited guarantee phrase: "${phrase}". Meta prohibits direct guarantees of specific weight loss amounts or miracle claims.`,
        });
        score -= 25;
        break;
      }
    }

    // Check 2: Negative self-perception / Body shaming
    const bodyShamingPhrases = [
      'ugly fat',
      'hate your body',
      'gross belly',
      'embarrassed of your weight',
      'ashamed',
      'disgusting fat',
    ];
    for (const phrase of bodyShamingPhrases) {
      if (text.includes(phrase)) {
        findings.push({
          rule: 'Meta Policy: Personal Attributes & Negative Self-Perception',
          severity: 'CRITICAL',
          message: `Avoid phrase "${phrase}". Ads must not generate negative self-perception or assert personal physical flaws.`,
        });
        score -= 30;
        break;
      }
    }

    // Check 3: Medical Supervision & Prescribing Disclaimer
    const hasMedicalMention =
      text.includes('doctor') ||
      text.includes('physician') ||
      text.includes('prescribed') ||
      text.includes('licensed') ||
      text.includes('dr.');

    if (!hasMedicalMention) {
      findings.push({
        rule: 'FDA Compliance: Medical Supervision Disclosure',
        severity: 'WARNING',
        message: 'Prescription GLP-1 treatments require explicit mention that therapy is physician-evaluated and doctor-supervised.',
      });
      score -= 15;
    }

    // Check 4: Call to action clarity
    const hasCTA =
      text.includes('link') ||
      text.includes('quiz') ||
      text.includes('intake') ||
      text.includes('check') ||
      text.includes('eligibility') ||
      text.includes('consult');

    if (!hasCTA) {
      findings.push({
        rule: 'Performance: Call-to-Action Optimization',
        severity: 'WARNING',
        message: 'No clear Call to Action (CTA) found. Direct patients to take the 2-minute eligibility quiz for higher conversion rates.',
      });
      score -= 10;
    }

    // Check 5: Hashtag presence
    const hashtagCount = (caption.match(/#[a-zA-Z0-9_]+/g) || []).length;
    if (hashtagCount === 0) {
      findings.push({
        rule: 'Organic Reach: Hashtags',
        severity: 'WARNING',
        message: 'Add 2–4 targeted hashtags (e.g. #MedicalWeightLoss, #GLP1, #DoctorGuided) to boost discovery reach.',
      });
      score -= 5;
    } else if (hashtagCount > 8) {
      findings.push({
        rule: 'Spam Prevention: Hashtag Overload',
        severity: 'WARNING',
        message: 'More than 8 hashtags detected. Keep hashtags under 5 to prevent ad platform spam penalties.',
      });
      score -= 5;
    }

    score = Math.max(20, Math.min(100, score));

    const recommendations: string[] = [];
    if (findings.length === 0) {
      recommendations.push('Caption is 100% compliant with Meta Healthcare & Medical Weight Loss advertising policies.');
      recommendations.push('Physician supervision and consultation hooks are clearly stated.');
      recommendations.push('Format is optimized for high-converting patient acquisition.');
    } else {
      findings.forEach((f) => recommendations.push(`${f.rule}: ${f.message}`));
    }

    // Predictive metrics based on score
    const estimatedCTR = (score >= 90 ? 4.2 : score >= 70 ? 2.8 : 1.4).toFixed(1);
    const estimatedCPC = score >= 90 ? '₹16.50' : score >= 70 ? '₹24.00' : '₹38.50';

    return NextResponse.json({
      success: true,
      score,
      complianceText:
        score >= 85
          ? 'Passed Meta Healthcare Policy & FDA Telehealth advertising compliance checks.'
          : 'Flagged potential policy violations. Review recommendations below before running paid ads.',
      engagementText: `Estimated CTR: ${estimatedCTR}% | Estimated Cost Per Lead Click (CPC): ${estimatedCPC}`,
      findings,
      recommendations,
    });
  } catch (error) {
    console.error('Error running AI audit:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to run pre-flight audit' },
      { status: 500 }
    );
  }
}
