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
};

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export async function apiRequest<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { body, headers, ...rest } = options;

  const url = `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;

  const response = await fetch(url, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  const data = (await response.json()) as ApiResponse<T>;

  if (!response.ok) {
    return {
      success: false,
      message:
        "message" in data && typeof data.message === "string"
          ? data.message
          : "Request failed",
    };
  }

  return data;
}

export function getApiUrl() {
  return API_URL ?? "";
}
