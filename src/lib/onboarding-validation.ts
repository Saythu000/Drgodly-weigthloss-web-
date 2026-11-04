import { z } from "zod";

// 1. Structured Error Response types
export interface StructuredValidationError {
  field: string;
  code: string;
  message: string;
}

export function formatZodError(error: z.ZodError): StructuredValidationError[] {
  return error.issues.map(issue => {
    const field = issue.path.join(".");
    return {
      field,
      code: issue.code,
      message: issue.message
    };
  });
}

// 2. Base primitive schemas matching field specifications
export const NameSchema = z.string()
  .trim()
  .min(1, "Name cannot be empty.")
  .max(100, "Name exceeds maximum length of 100 characters.");

export const EmailSchema = z.string()
  .trim()
  .email("Enter a valid email address.")
  .transform(val => val.toLowerCase());

// E.164 phone number format (e.g. +919876543210, +15551234567)
export const PhoneSchema = z.string()
  .trim()
  .regex(/^\+[1-9]\d{1,14}$/, "Enter a valid international phone number in E.164 format (e.g., +919876543210).");

export const BirthDateSchema = z.union([z.date(), z.string()])
  .refine(val => {
    const d = new Date(val);
    return !isNaN(d.getTime());
  }, "Enter a valid date of birth.")
  .refine(val => {
    const d = new Date(val);
    return d <= new Date();
  }, "Birth date cannot be in the future.");

// 3. Schema 1: DoctorIdentitySchema
export const DoctorIdentitySchema = z.object({
  title: z.string().trim().min(1, "Title is required."),
  firstName: NameSchema,
  middleName: z.string().trim().optional().nullable(),
  lastName: NameSchema,
  displayName: z.string().trim().min(1, "Display name is required.").max(200, "Display name exceeds 200 characters."),
  gender: z.string().trim().min(1, "Gender is required."),
  birthDate: BirthDateSchema,
});

// 4. Schema 2: DoctorContactSchema
export const DoctorContactSchema = z.object({
  email: EmailSchema,
  phone: PhoneSchema,
  alternatePhone: PhoneSchema.optional().nullable().or(z.literal("")),
  preferredContactMethod: z.enum(["email", "phone", "sms"]),
});

// 5. Schema 3: DoctorIdentifierSchema
export const DoctorIdentifierSchema = z.object({
  system: z.string().trim().url("Enter a valid identifier system URL."),
  value: z.string()
    .trim()
    .min(1, "Identifier value is required.")
    .transform(val => val.replace(/\s+/g, " ")),
  type: z.string().trim().min(1, "Identifier type is required."),
  use: z.string().trim().optional().nullable(),
  issuer: z.string().trim().optional().nullable(),
  periodStart: z.union([z.date(), z.string()]).optional().nullable(),
  periodEnd: z.union([z.date(), z.string()]).optional().nullable(),
});

// 6. Schema 4: DoctorRegistrationSchema
export const DoctorRegistrationSchema = z.object({
  registrationNumber: z.string()
    .trim()
    .min(1, "Registration number is required.")
    .transform(val => val.replace(/\s+/g, " ")),
  licensingCouncil: z.string().trim().min(1, "Licensing council is required."),
  state: z.string().trim().optional().nullable(),
  country: z.string().trim().min(1, "Country is required."),
  expiryDate: z.union([z.date(), z.string()])
    .refine(val => !isNaN(Date.parse(val.toString())), "Enter a valid expiry date.")
    .optional()
    .nullable(),
});

// 7. Schema 5: DoctorQualificationSchema
export const DoctorQualificationSchema = z.object({
  qualificationType: z.enum(["UG", "PG", "SuperSpecialty", "Diploma", "Fellowship"]),
  degreeName: z.string().trim().min(1, "Degree name is required."),
  specialization: z.string().trim().optional().nullable(),
  institution: z.string().trim().min(1, "Institution is required."),
  issuingOrganization: z.string().trim().min(1, "Issuing organization is required."),
  country: z.string().trim().min(2, "Country is required."),
  completionDate: z.union([z.date(), z.string()])
    .refine(val => !isNaN(Date.parse(val.toString())), "Enter a valid completion date."),
  certificateNumber: z.string().trim().min(1, "Certificate number is required."),
  documentReferenceId: z.string().trim().optional().nullable(),
});

// 8. Schema 6: DoctorSpecialtySchema
export const DoctorSpecialtySchema = z.object({
  specialtyCode: z.string().trim().min(1, "Specialty code is required."),
  specialtySystem: z.string().trim().url("Enter a valid specialty system URL."),
  specialtyDisplay: z.string().trim().min(1, "Specialty display name is required."),
  isPrimary: z.boolean().default(false),
});

