import { createHotTimeApi } from "@hottime/api";

export function createApi(getToken: () => string | null | Promise<string | null>) {
  return createHotTimeApi({
    baseUrl: "http://192.168.1.129:3001",
    getToken,
  });
}

