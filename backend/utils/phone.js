// backend/utils/phone.js
// Normalizes and validates Ethiopian phone numbers.
// Accepted inputs:
//   - 09XXXXXXXX, 07XXXXXXXX (10 digits)
//   - +2519XXXXXXXX, +2517XXXXXXXX (13 chars)
//   - 2519XXXXXXXX, 2517XXXXXXXX (12 digits)
// Returns normalized format: +251XXXXXXXXX (e.g. +251912345678)

function normalizeEthiopianPhone(input) {
  if (!input || typeof input !== 'string') return null;

  // Remove spaces, hyphens, and brackets
  let clean = input.trim().replace(/[\s\-\(\)]/g, '');

  // 1. Starts with +251
  if (clean.startsWith('+251')) {
    const rest = clean.slice(4);
    if (/^[79]\d{8}$/.test(rest)) {
      return `+251${rest}`;
    }
    return null;
  }

  // 2. Starts with 251
  if (clean.startsWith('251')) {
    const rest = clean.slice(3);
    if (/^[79]\d{8}$/.test(rest)) {
      return `+251${rest}`;
    }
    return null;
  }

  // 3. Starts with 09 or 07
  if (clean.startsWith('09') || clean.startsWith('07')) {
    const rest = clean.slice(1); // removes 0, leaves 9XXXXXXXX or 7XXXXXXXX
    if (/^[79]\d{8}$/.test(rest)) {
      return `+251${rest}`;
    }
    return null;
  }

  // 4. Starts with 9 or 7 directly (9 digits)
  if (/^[79]\d{8}$/.test(clean)) {
    return `+251${clean}`;
  }

  return null;
}

// Masks phone number for non-admin viewers: +2519••••5678
function maskPhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') return '';
  if (phone.length < 8) return '••••';
  const prefix = phone.slice(0, 5); // +2519
  const suffix = phone.slice(-4);   // 5678
  return `${prefix}••••${suffix}`;
}

module.exports = {
  normalizeEthiopianPhone,
  maskPhoneNumber
};

