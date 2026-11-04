export interface FHIRPractitioner {
  resourceType: "Practitioner";
  id: string;
  active: boolean;
  identifier?: Array<{
    use?: string;
    type?: {
      text: string;
    };
    system: string;
    value: string;
    period?: {
      start?: string;
      end?: string;
    };
    assigner?: {
      display: string;
    };
  }>;
  name?: Array<{
    use: string;
    prefix?: string[];
    family: string;
    given: string[];
    text?: string;
  }>;
  telecom?: Array<{
    system: string;
    value: string;
    use: string;
  }>;
  gender?: "male" | "female" | "other" | "unknown";
  birthDate?: string;
  photo?: Array<{
    url: string;
  }>;
  communication?: Array<{
    language: {
      coding?: Array<{
        system: string;
        code: string;
        display: string;
      }>;
      text: string;
    };
  }>;
  qualification?: Array<{
    code: {
      text: string;
    };
    issuer?: {
      display: string;
    };
    period?: {
      end?: string;
    };
  }>;
}

export interface FHIROrganization {
  resourceType: "Organization";
  id: string;
  active: boolean;
  name: string;
  identifier?: Array<{
    value: string;
  }>;
}

export interface FHIRLocation {
  resourceType: "Location";
  id: string;
  status: "active" | "inactive";
  name: string;
  description?: string;
  mode?: "instance" | "kind";
  address?: {
    text?: string;
    line?: string[];
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  managingOrganization?: {
    reference: string;
  };
}

export interface FHIRHealthcareService {
  resourceType: "HealthcareService";
  id: string;
  active: boolean;
  name: string;
  type?: Array<{
    text: string;
  }>;
}

export interface FHIRPractitionerRole {
  resourceType: "PractitionerRole";
  id: string;
  active: boolean;
  practitioner?: {
    reference: string;
  };
  organization?: {
    reference: string;
  };
  location?: Array<{
    reference: string;
  }>;
  healthcareService?: Array<{
    reference: string;
  }>;
  specialty?: Array<{
    coding?: Array<{
      system: string;
      code: string;
      display: string;
    }>;
    text: string;
  }>;
  availableTime?: Array<{
    daysOfWeek?: Array<"mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun">;
    availableStartTime?: string;
    availableEndTime?: string;
  }>;
}

export interface FHIRDocumentReference {
  resourceType: "DocumentReference";
  id: string;
  status: "current" | "superseded" | "entered-in-error";
  type?: {
    text: string;
  };
  subject?: {
    reference: string;
  };
  content: Array<{
    attachment: {
      url: string;
      title: string;
      contentType?: string;
      size?: number;
    };
  }>;
}

export interface FHIRBundle {
  resourceType: "Bundle";
  type: "transaction";
  entry: Array<{
    fullUrl: string;
    resource: any;
    request: {
      method: "PUT" | "POST";
      url: string;
    };
  }>;
}

// Utility to recursively clean out undefined/null properties from output
export function cleanFHIR<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (key, value) => {
      if (value === null || value === undefined) {
        return undefined;
      }
      return value;
    })
  ) as T;
}

