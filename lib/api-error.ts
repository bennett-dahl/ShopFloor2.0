import { NextResponse } from "next/server";

/**
 * Create a standardized error response with verbose details for debugging.
 * In production, set VERBOSE_ERRORS=1 to include stack traces.
 */
export function errorResponse(
  error: unknown,
  context?: string,
  status = 500
): NextResponse {
  const isDev = process.env.NODE_ENV === "development";
  const verboseErrors = process.env.VERBOSE_ERRORS === "1" || isDev;

  let message = "Server error";
  let stack: string | undefined;
  let errorType: string | undefined;

  if (error instanceof Error) {
    message = error.message;
    errorType = error.name;
    if (verboseErrors) {
      stack = error.stack;
    }
  } else if (typeof error === "string") {
    message = error;
  } else if (error && typeof error === "object" && "message" in error) {
    message = String((error as { message: unknown }).message);
  }

  // Always log to server console with full details
  const logContext = context ? `[${context}]` : "[API Error]";
  console.error(logContext, {
    message,
    errorType,
    stack: error instanceof Error ? error.stack : undefined,
  });

  // Return response with details for frontend
  const responseBody: {
    message: string;
    error?: string;
    stack?: string;
    context?: string;
  } = { message };

  if (verboseErrors) {
    if (errorType && errorType !== "Error") {
      responseBody.error = errorType;
    }
    if (stack) {
      responseBody.stack = stack;
    }
    if (context) {
      responseBody.context = context;
    }
  }

  return NextResponse.json(responseBody, { status });
}
