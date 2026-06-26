export const PASSWORD_RULES = [
  { id: 'length', test: (value) => value.length >= 8, label: 'Minimo 8 caracteres' },
  { id: 'lower', test: (value) => /[a-z]/.test(value), label: 'Al menos una minuscula' },
  { id: 'upper', test: (value) => /[A-Z]/.test(value), label: 'Al menos una mayuscula' },
  { id: 'digit', test: (value) => /\d/.test(value), label: 'Al menos un numero' },
  { id: 'symbol', test: (value) => /[^A-Za-z0-9]/.test(value), label: 'Al menos un simbolo (!@#$...)' },
  { id: 'notOnlyDigits', test: (value) => value.length === 0 || !/^\d+$/.test(value), label: 'No puede ser solo numeros' },
];

export function evaluatePasswordRules(password) {
  const value = String(password ?? '');
  return PASSWORD_RULES.map((rule) => ({
    ...rule,
    ok: rule.test(value),
  }));
}

export function validatePassword(password) {
  const value = String(password ?? '');
  const failed = PASSWORD_RULES.filter((rule) => !rule.test(value));

  if (failed.length === 0) {
    return { valid: true, message: '' };
  }

  return {
    valid: false,
    message: `La nueva contrasena debe cumplir: ${failed.map((rule) => rule.label.toLowerCase()).join(', ')}.`,
  };
}
