import { createHotTimeApi } from "@hottime/api";

import { env } from "./env";

export function createApi(getToken: () => string | null) {
  return createHotTimeApi({
    baseUrl: env.apiBaseUrl,
    getToken,
  });
}

