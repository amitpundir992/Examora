/** Minimal className combiner (no extra deps). Falsy values are dropped. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function letter(index: number): string {
  return String.fromCharCode(65 + index); // 0 -> A
}
