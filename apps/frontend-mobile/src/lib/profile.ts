export function formatProfileDate(value?: Date) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export function toProfileDateInputValue(value?: Date) {
  if (!value) return "";
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value)).replace(/\//g, "-");
}

export function parseProfileDateInput(value: string): Date | null {
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

export function validateProfileName(value: string) {
  return value.trim().length >= 5 ? undefined : "Minimo 5 caracteres.";
}

export function validateProfileEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? undefined : "Formato email: correo@correo.com.";
}

export function validateProfilePhone(value: string) {
  return /^\d{9}$/.test(value.trim()) ? undefined : "Debe tener 9 digitos.";
}

export function validateProfileDate(value: string) {
  const parsed = parseProfileDateInput(value);
  if (!parsed) return "Formato fecha: DD-MM-YYYY.";
  if (parsed >= new Date()) return "La fecha debe ser anterior a hoy.";
  return undefined;
}

export function validateProfilePassword(value: string) {
  const password = value.trim();
  if (!password) return undefined;
  if (password.length < 8) return "Minimo 8 caracteres.";
  if (!/[A-Z]/.test(password)) return "Debe tener 1 mayúscula.";
  if (!/[a-z]/.test(password)) return "Debe tener 1 minúscula.";
  if (!/[0-9]/.test(password)) return "Debe tener 1 numero.";
  if (!/[^A-Za-z0-9]/.test(password)) return "Debe tener 1 caracter especial.";
  return undefined;
}
