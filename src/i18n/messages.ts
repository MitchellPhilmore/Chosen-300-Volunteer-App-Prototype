import en from "@/locales/en.json";
import es from "@/locales/es.json";

export type Locale = "en" | "es";
export type MessageValue = string | { [key: string]: MessageValue };
export type Messages = Record<string, MessageValue>;

export const defaultLocale: Locale = "en";

export const messages: Record<Locale, Messages> = {
  en,
  es,
};

