const MYANMAR_DIGITS = {
  "၀": "0",
  "၁": "1",
  "၂": "2",
  "၃": "3",
  "၄": "4",
  "၅": "5",
  "၆": "6",
  "၇": "7",
  "၈": "8",
  "၉": "9",
};

export function normalizeMyanmarDigits(value = "") {
  return String(value).replace(/[၀-၉]/g, digit => MYANMAR_DIGITS[digit] ?? digit);
}

export function normalizeMyanmarPhone(value = "") {
  const compact = normalizeMyanmarDigits(value).replace(/[\s\-()]/g, "");
  if (/^\+?959\d{7,9}$/.test(compact)) return `0${compact.replace(/^\+?95/, "")}`;
  if (/^09\d{7,9}$/.test(compact)) return compact;
  return null;
}

export function extractMyanmarPhones(content = "") {
  const normalized = normalizeMyanmarDigits(content);
  const candidates = normalized.match(/(?:\+?959\d{7,9}|09\d{7,9})/g) ?? [];
  return [...new Set(candidates.map(normalizeMyanmarPhone).filter(Boolean))];
}

export function hasPhoneChanged(previous, current) {
  return Boolean(current && previous && previous !== current);
}