// 9. Schema 10: DoctorServiceSchema
export const DoctorServiceSchema = z.object({
  serviceCode: z.string().trim().min(1, "Service code is required."),
  serviceName: z.string().trim().min(1, "Service name is required."),
  consultationMode: z.enum(["video", "audio", "chat", "offline"]),
  duration: z.number().int().positive("Duration must be a positive number of minutes."),
  fee: z.number()
    .min(0, "Fee must be a non-negative number.")
    .refine(val => Number(val.toFixed(2)) === val, "Fee exceeds maximum allowed currency decimal precision."),
  currency: z.string()
    .trim()
    .length(3, "Currency must be a 3-letter ISO code.")
    .regex(/^[A-Z]{3}$/, "Currency code must contain only uppercase letters."),
  active: z.boolean().default(true),
});

// 10. Schema 12: DoctorAvailabilitySchema
export const DoctorAvailabilitySchema = z.object({
  dayOfWeek: z.enum(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]),
  availableFrom: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Start time must be in HH:MM format."),
  availableTo: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "End time must be in HH:MM format."),
  timezone: z.string()
    .trim()
    .min(1, "Timezone is required.")
    .refine(tz => {
      try {
        Intl.DateTimeFormat(undefined, { timeZone: tz });
        return true;
      } catch (e) {
        return false;
      }
    }, "Enter a valid IANA timezone (e.g. Asia/Kolkata)."),
  appointmentDurationMinutes: z.number().int().positive("Appointment duration must be positive."),
  bufferMinutes: z.number().int().nonnegative("Buffer minutes must be a non-negative number."),
}).refine(data => {
  const [startH, startM] = data.availableFrom.split(":").map(Number);
  const [endH, endM] = data.availableTo.split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  return endMinutes > startMinutes;
}, {
  message: "End time must be strictly after start time.",
  path: ["availableTo"]
});

// 11. Schema 7: DoctorOrganizationRoleSchema
export const DoctorOrganizationRoleSchema = z.object({
  organizationId: z.string().trim().min(1, "Organization ID is required."),
  locations: z.array(z.string().trim().min(1)).min(1, "At least one location must be assigned to the role."),
  designation: z.string().trim().min(1, "Designation is required."),
  department: z.string().trim().optional().nullable(),
  roleCode: z.string().trim().default("doctor"),
  roleDisplay: z.string().trim().default("Physician"),
  services: z.array(DoctorServiceSchema).min(1, "Assign at least one clinical service to the role."),
  availabilities: z.array(DoctorAvailabilitySchema).min(1, "Assign at least one availability slot to the role."),
});

// 12. Schema 8: DoctorLocationSchema
export const DoctorLocationSchema = z.object({
  id: z.string().trim().min(1, "Location ID is required."),
  name: z.string().trim().min(1, "Location name is required."),
  address: z.string().trim().min(1, "Address is required."),
  city: z.string().trim().min(1, "City is required."),
  state: z.string().trim().min(1, "State is required."),
  postalCode: z.string().trim().min(1, "Postal code is required."),
  country: z.string().trim().min(1, "Country is required."),
});

// 13. Schema 9: DoctorLanguageSchema
export const DoctorLanguageSchema = z.object({
  languageCode: z.string().trim().min(2, "Language code must be at least 2 characters."),
  languageName: z.string().trim().min(1, "Language name is required."),
  proficiency: z.enum(["native", "fluent", "intermediate", "basic"]),
  preferredForConsultation: z.boolean().default(false),
});

// 14. Schema 11: DoctorPricingSchema
export const DoctorPricingSchema = z.object({
  fee: z.number()
    .min(0, "Fee must be non-negative.")
    .refine(val => Number(val.toFixed(2)) === val, "Fee exceeds maximum allowed currency decimal precision."),
  currency: z.string()
    .trim()
    .length(3, "Currency must be a 3-letter ISO code.")
    .regex(/^[A-Z]{3}$/, "Currency code must contain only uppercase letters."),
});

// 15. Schema 13: DoctorProfessionalProfileSchema
export const DoctorProfessionalProfileSchema = z.object({
  professionalBio: z.string().trim().min(10, "Bio must be at least 10 characters."),
  yearsOfExperience: z.number().int().nonnegative("Years of experience must be non-negative."),
});

// 16. Schema 14: DoctorVerificationDocumentSchema
export const DoctorVerificationDocumentSchema = z.object({
  title: z.string().trim().min(1, "Document title is required."),
  url: z.string().trim().url("Valid document URL is required."),
  docType: z.enum(["license", "qualification", "identity"]),
  fileName: z.string().trim().optional().nullable(),
  mimeType: z.string().trim().optional().nullable(),
  fileSize: z.number().positive("File size must be positive.").optional().nullable(),
});

