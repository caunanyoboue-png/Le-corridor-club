import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatFCFA } from "@maquis/shared";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export { formatFCFA };
