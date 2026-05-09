const baseUrl = process.env.API_BASE_URL ?? "http://127.0.0.1:3001";
const runId = Date.now();

const results = [];

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  const icon = ok ? "OK" : "FAIL";
  console.log(`[${icon}] ${name}${detail ? ` -> ${detail}` : ""}`);
}

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body !== undefined && !headers["content-type"]) {
    headers["content-type"] = "application/json";
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  return { response, data };
}

function assertStatus(name, actual, expected, data) {
  const ok = actual === expected;
  record(name, ok, `status ${actual}, expected ${expected}`);
  if (!ok) {
    throw new Error(`${name} failed. Response: ${JSON.stringify(data)}`);
  }
}

async function run() {
  const adminLogin = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: "laurarm1002@gmail.com",
      password: "Password1.",
    }),
  });
  assertStatus("auth/login admin", adminLogin.response.status, 200, adminLogin.data);
  const adminToken = adminLogin.data?.token;
  if (!adminToken) throw new Error("admin token missing");

  const managerLogin = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: "manager@muerde.com",
      password: "Password1.",
    }),
  });
  assertStatus("auth/login manager", managerLogin.response.status, 200, managerLogin.data);
  const managerToken = managerLogin.data?.token;
  if (!managerToken) throw new Error("manager token missing");

  const badLogin = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: "laurarm1002@gmail.com",
      password: "wrongpass",
    }),
  });
  assertStatus("auth/login invalid creds", badLogin.response.status, 401, badLogin.data);

  const forgotExisting = await request("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email: "manager@muerde.com" }),
  });
  assertStatus("auth/forgot-password existing email", forgotExisting.response.status, 200, forgotExisting.data);

  const forgotUnknown = await request("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email: "nobody@none.com" }),
  });
  assertStatus("auth/forgot-password unknown email", forgotUnknown.response.status, 400, forgotUnknown.data);

  const resetInvalid = await request("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token: "invalid-token", password: "Password1." }),
  });
  assertStatus("auth/reset-password invalid token", resetInvalid.response.status, 400, resetInvalid.data);

  const usersNoToken = await request("/users");
  assertStatus("users/get no token", usersNoToken.response.status, 401, usersNoToken.data);

  const usersAdmin = await request("/users", {
    headers: { authorization: `Bearer ${adminToken}` },
  });
  assertStatus("users/get admin auth", usersAdmin.response.status, 200, usersAdmin.data);

  const usersManager = await request("/users", {
    headers: { authorization: `Bearer ${managerToken}` },
  });
  assertStatus("users/get manager auth", usersManager.response.status, 200, usersManager.data);

  const createUserManager = await request("/users", {
    method: "POST",
    headers: { authorization: `Bearer ${managerToken}` },
    body: JSON.stringify({
      fullName: "Temp User",
      email: "temp.user@test.com",
      password: "Password1.",
      role: "EMPLOYEE",
      birthDate: "1999-01-01",
      initDate: "2025-01-01",
      phone: "600123123",
    }),
  });
  assertStatus("users/create manager forbidden", createUserManager.response.status, 403, createUserManager.data);

  const createUserAdmin = await request("/users", {
    method: "POST",
    headers: { authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      fullName: "Temp User",
      email: `temp.user.${runId}@test.com`,
      password: "Password1.",
      role: "EMPLOYEE",
      birthDate: "1999-01-01",
      initDate: "2025-01-01",
      phone: "600123123",
    }),
  });
  assertStatus("users/create admin", createUserAdmin.response.status, 201, createUserAdmin.data);
  const tempUserId = createUserAdmin.data?.id;
  if (!tempUserId) throw new Error("temp user id missing");

  const updateMe = await request("/users/me", {
    method: "PATCH",
    headers: { authorization: `Bearer ${managerToken}` },
    body: JSON.stringify({ phone: "699999999" }),
  });
  assertStatus("users/me update", updateMe.response.status, 200, updateMe.data);

  const deleteUserManager = await request(`/users/${tempUserId}`, {
    method: "DELETE",
    headers: { authorization: `Bearer ${managerToken}` },
  });
  assertStatus("users/delete manager forbidden", deleteUserManager.response.status, 403, deleteUserManager.data);

  const deleteUserAdmin = await request(`/users/${tempUserId}`, {
    method: "DELETE",
    headers: { authorization: `Bearer ${adminToken}` },
  });
  assertStatus("users/delete admin", deleteUserAdmin.response.status, 200, deleteUserAdmin.data);

  const categoriesNoToken = await request("/categories");
  assertStatus("categories/get no token", categoriesNoToken.response.status, 401, categoriesNoToken.data);

  const categoriesGet = await request("/categories", {
    headers: { authorization: `Bearer ${managerToken}` },
  });
  assertStatus("categories/get auth", categoriesGet.response.status, 200, categoriesGet.data);

  const categoryManagerCreate = await request("/categories", {
    method: "POST",
    headers: { authorization: `Bearer ${managerToken}` },
    body: JSON.stringify({ name: "tmp-category" }),
  });
  assertStatus("categories/create manager forbidden", categoryManagerCreate.response.status, 403, categoryManagerCreate.data);

  const categoryAdminCreate = await request("/categories", {
    method: "POST",
    headers: { authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ name: `tmp-category-${runId}` }),
  });
  assertStatus("categories/create admin", categoryAdminCreate.response.status, 201, categoryAdminCreate.data);
  const tempCategoryId = categoryAdminCreate.data?.id;
  if (!tempCategoryId) throw new Error("temp category id missing");

  const categoryUpdateManager = await request(`/categories/${tempCategoryId}`, {
    method: "PATCH",
    headers: { authorization: `Bearer ${managerToken}` },
    body: JSON.stringify({ name: `tmp-category-updated-${runId}` }),
  });
  assertStatus("categories/update manager forbidden", categoryUpdateManager.response.status, 403, categoryUpdateManager.data);

  const categoryUpdateAdmin = await request(`/categories/${tempCategoryId}`, {
    method: "PATCH",
    headers: { authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ name: `tmp-category-updated-${runId}` }),
  });
  assertStatus("categories/update admin", categoryUpdateAdmin.response.status, 200, categoryUpdateAdmin.data);

  const usersByCategory = await request(`/categories/${tempCategoryId}/users`, {
    headers: { authorization: `Bearer ${adminToken}` },
  });
  assertStatus("categories/users by id", usersByCategory.response.status, 200, usersByCategory.data);

  const categoryDeleteManager = await request(`/categories/${tempCategoryId}`, {
    method: "DELETE",
    headers: { authorization: `Bearer ${managerToken}` },
  });
  assertStatus("categories/delete manager forbidden", categoryDeleteManager.response.status, 403, categoryDeleteManager.data);

  const categoryDeleteAdmin = await request(`/categories/${tempCategoryId}`, {
    method: "DELETE",
    headers: { authorization: `Bearer ${adminToken}` },
  });
  assertStatus("categories/delete admin", categoryDeleteAdmin.response.status, 200, categoryDeleteAdmin.data);

  const failed = results.filter((item) => !item.ok);
  if (failed.length > 0) {
    throw new Error(`Smoke test completed with ${failed.length} failures`);
  }

  console.log(`\nAll endpoint checks passed: ${results.length}/${results.length}`);
}

run().catch((err) => {
  console.error(`\nSmoke test failed: ${err.message}`);
  process.exit(1);
});
