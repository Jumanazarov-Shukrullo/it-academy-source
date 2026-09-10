export const UZ_PHONE_PREFIX = "+998 ";
export const UZ_PHONE_PLACEHOLDER = "+998 xx xxx-xx-xx";
export const UZ_PHONE_EXAMPLE = "+998 90 123-45-67";
export const UZ_PHONE_PATTERN = "\\+998\\s\\d{2}\\s\\d{3}-\\d{2}-\\d{2}";
export const UZ_PHONE_MAX_LENGTH = UZ_PHONE_EXAMPLE.length;

function localDigits(value) {
  const digits = String(value || "").replace(/\D/g, "");
  const withoutCountry = digits.startsWith("998") ? digits.slice(3) : digits;
  return withoutCountry.slice(0, 9);
}

export function formatUzPhone(value) {
  const digits = localDigits(value);
  const operator = digits.slice(0, 2);
  const middle = digits.slice(2, 5);
  const firstPair = digits.slice(5, 7);
  const secondPair = digits.slice(7, 9);

  let formatted = "+998";
  if (operator) formatted += ` ${operator}`;
  if (middle) formatted += ` ${middle}`;
  if (firstPair) formatted += `-${firstPair}`;
  if (secondPair) formatted += `-${secondPair}`;

  return formatted === "+998" ? UZ_PHONE_PREFIX : formatted;
}

export function isUzPhoneComplete(value) {
  return localDigits(value).length === 9;
}
