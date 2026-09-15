/// <reference types="vite/client" />

declare module "@unwreck/core/reset";
declare module "@unwreck/core/css";
declare module "@unwreck/core/fonts.css";

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_SHORT_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
