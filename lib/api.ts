const API_BASE = "/api";

interface ApiErrorResponse {
  message?: string;
  error?: string;
  stack?: string;
  context?: string;
}

function formatApiError(data: ApiErrorResponse, status: number): string {
  const parts: string[] = [];

  // Main error message
  if (data.message) {
    parts.push(data.message);
  } else {
    parts.push(`Request failed with status ${status}`);
  }

  // Error type (e.g., ValidationError, CastError)
  if (data.error) {
    parts.push(`[${data.error}]`);
  }

  // API context (e.g., PUT /api/workorders/[id])
  if (data.context) {
    parts.push(`(${data.context})`);
  }

  return parts.join(" ");
}

async function fetchApi(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include",
  });
  if (res.status === 401) {
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  if (res.status === 403) {
    throw new Error("You don't have permission to perform this action");
  }
  return res;
}

export async function get<T>(path: string): Promise<T> {
  const res = await fetchApi(path);
  const data = await res.json();
  if (!res.ok) {
    const errorData = data as ApiErrorResponse;
    if (errorData.stack) console.error("API Error Stack:", errorData.stack);
    throw new Error(formatApiError(errorData, res.status));
  }
  return data as T;
}

export async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetchApi(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    const errorData = data as ApiErrorResponse;
    if (errorData.stack) console.error("API Error Stack:", errorData.stack);
    throw new Error(formatApiError(errorData, res.status));
  }
  return data as T;
}

export async function put<T>(path: string, body: unknown): Promise<T> {
  const res = await fetchApi(path, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    const errorData = data as ApiErrorResponse;
    if (errorData.stack) console.error("API Error Stack:", errorData.stack);
    throw new Error(formatApiError(errorData, res.status));
  }
  return data as T;
}

export async function patch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetchApi(path, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    const errorData = data as ApiErrorResponse;
    if (errorData.stack) console.error("API Error Stack:", errorData.stack);
    throw new Error(formatApiError(errorData, res.status));
  }
  return data as T;
}

export async function del(path: string): Promise<void> {
  const res = await fetchApi(path, { method: "DELETE" });
  if (!res.ok) {
    const data = await res.json();
    const errorData = data as ApiErrorResponse;
    if (errorData.stack) console.error("API Error Stack:", errorData.stack);
    throw new Error(formatApiError(errorData, res.status));
  }
}