// 17. Schema 15: DoctorConsentSchema
export const DoctorConsentSchema = z.object({
  platformTermsAccepted: z.boolean().refine(val => val === true, "Platform terms must be accepted."),
  privacyPolicyAccepted: z.boolean().refine(val => val === true, "Privacy policy must be accepted."),
  telemedicineTermsAccepted: z.boolean().refine(val => val === true, "Telemedicine terms must be accepted."),
  aiAssistanceAcknowledgement: z.boolean().refine(val => val === true, "AI assistance terms must be accepted."),
  clinicalResponsibilityAcknowledgement: z.boolean().refine(val => val === true, "Clinical responsibility must be accepted."),
});

// 18. Schema 16: DoctorOnboardingSchema (Highly permissive for drafts)
export const DoctorOnboardingSchema = z.object({
  title: z.string().optional().nullable(),
  firstName: z.string().optional().nullable(),
  middleName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  displayName: z.string().optional().nullable(),
  email: z.string().email("Invalid email format").optional().or(z.literal("")).or(z.null()),
  phone: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  birthDate: z.string().optional().nullable(),
  preferredContactMethod: z.string().optional().nullable(),
  professionalBio: z.string().optional().nullable(),
  yearsOfExperience: z.number().optional().nullable(),
  languages: z.array(DoctorLanguageSchema).default([]),
  identifiers: z.array(DoctorIdentifierSchema).default([]),
  qualifications: z.array(DoctorQualificationSchema).default([]),
  specialties: z.array(DoctorSpecialtySchema).default([]),
  roles: z.array(
    z.object({
      organizationId: z.string().optional().nullable(),
      locations: z.array(z.string()).default([]),
      designation: z.string().optional().nullable(),
      department: z.string().optional().nullable(),
      services: z.array(DoctorServiceSchema).default([]),
      availabilities: z.array(DoctorAvailabilitySchema).default([]),
    })
  ).default([]),
  documents: z.array(DoctorVerificationDocumentSchema).default([]),
  consent: DoctorConsentSchema.partial().optional().nullable(),
});

// 19. Schema 17: DoctorOnboardingSubmitSchema (Strict application validation)
export const DoctorOnboardingSubmitSchema = z.object({
  // Identity
  title: z.string().trim().min(1, "Title is required."),
  firstName: NameSchema,
  middleName: z.string().trim().optional().nullable(),
  lastName: NameSchema,
  displayName: z.string().trim().min(1, "Display name is required.").max(200, "Display name is too long."),
  gender: z.string().trim().min(1, "Gender is required."),
  birthDate: BirthDateSchema,

  // Contact
  email: EmailSchema,
  phone: PhoneSchema,
  alternatePhone: PhoneSchema.optional().nullable().or(z.literal("")),
  preferredContactMethod: z.enum(["email", "phone", "sms"]),

  // Professional Profile
  professionalBio: z.string().trim().min(10, "Bio must be at least 10 characters."),
  yearsOfExperience: z.number().int().nonnegative("Years of experience must be non-negative."),

  // Repeatables
  languages: z.array(DoctorLanguageSchema).min(1, "At least one language is required."),
  identifiers: z.array(DoctorIdentifierSchema)
    .min(1, "At least one registration identifier is required.")
    .refine(identifiers => {
      // Prevent duplicate system + value identifiers
      const seen = new Set<string>();
      for (const ident of identifiers) {
        const key = `${ident.system.toLowerCase()}|${ident.value.toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
      }
      return true;
    }, {
      message: "Identifiers must contain unique system and value combinations.",
      path: []
    }),
  qualifications: z.array(DoctorQualificationSchema).min(1, "At least one medical qualification is required."),
  specialties: z.array(DoctorSpecialtySchema)
    .min(1, "At least one medical specialty is required.")
    .refine(specialties => {
      // Exactly one specialty must be primary
      const primaryCount = specialties.filter(s => s.isPrimary).length;
      return primaryCount === 1;
    }, {
      message: "Exactly one specialty must be marked as primary.",
      path: []
    }),
  roles: z.array(DoctorOrganizationRoleSchema).min(1, "At least one professional practice role is required."),
  documents: z.array(DoctorVerificationDocumentSchema).min(1, "At least one verification document must be uploaded."),
  consent: DoctorConsentSchema,
});

// Admin review / verification schema
export const VerificationSchema = z.object({
  status: z.enum(["approved", "rejected", "changes_requested", "suspended"]),
  rejectionReason: z.string().optional(),
}).refine(data => {
  if ((data.status === "rejected" || data.status === "changes_requested") && (!data.rejectionReason || data.rejectionReason.trim().length === 0)) {
    return false;
  }
  return true;
}, {
  message: "Reason is required when rejecting or requesting changes.",
  path: ["rejectionReason"]
});

// Backward compatibility schema aliases
export const DraftOnboardingSchema = DoctorOnboardingSchema;
export const SubmitOnboardingSchema = DoctorOnboardingSubmitSchema;

// Types
export type DraftOnboardingInput = z.infer<typeof DraftOnboardingSchema>;
export type SubmitOnboardingInput = z.infer<typeof SubmitOnboardingSchema>;
export type VerificationInput = z.infer<typeof VerificationSchema>;
