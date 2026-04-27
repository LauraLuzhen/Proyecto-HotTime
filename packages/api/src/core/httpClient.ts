import { ApiClientError, type ApiErrorResponse } from "./errors";

export type TokenProvider = () => string | null | undefined | Promise<string | null | undefined>;

export interface ApiClientConfig {
  baseUrl: string;
  getToken?: TokenProvider;
  defaultHeaders?: Record<string, string>;
}

type Method = "GET" | "POST" | "PUT" | "DELETE";

interface RequestOptions {
  method: Method;
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
}

export class HttpClient {
  private readonly baseUrl: string;
  private readonly getToken?: TokenProvider;
  private readonly defaultHeaders: Record<string, string>;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.getToken = config.getToken;
    this.defaultHeaders = config.defaultHeaders ?? {};
  }

  async get<TResponse>(path: string, headers?: Record<string, string>): Promise<TResponse> {
    return this.request<TResponse>({ method: "GET", path, headers });
  }

  async post<TResponse, TBody = unknown>(
    path: string,
    body?: TBody,
    headers?: Record<string, string>
  ): Promise<TResponse> {
    return this.request<TResponse>({ method: "POST", path, body, headers });
  }

  async put<TResponse, TBody = unknown>(
    path: string,
    body?: TBody,
    headers?: Record<string, string>
  ): Promise<TResponse> {
    return this.request<TResponse>({ method: "PUT", path, body, headers });
  }

  async delete<TResponse>(path: string, headers?: Record<string, string>): Promise<TResponse> {
    return this.request<TResponse>({ method: "DELETE", path, headers });
  }

  private async request<TResponse>(options: RequestOptions): Promise<TResponse> {
    const token = this.getToken ? await this.getToken() : null;
    const hasBody = options.body !== undefined;

    const headers: Record<string, string> = {
      ...this.defaultHeaders,
      ...(options.headers ?? {}),
    };

    if (token) {
      headers.authorization = `Bearer ${token}`;
    }

    if (hasBody && !headers["content-type"]) {
      headers["content-type"] = "application/json";
    }

    const response = await fetch(`${this.baseUrl}${options.path}`, {
      method: options.method,
      headers,
      body: hasBody ? JSON.stringify(options.body) : undefined,
    });

    const contentType = response.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");
    const payload: unknown = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const errorPayload = (payload as ApiErrorResponse) ?? {};
      throw new ApiClientError(
        errorPayload.message ?? `HTTP error ${response.status}`,
        response.status,
        errorPayload.code,
        payload
      );
    }

    return payload as TResponse;
  }
}
