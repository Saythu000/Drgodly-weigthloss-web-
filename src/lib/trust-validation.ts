import { z } from "zod";

export const TrustContentSchema = z.object({
  type: z.enum(["testimonial", "stat"]),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  metadata: z.record(z.string(), z.any()).default({}),
  isActive: z.boolean().default(true),
});

export type TrustContentInput = z.infer<typeof TrustContentSchema>;
