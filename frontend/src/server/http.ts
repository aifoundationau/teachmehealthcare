import { NextResponse, type NextRequest } from "next/server";
import { ZodError, type ZodType } from "zod";

/** An error with an HTTP status, returned to the client as `{ detail }` (the same shape FastAPI used). */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

type RouteHandler<P> = (req: NextRequest, ctx: { params: P }) => Promise<Response>;

/** Wraps a route handler so thrown ApiErrors and validation errors become `{ detail }` responses. */
export function route<P = Record<string, string>>(fn: RouteHandler<P>): RouteHandler<P> {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof ApiError) return json({ detail: err.message }, err.status);
      if (err instanceof ZodError) return json({ detail: formatZodError(err) }, 422);
      console.error(`[api] ${req.method} ${req.nextUrl.pathname} failed:`, err);
      return json({ detail: "Internal server error" }, 500);
    }
  };
}

function formatZodError(err: ZodError) {
  return err.issues
    .map((issue) => (issue.path.length ? `${issue.path.join(".")}: ${issue.message}` : issue.message))
    .join("; ");
}

export async function parseJson<T>(req: NextRequest, schema: ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ApiError(400, "Request body must be valid JSON.");
  }
  return schema.parse(body);
}

export function parseQuery<T>(req: NextRequest, schema: ZodType<T>): T {
  return schema.parse(Object.fromEntries(req.nextUrl.searchParams));
}

/** Parses a numeric path segment; anything that isn't a positive integer can't match a row. */
export function parseId(value: string, notFoundMessage: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new ApiError(404, notFoundMessage);
  return id;
}
