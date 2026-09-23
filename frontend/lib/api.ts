import {
  reportFromHttpStatus,
  reportServerUnreachable,
} from "@/lib/server-status";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  console.warn("NEXT_PUBLIC_API_URL is not set");
}

export type ApiSuccess<T> = {
  success: true;
  message: string;
  data?: T;
};

export type ApiError = {
  success: false;
  message: string;
  data?: unknown;
  status?: number;
  networkError?: boolean;
};

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export async function apiRequest<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const { body, headers, ...rest } = options;

  if (!API_URL) {
    reportServerUnreachable();
    return {
      success: false,
      message: "Server unreachable. The API address is not configured.",
      networkError: true,
    };
  }

  const url = `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;

  try {
    const response = await fetch(url, {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: "include",
    });

    let data: ApiResponse<T> & { data?: T } = {
      success: false,
      message: "Request failed",
    };
    try {
      data = (await response.json()) as ApiResponse<T> & { data?: T };
    } catch {
      /* non-JSON body */
    }

    reportFromHttpStatus(response.status);

    if (!response.ok) {
      const gatewayDown =
        response.status === 502 ||
        response.status === 503 ||
        response.status === 504;
      return {
        success: false,
        message: gatewayDown
          ? "Server unreachable. Check your connection and try again."
          : "message" in data && typeof data.message === "string"
            ? data.message
            : "Request failed",
        data: "data" in data ? data.data : undefined,
        status: response.status,
        networkError: gatewayDown,
      };
    }

    return data;
  } catch {
    reportServerUnreachable();
    return {
      success: false,
      message: "Server unreachable. Check your connection and try again.",
      networkError: true,
    };
  }
}

export function getApiUrl() {
  return API_URL ?? "";
}
