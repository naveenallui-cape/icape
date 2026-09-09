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
    return {
      success: false,
      message: "API URL is not configured (NEXT_PUBLIC_API_URL).",
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

    if (!response.ok) {
      return {
        success: false,
        message:
          "message" in data && typeof data.message === "string"
            ? data.message
            : "Request failed",
        data: "data" in data ? data.data : undefined,
        status: response.status,
      };
    }

    return data;
  } catch {
    return {
      success: false,
      message:
        "Cannot reach API. Is the backend running on port 5001?",
      networkError: true,
    };
  }
}

export function getApiUrl() {
  return API_URL ?? "";
}
