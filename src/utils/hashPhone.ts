import crypto from "crypto";

export const normalizePhone = (
  phone: string
) => {
  return phone
    .replace(/\s/g, "")
    .replace(/-/g, "")
    .replace(/\(/g, "")
    .replace(/\)/g, "")
    .trim();
};

export const hashPhone = (
  phone: string
) => {
  return crypto
    .createHash("sha256")
    .update(
      normalizePhone(phone)
    )
    .digest("hex");
};

export const hashPhoneOptional = (
  phone?: string
) => {
  if (!phone?.trim()) {
    return undefined;
  }

  return hashPhone(phone);
};
