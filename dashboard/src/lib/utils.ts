import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(raw: string | null): string {
  if (!raw) return "—";
  return new Date(raw).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatTime(raw: string | null): string {
  if (!raw) return "";
  return new Date(raw).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateTime(raw: string | null): string {
  if (!raw) return "—";
  const d = formatDate(raw);
  const t = formatTime(raw);
  return `${d} ${t}`;
}

export function getMatchStatus(status: string): {
  label: string;
  color: string;
} {
  switch (status) {
    case "running":
      return { label: "LIVE", color: "live" };
    case "not_started":
      return { label: "예정", color: "upcoming" };
    case "finished":
      return { label: "완료", color: "finished" };
    case "canceled":
      return { label: "취소", color: "finished" };
    default:
      return { label: status, color: "text-muted" };
  }
}

export function formatShortDate(raw: string | null): string {
  if (!raw) return "—";
  const d = new Date(raw);
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const h = d.getHours().toString().padStart(2, "0");
  const min = d.getMinutes().toString().padStart(2, "0");
  return `${m}/${day} ${h}:${min}`;
}

export function getSeriesStatus(
  beginAt: string | null,
  endAt: string | null,
): { label: string; color: string } {
  const now = new Date();
  if (endAt && new Date(endAt) < now)
    return { label: "완료", color: "finished" };
  if (beginAt && new Date(beginAt) <= now)
    return { label: "진행 중", color: "win" };
  return { label: "예정", color: "upcoming" };
}
