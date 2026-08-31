export const Routes = {
  Home: "home",
  Analytics: "analytics",
  NotFound: "notFound",
} as const;

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
  timerId?: number;
}
