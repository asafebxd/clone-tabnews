import orchestrator from "tests/orchestrator";
import session from "models/session";
import setCookieParser from "set-cookie-parser";
import webserver from "infra/webserver";

import { version as uuidVersion } from "uuid";

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/user", () => {
  describe("Anonymous user", () => {
    test("Retrieving the endpoint", async () => {
      const res = await fetch(`${webserver.origin}/api/v1/user`);

      const resBody = await res.json();

      expect(res.status).toBe(403);

      expect(resBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para executar esta ação.",
        action: 'Verifique se o seu usuário possui a feature "read:session"',
        status_code: 403,
      });
    });
  });

  describe("Default user", () => {
    test("With valid session", async () => {
      const createdUser = await orchestrator.createUser({
        username: "UserWithValidSession",
      });

      const activatedUser = await orchestrator.activateUser(createdUser);

      const sessionObject = await orchestrator.createSession(createdUser);

      const res = await fetch(`${webserver.origin}/api/v1/user`, {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });

      expect(res.status).toBe(200);

      // Get Cache-Control
      const cacheControl = res.headers.get("Cache-Control");
      expect(cacheControl).toBe("no-store, max-age=0, must-revalidate");

      const resBody = await res.json();

      expect(resBody).toEqual({
        id: createdUser.id,
        username: "UserWithValidSession",
        email: createdUser.email,
        features: ["create:session", "read:session", "update:user"],
        created_at: activatedUser.created_at.toISOString(),
        updated_at: activatedUser.updated_at.toISOString(),
      });

      expect(uuidVersion(resBody.id)).toBe(4);
      expect(Date.parse(resBody.created_at)).not.toBeNaN();
      expect(Date.parse(resBody.updated_at)).not.toBeNaN();

      // Session renewal assertions
      const renewedSessionObject = await session.findOneValidByToken(
        sessionObject.token,
      );

      expect(
        renewedSessionObject.expires_at > sessionObject.expires_at,
      ).toEqual(true);
      expect(
        renewedSessionObject.updated_at > sessionObject.updated_at,
      ).toEqual(true);

      // Set-Cookie assertions

      const parsedSetCookie = setCookieParser(res, {
        map: true,
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: sessionObject.token,
        maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      });
    });

    test("With session about to expire date", async () => {
      // Create session about to expire
      jest.useFakeTimers({
        now: new Date(
          Date.now() - session.EXPIRATION_IN_MILLISECONDS + 60 * 1000,
        ),
      });

      const createdUser = await orchestrator.createUser({
        username: "UserWithSessionAboutToExpire",
      });

      const activatedUser = await orchestrator.activateUser(createdUser);

      const sessionObject = await orchestrator.createSession(createdUser);

      jest.useRealTimers();

      const res = await fetch(`${webserver.origin}/api/v1/user`, {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });

      expect(res.status).toBe(200);

      // Get Cache-Control
      const cacheControl = res.headers.get("Cache-Control");
      expect(cacheControl).toBe("no-store, max-age=0, must-revalidate");

      const resBody = await res.json();

      expect(resBody).toEqual({
        id: createdUser.id,
        username: "UserWithSessionAboutToExpire",
        email: createdUser.email,
        features: ["create:session", "read:session", "update:user"],
        created_at: activatedUser.created_at.toISOString(),
        updated_at: activatedUser.updated_at.toISOString(),
      });

      expect(uuidVersion(resBody.id)).toBe(4);
      expect(Date.parse(resBody.created_at)).not.toBeNaN();
      expect(Date.parse(resBody.updated_at)).not.toBeNaN();

      // Session renewal assertions
      const renewedSessionObject = await session.findOneValidByToken(
        sessionObject.token,
      );

      expect(
        renewedSessionObject.expires_at > sessionObject.expires_at,
      ).toEqual(true);
      expect(
        renewedSessionObject.updated_at > sessionObject.updated_at,
      ).toEqual(true);

      // Set-Cookie assertions

      const parsedSetCookie = setCookieParser(res, {
        map: true,
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: sessionObject.token,
        maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      });
    });

    test("With nonexistent session", async () => {
      const nonexistentToken =
        "5b8386b1d1675b9055b9e3d3d018be524d524c71a37cc4489f9ae4b7edbb15d71aa3a69a59890f0f04b48cb9d870675f";

      const res = await fetch(`${webserver.origin}/api/v1/user`, {
        headers: {
          cookie: `session_id=${nonexistentToken}`,
        },
      });

      expect(res.status).toBe(401);

      const resBody = await res.json();

      expect(resBody).toEqual({
        name: "UnauthorizedError",
        message: "Usuário não possui sessão ativa.",
        action: "Verifique se este usuário está logado e tente novamente.",
        status_code: 401,
      });

      // Set-Cookie assertions
      const parsedSetCookie = setCookieParser(res, {
        map: true,
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: "invalid",
        maxAge: -1,
        path: "/",
        httpOnly: true,
      });
    });

    test("With expired session", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - session.EXPIRATION_IN_MILLISECONDS),
      });
      const createdUser = await orchestrator.createUser({
        username: "UserWithExpiredSession",
      });

      const sessionObject = await orchestrator.createSession(createdUser);

      jest.useRealTimers();

      const res = await fetch(`${webserver.origin}/api/v1/user`, {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });

      expect(res.status).toBe(401);

      const resBody = await res.json();

      expect(resBody).toEqual({
        name: "UnauthorizedError",
        message: "Usuário não possui sessão ativa.",
        action: "Verifique se este usuário está logado e tente novamente.",
        status_code: 401,
      });

      // Set-Cookie assertions
      const parsedSetCookie = setCookieParser(res, {
        map: true,
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: "invalid",
        maxAge: -1,
        path: "/",
        httpOnly: true,
      });
    });
  });
});
