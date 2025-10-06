import password from "models/password";
import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("Use case: Registration Flow (all successful)", () => {
  test("Create user account", async () => {
    const createdUserRes = await fetch("http://localhost:3000/api/v1/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "RegistrationFlow",
        email: "registration.flow@teste.com",
        password: "RegistrationFlowPassword",
      }),
    });

    expect(createdUserRes.status).toBe(201);

    const createdUserResBody = await createdUserRes.json();

    expect(createdUserResBody).toEqual({
      id: createdUserResBody.id,
      username: "RegistrationFlow",
      email: "registration.flow@teste.com",
      password: createdUserResBody.password,
      features: ["read:activation_token"],
      created_at: createdUserResBody.created_at,
      updated_at: createdUserResBody.updated_at,
    });
  });
  test("Receive activation email", async () => {});

  test("Activate account", async () => {});

  test("Login", async () => {});

  test("Get user information", async () => {});
});
