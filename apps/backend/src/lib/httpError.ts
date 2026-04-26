export function httpError(message: string, statusCode = 400, code?: string) {
  return {
    message,
    statusCode,
    code,
  };
}