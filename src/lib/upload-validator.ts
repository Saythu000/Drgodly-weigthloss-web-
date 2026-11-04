export const ALLOWED_DOC_TYPES = [
  "Medical Registration Certificate",
  "MBBS Certificate",
  "Postgraduate Degree Certificate",
  "Fellowship Certificate",
  "Additional Qualification",
  "Identity Document",
  "Other"
];

export const ALLOWED_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg"];

export function detectMimeType(buffer: Buffer): { mime: string; ext: string } | null {
  if (buffer.length < 4) return null;
  const hex = buffer.toString("hex", 0, 4);

  // PDF: %PDF
  if (buffer.toString("utf8", 0, 4) === "%PDF") {
    return { mime: "application/pdf", ext: "pdf" };
  }
  // PNG: 89 50 4E 47
  if (hex === "89504e47") {
    return { mime: "image/png", ext: "png" };
  }
  // JPEG: FF D8 FF
  if (hex.startsWith("ffd8")) {
    return { mime: "image/jpeg", ext: "jpg" };
  }
  return null;
}