// FHIR R4 Validation Layer
export function validateFHIRResource(resource: any): void {
  if (!resource || typeof resource !== "object") {
    throw new Error("FHIR validation error: Resource is not an object.");
  }
  
  if (!resource.resourceType) {
    throw new Error("FHIR validation error: Missing 'resourceType'.");
  }

  // Validate ID format (Bundle does not require id)
  if (resource.resourceType !== "Bundle") {
    if (!resource.id || typeof resource.id !== "string") {
      throw new Error(`FHIR validation error: Resource '${resource.resourceType}' must have a string 'id'.`);
    }
    if (!/^[A-Za-z0-9\-\.\_]+$/.test(resource.id)) {
      throw new Error(`FHIR validation error: Resource ID '${resource.id}' is invalid.`);
    }
  }

  const validateReference = (refObj: any, fieldName: string) => {
    if (refObj) {
      if (!refObj.reference || typeof refObj.reference !== "string") {
        throw new Error(`FHIR validation error: Reference object in field '${fieldName}' must have a string 'reference'.`);
      }
      if (!/^[A-Za-z]+\/[A-Za-z0-9\-\.\_]+$/.test(refObj.reference)) {
        throw new Error(`FHIR validation error: Reference string '${refObj.reference}' in field '${fieldName}' is invalid.`);
      }
    }
  };

  switch (resource.resourceType) {
    case "Practitioner":
      if (typeof resource.active !== "boolean") {
        throw new Error("FHIR validation error: Practitioner 'active' must be a boolean.");
      }
      if (resource.gender && !["male", "female", "other", "unknown"].includes(resource.gender)) {
        throw new Error(`FHIR validation error: Invalid Practitioner gender: '${resource.gender}'`);
      }
      if (resource.birthDate) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(resource.birthDate)) {
          throw new Error(`FHIR validation error: Invalid Practitioner birthDate: '${resource.birthDate}'`);
        }
      }
      if (resource.name) {
        if (!Array.isArray(resource.name)) {
          throw new Error("FHIR validation error: Practitioner 'name' must be an array.");
        }
        resource.name.forEach((n: any) => {
          if (!n.use || typeof n.use !== "string") {
            throw new Error("FHIR validation error: Practitioner name must have 'use' field.");
          }
          if (n.prefix && !Array.isArray(n.prefix)) {
            throw new Error("FHIR validation error: Practitioner name prefix must be an array.");
          }
          if (n.given && !Array.isArray(n.given)) {
            throw new Error("FHIR validation error: Practitioner name given must be an array.");
          }
          if (typeof n.family !== "string") {
            throw new Error("FHIR validation error: Practitioner name family must be a string.");
          }
        });
      }
      if (resource.telecom) {
        if (!Array.isArray(resource.telecom)) {
          throw new Error("FHIR validation error: Practitioner 'telecom' must be an array.");
        }
        resource.telecom.forEach((tel: any) => {
          if (!tel.system || !tel.value || !tel.use) {
            throw new Error("FHIR validation error: Telecom entries must have system, value, and use.");
          }
          if (!["phone", "fax", "email", "pager", "url", "sms", "other"].includes(tel.system)) {
            throw new Error(`FHIR validation error: Telecom system must be one of: phone, fax, email, pager, url, sms, other. Got '${tel.system}'`);
          }
        });
      }
      if (resource.identifier) {
        if (!Array.isArray(resource.identifier)) {
          throw new Error("FHIR validation error: Practitioner 'identifier' must be an array.");
        }
        resource.identifier.forEach((ident: any) => {
          if (!ident.system || !ident.value) {
            throw new Error("FHIR validation error: Identifier entries must have system and value.");
          }
          if (!/^(http|https|urn):/.test(ident.system)) {
            throw new Error(`FHIR validation error: Identifier system must start with http, https, or urn. Got '${ident.system}'`);
          }
        });
      }
      if (resource.communication && !Array.isArray(resource.communication)) {
        throw new Error("FHIR validation error: Practitioner 'communication' must be an array.");
      }
      if (resource.qualification && !Array.isArray(resource.qualification)) {
        throw new Error("FHIR validation error: Practitioner 'qualification' must be an array.");
      }
      break;

    case "PractitionerRole":
      if (typeof resource.active !== "boolean") {
        throw new Error("FHIR validation error: PractitionerRole 'active' must be a boolean.");
      }
      if (!resource.practitioner) {
        throw new Error("FHIR validation error: PractitionerRole must have a practitioner reference.");
      }
      validateReference(resource.practitioner, "practitioner");
      if (!resource.organization) {
        throw new Error("FHIR validation error: PractitionerRole must have an organization reference.");
      }
      validateReference(resource.organization, "organization");
      if (resource.location) {
        if (!Array.isArray(resource.location)) {
          throw new Error("FHIR validation error: PractitionerRole 'location' must be an array.");
        }
        resource.location.forEach((loc: any) => validateReference(loc, "location"));
      }
      if (resource.healthcareService) {
        if (!Array.isArray(resource.healthcareService)) {
          throw new Error("FHIR validation error: PractitionerRole 'healthcareService' must be an array.");
        }
        resource.healthcareService.forEach((srv: any) => validateReference(srv, "healthcareService"));
      }
      break;

    case "Organization":
      if (typeof resource.active !== "boolean") {
        throw new Error("FHIR validation error: Organization 'active' must be a boolean.");
      }
      if (!resource.name || typeof resource.name !== "string") {
        throw new Error("FHIR validation error: Organization must have a string 'name'.");
      }
      break;

    case "Location":
      if (!["active", "inactive"].includes(resource.status)) {
        throw new Error(`FHIR validation error: Invalid Location status: '${resource.status}'`);
      }
      if (!resource.name || typeof resource.name !== "string") {
        throw new Error("FHIR validation error: Location must have a string 'name'.");
      }
      if (resource.managingOrganization) {
        validateReference(resource.managingOrganization, "managingOrganization");
      }
      break;

    case "HealthcareService":
      if (typeof resource.active !== "boolean") {
        throw new Error("FHIR validation error: HealthcareService 'active' must be a boolean.");
      }
      if (!resource.name || typeof resource.name !== "string") {
        throw new Error("FHIR validation error: HealthcareService must have a string 'name'.");
      }
      break;

    case "DocumentReference":
      if (!["current", "superseded", "entered-in-error"].includes(resource.status)) {
        throw new Error(`FHIR validation error: Invalid DocumentReference status: '${resource.status}'`);
      }
      if (resource.subject) {
        validateReference(resource.subject, "subject");
      }
      if (!resource.content || !Array.isArray(resource.content) || resource.content.length === 0) {
        throw new Error("FHIR validation error: DocumentReference must have non-empty 'content' array.");
      }
      resource.content.forEach((c: any) => {
        if (!c.attachment || !c.attachment.url || !c.attachment.title) {
          throw new Error("FHIR validation error: DocumentReference content attachment must have 'url' and 'title'.");
        }
      });
      break;

    case "Bundle":
      if (resource.type !== "transaction") {
        throw new Error(`FHIR validation error: Bundle type must be 'transaction', got '${resource.type}'`);
      }
      if (resource.entry) {
        if (!Array.isArray(resource.entry)) {
          throw new Error("FHIR validation error: Bundle entry must be an array.");
        }
        resource.entry.forEach((e: any) => {
          if (!e.fullUrl || typeof e.fullUrl !== "string") {
            throw new Error("FHIR validation error: Bundle entry must have string 'fullUrl'.");
          }
          if (!e.request || !["PUT", "POST"].includes(e.request.method) || !e.request.url) {
            throw new Error("FHIR validation error: Bundle entry request must have method (PUT/POST) and url.");
          }
          if (!e.resource) {
            throw new Error("FHIR validation error: Bundle entry must have 'resource'.");
          }
          // Validate the inner resource
          validateFHIRResource(e.resource);
        });
      }
      break;

    default:
      throw new Error(`FHIR validation error: Unsupported resourceType '${resource.resourceType}'.`);
  }
}

