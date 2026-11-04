export type TrustContentType = "testimonial" | "stat";

export interface TrustContent {
  id: string;
  type: TrustContentType;
  title: string;
  description: string;
  metadata?: {
    author?: string;
    value?: string;
    metric?: string;
    loss?: string;
    rating?: number;
  };
}

export const CURATED_TRUST_CONTENT: TrustContent[] = [
  {
    id: "stat-1",
    type: "stat",
    title: "Weight Loss Success",
    description: "Average body weight loss in clinical trials for our primary program.",
    metadata: {
      value: "15.2%",
      metric: "Reduction"
    }
  },
  {
    id: "stat-2",
    type: "stat",
    title: "User Satisfaction",
    description: "Our members report high satisfaction with our medical support and coaching.",
    metadata: {
      value: "94%",
      metric: "Success Rate"
    }
  },
  {
    id: "testimonial-1",
    type: "testimonial",
    title: "Incredible Results",
    description: "The intake process was so easy. I felt like the recommendation actually understood my lifestyle.",
    metadata: {
      author: "Aarav S.",
      loss: "22kg lost",
      rating: 5
    }
  },
  {
    id: "testimonial-2",
    type: "testimonial",
    title: "Professional Support",
    description: "Finally a plan that didn't feel like a generic diet. The medical support makes all the difference.",
    metadata: {
      author: "Priya N.",
      loss: "15kg lost",
      rating: 5
    }
  },
  {
    id: "testimonial-3",
    type: "testimonial",
    title: "Life Changing",
    description: "Lost 10kg in 3 months and I've never felt better. The once-weekly injection is so convenient.",
    metadata: {
      author: "Rohan P.",
      loss: "10kg lost",
      rating: 5
    }
  },
  {
    id: "testimonial-4",
    type: "testimonial",
    title: "Clear Plan",
    description: "Seeing my goal broken into a weekly range made the plan feel realistic and easier to follow.",
    metadata: {
      author: "Meera T.",
      loss: "8kg lost",
      rating: 5
    }
  },
  {
    id: "testimonial-5",
    type: "testimonial",
    title: "Simple Intake",
    description: "The questions were straightforward, and the recommendation helped me understand which option fit my priorities.",
    metadata: {
      author: "Arjun V.",
      loss: "12kg lost",
      rating: 5
    }
  }
];

/** @deprecated Use database-driven content via /api/trust */
export const FALLBACK_TRUST_CONTENT = CURATED_TRUST_CONTENT;
