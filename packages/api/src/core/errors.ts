export interface ApiErrorResponse {
  message?: string;
  code?: string;
  statusCode?: number;
}

export class ApiClientError extends Error {
  public readonly status: number;
  public readonly code?: string;
  public readonly payload: unknown;

  constructor(message: string, status: number, code?: string, payload?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.payload = payload;
  }
}
