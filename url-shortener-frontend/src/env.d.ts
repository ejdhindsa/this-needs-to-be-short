/// <reference types="vite/client" />

declare module "@unwreck/core/reset";
declare module "@unwreck/core/css";
declare module "@unwreck/core/fonts.css";

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_SHORT_BASE_URL: string;
  readonly VITE_TURNSTILE_SITE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface TurnstileRenderOptions {
  sitekey: string;
  callback?: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: () => void;
  theme?: "auto" | "light" | "dark";
  size?: "normal" | "compact" | "flexible";
}

interface Turnstile {
  render: (
    container: HTMLElement | string,
    options: TurnstileRenderOptions,
  ) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
}

interface Window {
  turnstile?: Turnstile;
}
