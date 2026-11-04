import { ATTACHMENT } from "./ticket-config.js";

export function clean(value, maxLength) {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .trim()
    .slice(0, maxLength);
}

export function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch (e) {
      return null;
    }
  }
  return null;
}

export function readAttachment(attachment) {
  if (!attachment || typeof attachment !== "object") return null;
  if (!Object.hasOwn(ATTACHMENT.types, attachment.type)) return null;
  if (typeof attachment.data !== "string" || !attachment.data) return null;

  const typeInfo = ATTACHMENT.types[attachment.type];
  const buffer = Buffer.from(attachment.data, "base64");
  if (buffer.length === 0 || buffer.length > ATTACHMENT.maxBytes) return null;

  const matchesSignature = typeInfo.signature.every((byte, i) => buffer[i] === byte);
  if (!matchesSignature) return null;

  return {
    buffer,
    mimeType: attachment.type,
    filename: `attachment-${Date.now()}.${typeInfo.extension}`
  };
}