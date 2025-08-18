import orchestratror from "tests/orchestrator";
import session from "models/session";
import setCookieParser from "set-cookie-parser";

import { version as uuidVersion } from "uuid";

beforeAll(async () => {
  await orchestratror.clearDatabase();
  await orchestratror.runPendingMigrations();
});

describe("GET /api/v1/user", () => {
  describe("Default user", () => {
    test("With valid session", async () => {
      const createdUser = await orchestratror.createUser({
        username: "UserWithValidSession",
      });

      const sessionObject = await orchestratror.createSession(createdUser.id);

      const res = await fetch("http://localhost:3000/api/v1/user", {
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
        password: createdUser.password,
        created_at: createdUser.created_at.toISOString(),
        updated_at: createdUser.updated_at.toISOString(),
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
      });
    });

    test("With session about to expire date", async () => {
      // Create session about to expire
      jest.useFakeTimers({
        now: new Date(
          Date.now() - session.EXPIRATION_IN_MILLISECONDS + 60 * 1000,
        ),
      });

      const createdUser = await orchestratror.createUser({
        username: "UserWithSessionAboutToExpire",
      });

      const sessionObject = await orchestratror.createSession(createdUser.id);

      jest.useRealTimers();

      const res = await fetch("http://localhost:3000/api/v1/user", {
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
        password: createdUser.password,
        created_at: createdUser.created_at.toISOString(),
        updated_at: createdUser.updated_at.toISOString(),
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
      });
    });

    test("With nonexistent session", async () => {
      const nonexistentToken =
        "5b8386b1d1675b9055b9e3d3d018be524d524c71a37cc4489f9ae4b7edbb15d71aa3a69a59890f0f04b48cb9d870675f";

      const res = await fetch("http://localhost:3000/api/v1/user", {
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
      const createdUser = await orchestratror.createUser({
        username: "UserWithExpiredSession",
      });

      const sessionObject = await orchestratror.createSession(createdUser.id);

      jest.useRealTimers();

      const res = await fetch("http://localhost:3000/api/v1/user", {
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
