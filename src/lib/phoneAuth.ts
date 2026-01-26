export function normalizePhoneDigits(input: string) {
  return input.replace(/\D/g, "");
}

export function phoneToEmail(phoneDigits: string) {
  const digits = normalizePhoneDigits(phoneDigits);
  if (!digits) return "";
  return `${digits}@fitcoach.com`;
}