export function mapToFHIRPractitioner(dbPractitioner: any): FHIRPractitioner {
  const fhirGender = ["male", "female", "other", "unknown"].includes(dbPractitioner.gender?.toLowerCase())
    ? (dbPractitioner.gender.toLowerCase() as FHIRPractitioner["gender"])
    : "unknown";

  let formattedBirthDate: string | undefined = undefined;
  if (dbPractitioner.birthDate) {
    const d = new Date(dbPractitioner.birthDate);
    if (!isNaN(d.getTime()) && d.getTime() !== 0) {
      formattedBirthDate = d.toISOString().split("T")[0];
    }
  }

  const p: FHIRPractitioner = {
    resourceType: "Practitioner",
    id: dbPractitioner.id,
    active: dbPractitioner.status === "VERIFIED" || dbPractitioner.status === "SUBMITTED",
    name: [
      {
        use: "official",
        prefix: dbPractitioner.title ? [dbPractitioner.title] : ["Dr."],
        family: dbPractitioner.lastName || "",
        given: [dbPractitioner.firstName || ""].concat(dbPractitioner.middleName ? [dbPractitioner.middleName] : []),
        text: dbPractitioner.displayName || undefined,
      },
    ],
    telecom: [
      ...(dbPractitioner.email
        ? [{ system: "email", value: dbPractitioner.email.toLowerCase(), use: "work" }]
        : []),
      ...(dbPractitioner.phone
        ? [{ system: "phone", value: dbPractitioner.phone, use: "mobile" }]
        : []),
    ],
    photo: dbPractitioner.profilePhoto ? [{ url: dbPractitioner.profilePhoto }] : undefined,
    gender: fhirGender,
    birthDate: formattedBirthDate,
    communication: (dbPractitioner.languages || []).map((lang: any) => ({
      language: {
        coding: [{
          system: "urn:ietf:bcp:47",
          code: lang.languageCode,
          display: lang.languageName
        }],
        text: lang.languageName,
      },
    })),
    identifier: (dbPractitioner.identifiers || []).map((ident: any) => ({
      use: ident.use || "official",
      type: ident.type ? { text: ident.type } : undefined,
      system: ident.system || "https://drgodly.com/fhir/sid/identifiers",
      value: ident.value,
      period: ident.periodStart || ident.periodEnd ? {
        start: ident.periodStart ? new Date(ident.periodStart).toISOString().split("T")[0] : undefined,
        end: ident.periodEnd ? new Date(ident.periodEnd).toISOString().split("T")[0] : undefined,
      } : undefined,
      assigner: ident.issuer ? { display: ident.issuer } : undefined,
    })),
    qualification: (dbPractitioner.qualifications || []).map((qual: any) => ({
      code: { text: qual.degreeName },
      issuer: { display: qual.institution },
      period: qual.completionDate ? {
        end: new Date(qual.completionDate).toISOString().split("T")[0],
      } : undefined,
    })),
  };

  const cleaned = cleanFHIR(p);
  validateFHIRResource(cleaned);
  return cleaned;
}

