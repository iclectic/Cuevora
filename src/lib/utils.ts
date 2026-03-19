import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function resolveLegalUrl(configuredUrl: string | undefined, fallbackFile: string) {
  const basePath = import.meta.env.BASE_URL || "/";
  const normalizedBase = basePath.endsWith("/") ? basePath : `${basePath}/`;
  const value = configuredUrl?.trim();

  if (!value) {
    return `${normalizedBase}${fallbackFile}`;
  }

  if (/^(https?:)?\/\//i.test(value) || value.startsWith("mailto:")) {
    return value;
  }

  const normalizedValue = value.startsWith("/") ? value.slice(1) : value;
  return `${normalizedBase}${normalizedValue}`;
}
