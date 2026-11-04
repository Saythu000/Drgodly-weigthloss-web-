export type EventItem = {
  slug: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  image?: string;
};

export const eventItems: EventItem[] = [
  {
    slug: "artificial-intelligence-for-doctors",
    title: "Artificial Intelligence for Doctors",
    date: "Every Thursday",
    time: "7:00 PM IST",
    location: "Online Masterclass",
    description:
      "A weekly interactive session exploring the clinical applications of AI in medicine, workflow optimization, EHR integration, and decision-support copilots.",
    image: "/ai_for_doctors.jpg",
  },
  {
    slug: "live-qa-starting-glp1-treatment",
    title: "Live Q&A: Starting GLP-1 treatment",
    date: "August 10, 2026",
    time: "7:00 PM IST",
    location: "Online",
    description:
      "A short live session covering how the intake works, what to expect after qualification, and how follow-up is handled.",
  },
  {
    slug: "doctor-led-nutrition-workshop",
    title: "Doctor-led nutrition workshop",
    date: "August 24, 2026",
    time: "6:30 PM IST",
    location: "Online",
    description:
      "Practical meal planning guidance for users who want a simple routine that fits a weight-loss plan.",
  },
  {
    slug: "progress-check-in-clinic",
    title: "Progress check-in clinic",
    date: "September 3, 2026",
    time: "8:00 PM IST",
    location: "Online",
    description:
      "A community check-in focused on adherence, side effects, and how to know when to speak with the care team.",
  },
];