export function mapToFHIROrganization(dbOrg: any): FHIROrganization {
  const org: FHIROrganization = {
    resourceType: "Organization",
    id: dbOrg.id,
    active: dbOrg.active !== false,
    name: dbOrg.name,
  };

  const cleaned = cleanFHIR(org);
  validateFHIRResource(cleaned);
  return cleaned;
}

export function mapToFHIRLocation(dbLoc: any): FHIRLocation {
  const loc: FHIRLocation = {
    resourceType: "Location",
    id: dbLoc.id,
    status: dbLoc.active !== false ? "active" : "inactive",
    name: dbLoc.name,
    description: dbLoc.description || undefined,
    mode: "instance",
    address: {
      text: dbLoc.address || undefined,
      line: dbLoc.address ? [dbLoc.address] : undefined,
      city: dbLoc.city || undefined,
      state: dbLoc.state || undefined,
      postalCode: dbLoc.postalCode || undefined,
      country: dbLoc.country || undefined,
    },
    managingOrganization: dbLoc.managingOrganizationId ? {
      reference: `Organization/${dbLoc.managingOrganizationId}`
    } : undefined
  };

  const cleaned = cleanFHIR(loc);
  validateFHIRResource(cleaned);
  return cleaned;
}

export function mapToFHIRHealthcareService(dbService: any): FHIRHealthcareService {
  const srv: FHIRHealthcareService = {
    resourceType: "HealthcareService",
    id: dbService.id || dbService.serviceCode,
    active: dbService.active !== false,
    name: dbService.name || dbService.serviceName || "Consultation",
    type: [{ text: dbService.type || dbService.consultationMode || "telehealth" }],
  };

  const cleaned = cleanFHIR(srv);
  validateFHIRResource(cleaned);
  return cleaned;
}

export function mapToFHIRPractitionerRole(dbRole: any): FHIRPractitionerRole {
  const dayMap: Record<string, "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun"> = {
    MON: "mon",
    TUE: "tue",
    WED: "wed",
    THU: "thu",
    FRI: "fri",
    SAT: "sat",
    SUN: "sun",
  };

  const timeSlots: Record<string, Array<"mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun">> = {};
  
  (dbRole.availabilities || []).forEach((avail: any) => {
    const key = `${avail.availableFrom}-${avail.availableTo}`;
    const fhirDay = dayMap[avail.dayOfWeek.toUpperCase()];
    if (fhirDay) {
      if (!timeSlots[key]) {
        timeSlots[key] = [];
      }
      timeSlots[key].push(fhirDay);
    }
  });

  const availableTime = Object.entries(timeSlots).map(([times, days]) => {
    const [start, end] = times.split("-");
    return {
      daysOfWeek: days,
      availableStartTime: start.includes(":") ? start : `${start}:00`,
      availableEndTime: end.includes(":") ? end : `${end}:00`,
    };
  });

  const specialtyList = (dbRole.specialties || dbRole.practitioner?.specialties || []).map((spec: any) => {
    if (typeof spec === "string") {
      return { text: spec };
    }
    return {
      coding: [{
        system: spec.specialtySystem || "http://snomed.info/sct",
        code: spec.specialtyCode,
        display: spec.specialtyDisplay,
      }],
      text: spec.specialtyDisplay,
    };
  });

  const role: FHIRPractitionerRole = {
    resourceType: "PractitionerRole",
    id: dbRole.id,
    active: dbRole.active !== false,
    practitioner: {
      reference: `Practitioner/${dbRole.practitionerId}`,
    },
    organization: {
      reference: `Organization/${dbRole.organizationId}`,
    },
    location: (dbRole.locations || []).map((locLink: any) => ({
      reference: `Location/${locLink.locationId || locLink}`,
    })),
    healthcareService: (dbRole.services || []).map((service: any) => ({
      reference: `HealthcareService/${service.id || service.serviceCode}`,
    })),
    specialty: specialtyList.length > 0 ? specialtyList : undefined,
    availableTime: availableTime.length > 0 ? availableTime : undefined,
  };

  const cleaned = cleanFHIR(role);
  validateFHIRResource(cleaned);
  return cleaned;
}

