// Laravel validation errors are kept so a form can show messages by field.
export class ApiError extends Error {
  constructor(
    message: string,
    public errors: Record<string, string[]> = {},
  ) {
    super(message);
  }
}

// One place handles URLs, JSON, network failures and empty DELETE responses.
export async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError")
      throw error;
    throw new ApiError(
      "No se pudo conectar con Laravel. Comprueba que el backend esté encendido.",
    );
  }
  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => null);
  if (!response.ok)
    throw new ApiError(
      body?.message || "No se pudo completar la solicitud.",
      body?.errors || {},
    );
  if (body === null)
    throw new ApiError("El servidor no devolvió una respuesta JSON válida.");
  return body as T;
}
export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Ocurrió un error inesperado.";
