import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const TEMPLATES: Record<string, string[]> = {
  PAID_LEADS: [
    `Struggling with stubborn weight despite diet and exercise? 🩺 Doctor-guided GLP-1 therapy (Semaglutide/Tirzepatide) helps calm "food noise" and regulate metabolic satiety.\n\n✨ Complete our confidential 2-minute clinical intake.\n✨ Same-day review by Dr. Kalyan and licensed physicians.\n✨ Delivered directly to your door.\n\nTake the qualification quiz today! #DoctorGuided #GLP1WeightLoss #Semaglutide #DrGodlyTelehealth`,
    `Breakthrough metabolic healthcare without crowded clinic waiting rooms. 🌿 Discover if doctor-prescribed GLP-1 medication is right for your health profile.\n\n✔️ 100% Virtual medical consults\n✔️ Transparent pricing — no hidden fees\n✔️ Ongoing physician monitoring & dose titration\n\nCheck your eligibility in 90 seconds. Link in bio! #Telehealth #WeightManagement #MedicalWellness #DrGodly`,
  ],
  ORGANIC: [
    `What actually happens when you take a GLP-1 medication? 💡\n\n1️⃣ Satiety Signaling: Mimics natural gut hormones to signal fullness sooner.\n2️⃣ Delayed Gastric Emptying: Keeps you satisfied longer after balanced meals.\n3️⃣ Blood Sugar Regulation: Stabilizes glucose spikes to curb cravings.\n\nEvery patient journey is physician-supervised by Dr. Kalyan for safe, sustainable outcomes. Have questions? Ask our care team in the comments! 💬\n\n#MetabolicHealth #GLP1Science #DoctorConsult #DrGodlyTelehealth`,
    `Healthy, sustainable weight loss is about biology, not willpower. 🧬 Virtual doctor consultations, evidence-based medication protocols, and 24/7 care team guidance — all in one platform.\n\nLearn more at drgodly.com 🩺✨\n\n#EvidenceBasedMedicine #HealthJourney #WeightLossSupport #DrGodly`,
  ],
  PAID_REACH: [
    `Meet the modern approach to medical weight care. 🌟 DrGodly Telehealth pairs you with licensed doctors to personalize FDA-approved GLP-1 treatment plans from the comfort of home.\n\nAffordable monthly plans • Free doorstep delivery • No long-term lock-in.\n\nStart your consultation now! #ModernTelehealth #DoctorSupervised #GLP1 #DrGodlyTelehealth`,
  ],
};

export async function POST(request: Request) {
  try {
    const { campaignType, platform } = await request.json();
    const typeKey = campaignType && TEMPLATES[campaignType] ? campaignType : 'PAID_LEADS';
    const copyList = TEMPLATES[typeKey];
    const randomIndex = Math.floor(Math.random() * copyList.length);
    const selectedCopy = copyList[randomIndex];

    return NextResponse.json({
      success: true,
      copy: selectedCopy,
      variations: copyList,
    });
  } catch (error) {
    console.error('Error generating AI copy:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate copy' },
      { status: 500 }
    );
  }
}