export function mapToFHIRDocumentReference(dbDoc: any): FHIRDocumentReference {
  const fhirStatus = ["current", "superseded", "entered-in-error"].includes(dbDoc.status?.toLowerCase())
    ? (dbDoc.status.toLowerCase() as FHIRDocumentReference["status"])
    : "current";

  const doc: FHIRDocumentReference = {
    resourceType: "DocumentReference",
    id: dbDoc.id,
    status: fhirStatus,
    type: {
      text: dbDoc.docType,
    },
    subject: {
      reference: `Practitioner/${dbDoc.practitionerId}`,
    },
    content: [
      {
        attachment: {
          url: dbDoc.url,
          title: dbDoc.title,
          contentType: dbDoc.mimeType || undefined,
          size: dbDoc.fileSize || undefined,
        },
      },
    ],
  };

  const cleaned = cleanFHIR(doc);
  validateFHIRResource(cleaned);
  return cleaned;
}

export function mapToFHIRBundle(data: {
  practitioner: any;
  organizations?: any[];
  locations?: any[];
  services?: any[];
  roles?: any[];
  documents?: any[];
}): FHIRBundle {
  const entries: FHIRBundle["entry"] = [];

  const practitioner = mapToFHIRPractitioner(data.practitioner);
  entries.push({
    fullUrl: `https://www.drgodly.com/api/fhir/Practitioner/${practitioner.id}`,
    resource: practitioner,
    request: {
      method: "PUT",
      url: `Practitioner/${practitioner.id}`
    }
  });

  const orgs = data.organizations || [];
  orgs.forEach(o => {
    const org = mapToFHIROrganization(o);
    entries.push({
      fullUrl: `https://www.drgodly.com/api/fhir/Organization/${org.id}`,
      resource: org,
      request: {
        method: "PUT",
        url: `Organization/${org.id}`
      }
    });
  });

  const locs = data.locations || [];
  locs.forEach(l => {
    const loc = mapToFHIRLocation(l);
    entries.push({
      fullUrl: `https://www.drgodly.com/api/fhir/Location/${loc.id}`,
      resource: loc,
      request: {
        method: "PUT",
        url: `Location/${loc.id}`
      }
    });
  });

  const srvs = data.services || [];
  srvs.forEach(s => {
    const srv = mapToFHIRHealthcareService(s);
    entries.push({
      fullUrl: `https://www.drgodly.com/api/fhir/HealthcareService/${srv.id}`,
      resource: srv,
      request: {
        method: "PUT",
        url: `HealthcareService/${srv.id}`
      }
    });
  });

  const roles = data.roles || [];
  roles.forEach(r => {
    const role = mapToFHIRPractitionerRole(r);
    entries.push({
      fullUrl: `https://www.drgodly.com/api/fhir/PractitionerRole/${role.id}`,
      resource: role,
      request: {
        method: "PUT",
        url: `PractitionerRole/${role.id}`
      }
    });
  });

  const docs = data.documents || [];
  docs.forEach(d => {
    const doc = mapToFHIRDocumentReference(d);
    entries.push({
      fullUrl: `https://www.drgodly.com/api/fhir/DocumentReference/${doc.id}`,
      resource: doc,
      request: {
        method: "PUT",
        url: `DocumentReference/${doc.id}`
      }
    });
  });

  const bundle: FHIRBundle = {
    resourceType: "Bundle",
    type: "transaction",
    entry: entries
  };

  const cleaned = cleanFHIR(bundle);
  validateFHIRResource(cleaned);
  return cleaned;
}
