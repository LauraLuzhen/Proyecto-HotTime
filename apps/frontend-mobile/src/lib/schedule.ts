import type { ShiftResponse } from "@hottime/types";

export const dayNames = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];

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

export function formatTime(value: Date | string) {
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatRange(shift: Pick<ShiftResponse, "startsAt" | "endsAt">) {
  return `${formatTime(shift.startsAt)} - ${formatTime(shift.endsAt)}`;
}

export function categoryName(shift: Pick<ShiftResponse, "category">) {
  return shift.category?.name ?? "Sin categoria";
}

export function statusLabel(status: ShiftResponse["status"]) {
  const labels: Record<ShiftResponse["status"], string> = {
    SCHEDULED: "Programado",
    IN_PROGRESS: "En curso",
    COMPLETED: "Completado",
    MISSED: "Ausente",
    CANCELLED: "Cancelado",
  };
  return labels[status];
}

export function publishedLabel(published: boolean) {
  return published ? "Publicado" : "Borrador";
}

export function shiftOverlaps(a: { startsAt: Date; endsAt: Date }, b: { startsAt: Date | string; endsAt: Date | string }) {
  return a.startsAt < new Date(b.endsAt) && a.endsAt > new Date(b.startsAt);
}
