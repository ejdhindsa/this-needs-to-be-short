export interface ShortenRequest {
  url: string;
  customCode?: string;
}

export interface ShortenResponse {
  readonly sid: string;
  shortCode: string;
  originalURL: string;
  linkType: "Normal" | "Custom";
  createdAt: string;
}

export interface ClickRecord {
  readonly clickId: string;
  referrer?: string | null;
  clickedAt: string;
}

export interface AnalyticsResponse {
  shortCode: string;
  originalURL: string;
  linkType: string;
  totalClicks: number;
  page: number;
  limit: number;
  totalPages: number;
  clicks: ClickRecord[];
}

export interface ApiError {
  error?: string;
  message?: string;
}
