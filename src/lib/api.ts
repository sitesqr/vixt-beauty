import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError } from "./auth";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    { success: false, error: { message, details } },
    { status }
  );
}

export function handleError(error: unknown) {
  console.error("[API ERROR]", error);
  if (error instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of error.issues) {
      fields[issue.path.join(".")] = issue.message;
    }
    return fail("Dados inválidos", 422, fields);
  }
  if (error instanceof AuthError) {
    return fail(error.message, error.status);
  }
  if (error instanceof Error && "code" in error && (error as any).code === "P2002") {
    return fail("Registro duplicado (valor já em uso)", 409);
  }
  return fail("Erro interno do servidor", 500);
}
