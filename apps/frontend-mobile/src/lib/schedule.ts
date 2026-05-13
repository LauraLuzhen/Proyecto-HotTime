import type { ShiftResponse } from "@hottime/types";

export const dayNames = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];
export const calendarDayNames = ["L", "M", "X", "J", "V", "S", "D"];

export const palette = {
  background: "#f5efe5",
  backgroundSoft: "#f8f4ec",
  surface: "#fffaf2",
  surfaceElevated: "#ffffff",
  border: "#e4d9c8",
  text: "#1f1a17",
  muted: "#71665b",
  accent: "#2f5f5b",
  accentStrong: "#204642",
  accentSoft: "#dbe8e4",
  warning: "#c85b28",
  danger: "#b42318",
  success: "#217a3f",
  gold: "#c18a2d",
};

export function startOfWeek(value: Date) {
  const date = new Date(value);
  const day = date.getDay() || 7;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - day + 1);
  return date;
}

export function startOfMonth(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), 1);
}

export function endOfMonth(value: Date) {
  return new Date(value.getFullYear(), value.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function addDays(value: Date, days: number) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
}

export function addMonths(value: Date, months: number) {
  const date = new Date(value);
  date.setMonth(date.getMonth() + months);
  return date;
}

export function sameDay(left: Date | string, right: Date) {
  return new Date(left).toDateString() === right.toDateString();
}

export function sameMonth(left: Date | string, right: Date) {
  const date = new Date(left);
  return date.getFullYear() === right.getFullYear() && date.getMonth() === right.getMonth();
}

export function buildMonthDays(month: Date) {
  const first = startOfMonth(month);
  const gridStart = startOfWeek(first);
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
}

export function startOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function endOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
}

export function formatDay(value: Date | string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(value));
}

export function formatMonth(value: Date) {
  return new Intl.DateTimeFormat("es-ES", {
    month: "long",
    year: "numeric",
  }).format(value);
}

export function formatLongDate(value: Date | string) {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatTime(value: Date | string) {
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatDateTime(value: Date | string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatRange(shift: Pick<ShiftResponse, "startsAt" | "endsAt">) {
  return `${formatTime(shift.startsAt)} - ${formatTime(shift.endsAt)}`;
}

export function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function categoryName(shift: {
  categories?: { categoryId: number }[];
  category?: { name: string } | null;
}) {
  return shift.category?.name ?? (shift.categories?.length ? `Categoria #${shift.categories[0].categoryId}` : "Sin categoria");
}

export function statusLabel(status: ShiftResponse["status"]) {
  const labels: Record<ShiftResponse["status"], string> = {
    SCHEDULED: "Programado",
    IN_PROGRESS: "En curso",
    COMPLETED: "Completado",
    MISSED: "Ausente",
  };
  return labels[status];
}

export function publishedLabel(published: boolean) {
  return published ? "Publicado" : "Borrador";
}

export function shiftOverlaps(a: { startsAt: Date; endsAt: Date }, b: { startsAt: Date | string; endsAt: Date | string }) {
  return a.startsAt < new Date(b.endsAt) && a.endsAt > new Date(b.startsAt);
}
