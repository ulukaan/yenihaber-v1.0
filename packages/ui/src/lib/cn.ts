import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind class birleştirici */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
