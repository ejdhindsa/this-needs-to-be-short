import axios from "axios";
import type { AxiosInstance } from "axios";
import type {
  AnalyticsResponse,
  ShortenRequest,
  ShortenResponse,
} from "./types";

const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error("Unauthorised.");
    } else if (error.response?.status === 403) {
      console.error("Resource forbidden.");
    } else if (error.response?.status === 404) {
      console.error("404 not found!");
    } else if (error.response?.status === 429) {
      console.error("Too many requests");
    } else if ([500, 502, 503].includes(error.response?.status)) {
      console.error("Internal Server Error");
    } else {
      console.error("An error occured", error);
    }

    return Promise.reject(error);
  },
);

async function shortenURL(data: ShortenRequest): Promise<ShortenResponse> {
  const response = await apiClient.post<ShortenResponse>("/shorten", data);
  return response.data;
}

async function analytics(
  shortCode: string,
  page = 1,
  limit = 50,
): Promise<AnalyticsResponse> {
  const response = await apiClient.get<AnalyticsResponse>(
    `/analytics/${shortCode}?page=${page}&limit=${limit}`,
  );
  return response.data;
}

export { shortenURL, analytics };
