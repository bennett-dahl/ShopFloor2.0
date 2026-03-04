const BASE = "http://localhost";

export function buildUrl(path: string, searchParams?: Record<string, string>) {
  const url = new URL(path, BASE);
  if (searchParams) {
    Object.entries(searchParams).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  return url.toString();
}

export async function get(
  handler: (req: Request) => Promise<Response>,
  path: string,
  query?: Record<string, string>
): Promise<{ status: number; data: unknown }> {
  const url = buildUrl(path, query);
  const res = await handler(new Request(url));
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

export async function post(
  handler: (req: Request) => Promise<Response>,
  path: string,
  body: unknown
): Promise<{ status: number; data: unknown }> {
  const res = await handler(
    new Request(buildUrl(path), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

export async function put(
  handler: (req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>,
  path: string,
  id: string,
  body: unknown
): Promise<{ status: number; data: unknown }> {
  const res = await handler(
    new Request(buildUrl(`${path}/${id}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) }
  );
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

export async function patch(
  handler: (req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>,
  path: string,
  id: string,
  body: unknown
): Promise<{ status: number; data: unknown }> {
  const res = await handler(
    new Request(buildUrl(`${path}/${id}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) }
  );
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

export async function del(
  handler: (req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>,
  path: string,
  id: string
): Promise<{ status: number; data: unknown }> {
  const res = await handler(
    new Request(buildUrl(`${path}/${id}`), { method: "DELETE" }),
    { params: Promise.resolve({ id }) }
  );
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

export async function getById(
  handler: (req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>,
  path: string,
  id: string
): Promise<{ status: number; data: unknown }> {
  const res = await handler(
    new Request(buildUrl(`${path}/${id}`)),
    { params: Promise.resolve({ id }) }
  );
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

export async function patchStatus(
  handler: (req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>,
  path: string,
  id: string,
  body: unknown
): Promise<{ status: number; data: unknown }> {
  const res = await handler(
    new Request(buildUrl(`${path}/${id}/status`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) }
  );
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}
