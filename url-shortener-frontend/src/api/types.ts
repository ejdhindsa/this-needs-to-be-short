export interface ShortenRequest {
  url: string;
  customCode?: string;
}

export interface ShortenResponse {
  shortCode: string;
  originalURL: string;
  linkType: "normal" | "custom";
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
  issues?: Array<{ message: string }>;
}
