import activation from "models/activation";
import password from "models/password";
import orchestrator from "tests/orchestrator";
import webserver from "infra/webserver";
import user from "models/user";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("Use case: Registration Flow (all successful)", () => {
  let createdUserResBody;
  let activationTokenId;

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

    createdUserResBody = await createdUserRes.json();

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

  test("Receive activation email", async () => {
    const lastEmail = await orchestrator.getLastEmail();

    expect(lastEmail.sender).toBe("<contato@fintab.com.br>");
    expect(lastEmail.recipients[0]).toBe("<registration.flow@teste.com>");
    expect(lastEmail.subject).toBe("Ative seu cadastro no FinTab!");
    expect(lastEmail.text).toContain("RegistrationFlow");

    activationTokenId = orchestrator.extractUUId(lastEmail.text);

    expect(lastEmail.text).toContain(
      `${webserver.origin}/cadastro/ativar/${activationTokenId}`,
    );

    const activationTokenObject =
      await activation.findOneValidById(activationTokenId);

    expect(activationTokenObject.user_id).toBe(createdUserResBody.id);
    expect(activationTokenObject.used_at).toBe(null);
  });

  test("Activate account", async () => {
    const activationRes = await fetch(
      `http://localhost:3000/api/v1/activations/${activationTokenId}`,
      {
        method: "PATCH",
      },
    );

    expect(activationRes.status).toBe(200);

    const activationResBoy = await activationRes.json();

    expect(Date.parse(activationResBoy.used_at)).not.toBeNaN();

    const activatedUser = await user.findOneByUsername("RegistrationFlow");
    expect(activatedUser.features).toEqual(["create:session"]);
  });

  test("Login", async () => {});

  test("Get user information", async () => {});
});
