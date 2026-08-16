import fs from 'node:fs';
import path from 'node:path';

export interface DomainProfile {
  companyName: string;
  industryDomain: string;
  personaRole: string;
  primaryTopics: string[];
  safetyGuidelines: string[];
  inferredAt?: string;
}

const DEFAULT_PROFILE: DomainProfile = {
  companyName: 'DrGodly',
  industryDomain: 'Doctor-Guided GLP-1 Weight Loss Treatment & Healthcare',
  personaRole: 'DrGodly Clinical & Product Support Specialist',
  primaryTopics: ['Semaglutide', 'GLP-1 Weight Loss', 'Doctor Assessment', 'Prescription Evaluation', 'Cold-Chain Delivery'],
  safetyGuidelines: [
    'Prescriptions are mandatory and issued exclusively by licensed doctors.',
    'Require medical assessment before recommending specific GLP-1 medications.',
    'Express temperature-controlled cold-chain delivery (2°C to 8°C).',
    'Customer support is available at +91 9346317790 from Mon-Sat.',
  ],
};

const PROFILE_FILE_PATH = path.join(process.cwd(), '.openclaw-local', 'domain-profile.json');

export function getActiveDomainProfile(): DomainProfile {
  try {
    if (fs.existsSync(PROFILE_FILE_PATH)) {
      const data = fs.readFileSync(PROFILE_FILE_PATH, 'utf8');
      const parsed = JSON.parse(data);
      if (parsed && parsed.companyName) {
        return parsed;
      }
    }
  } catch (e) {
    // Fallback to default
  }
  return DEFAULT_PROFILE;
}

export function saveActiveDomainProfile(profile: DomainProfile): void {
  try {
    const dir = path.dirname(PROFILE_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(PROFILE_FILE_PATH, JSON.stringify(profile, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save domain profile locally:', e);
  }
}

export function resetDomainProfile(): DomainProfile {
  saveActiveDomainProfile(DEFAULT_PROFILE);
  return DEFAULT_PROFILE;
}

/**
 * Heuristic & Rule-Based Domain Analysis Engine
 * Extracts company name, domain, persona, topics, and safety rules from document content.
 */
export function analyzeDocumentSample(textSample: string): DomainProfile {
  if (!textSample || textSample.trim().length === 0) {
    return getActiveDomainProfile();
  }

  const sampleLower = textSample.toLowerCase();

  // 1. Infer Company Name
  let companyName = 'DrGodly';
  const companyMatch = textSample.match(/([A-Z][A-Za-z0-9]+(?:\s+[A-Z][A-Za-z0-9]+)?)\s+(?:Clinic|Services|Overview|Policy|Platform|Inc|Ltd|Healthcare|Bot|App|Store|Dealer)/);
  if (companyMatch && companyMatch[1]) {
    companyName = companyMatch[1].trim();
  } else if (sampleLower.includes('drgodly')) {
    companyName = 'DrGodly';
  }

  // 2. Infer Industry Domain & Persona Role
  let industryDomain = 'Doctor-Guided GLP-1 Weight Loss Treatment & Healthcare';
  let personaRole = `${companyName} Support Specialist`;
  const topics: string[] = [];
  const safety: string[] = [];

  if (sampleLower.includes('semaglutide') || sampleLower.includes('glp-1') || sampleLower.includes('weight loss') || sampleLower.includes('doctor')) {
    industryDomain = 'Doctor-Guided GLP-1 Weight Loss Treatment & Healthcare';
    personaRole = `${companyName} Clinical & Product Support Specialist`;
    topics.push('Semaglutide Treatments', 'GLP-1 Assessment', 'Doctor Consultation', 'Cold-Chain Delivery');
    safety.push('Prescriptions are required following medical screening.');
    safety.push('Maintain temperature-controlled shipping (2°C to 8°C).');
  } else if (sampleLower.includes('vehicle') || sampleLower.includes('car') || sampleLower.includes('warranty') || sampleLower.includes('powertrain')) {
    industryDomain = 'Automotive Sales, Warranty & Vehicle Services';
    personaRole = `${companyName} Customer Service Specialist`;
    topics.push('Vehicle Returns', 'Powertrain Warranty', 'Financing Options', 'Maintenance Perks');
    safety.push('Verify customer vehicle identification and warranty terms.');
  } else if (sampleLower.includes('travel') || sampleLower.includes('hotel') || sampleLower.includes('flight') || sampleLower.includes('booking')) {
    industryDomain = 'Hospitality, Travel & Concierge Services';
    personaRole = `${companyName} Travel & Concierge Specialist`;
    topics.push('Flight Bookings', 'Hotel Reservations', 'Itinerary Planning');
    safety.push('Confirm guest reservation details before processing changes.');
  } else if (sampleLower.includes('property') || sampleLower.includes('real estate') || sampleLower.includes('apartment') || sampleLower.includes('mortgage')) {
    industryDomain = 'Real Estate & Property Management';
    personaRole = `${companyName} Property Advisory Specialist`;
    topics.push('Property Listings', 'Mortgage Assistance', 'Site Visits');
  } else {
    industryDomain = 'Enterprise Product & Customer Support';
    personaRole = `${companyName} Customer Support Specialist`;
    topics.push('General Inquiries', 'Service Documentation');
  }

  // Extract phone numbers if available
  const phoneMatch = textSample.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  if (phoneMatch) {
    safety.push(`Official Helpline: ${phoneMatch[0]}`);
  }

  const newProfile: DomainProfile = {
    companyName,
    industryDomain,
    personaRole,
    primaryTopics: Array.from(new Set(topics)),
    safetyGuidelines: Array.from(new Set(safety)),
    inferredAt: new Date().toISOString(),
  };

  saveActiveDomainProfile(newProfile);
  return newProfile;
}
