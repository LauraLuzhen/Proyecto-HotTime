import { HttpClient, type ApiClientConfig } from "./core/httpClient";
import { AuthApi } from "./modules/auth/client";
import { UserApi } from "./modules/user/client";
import { CategoryApi } from "./modules/category/client";

export interface HotTimeApi {
  auth: AuthApi;
  user: UserApi;
  category: CategoryApi;
}

export function createHotTimeApi(config: ApiClientConfig): HotTimeApi {
  const http = new HttpClient(config);

  return {
    auth: new AuthApi(http),
    user: new UserApi(http),
    category: new CategoryApi(http),
  };
}
