import { InternalServerError } from "infra/errors";
import authorization from "models/authorization";

describe("models/authorization.js", () => {
  describe(".can()", () => {
    test("without 'user'", () => {
      expect(() => {
        authorization.can();
      }).toThrow(InternalServerError);
    });

    test("without 'user.features'", () => {
      const createdUser = {
        username: "UserWithoutFeatures",
      };

      expect(() => {
        authorization.can(createdUser);
      }).toThrow(InternalServerError);
    });

    test("without unkown 'feature'", () => {
      const createdUser = {
        features: [],
      };

      expect(() => {
        authorization.can(createdUser, "unkown:feature");
      }).toThrow(InternalServerError);
    });

    test("without valid 'user' and known 'feature'", () => {
      const createdUser = {
        features: ["create:user"],
      };

      expect(authorization.can(createdUser, "create:user")).toBe(true);
    });
  });

  describe(".filterOutput()", () => {
    test("without 'user'", () => {
      expect(() => {
        authorization.filterOutput();
      }).toThrow(InternalServerError);
    });

    test("without 'user.features'", () => {
      const createdUser = {
        username: "UserWithoutFeatures",
      };

      expect(() => {
        authorization.filterOutput(createdUser);
      }).toThrow(InternalServerError);
    });

    test("without unkown 'feature'", () => {
      const createdUser = {
        features: [],
      };

      expect(() => {
        authorization.filterOutput(createdUser, "unkown:feature");
      }).toThrow(InternalServerError);
    });

    test("without valid 'user' and known 'feature' but no resource", () => {
      const createdUser = {
        features: ["read:user"],
      };

      expect(() => {
        authorization.filterOutput(createdUser, "read:user");
      }).toThrow(InternalServerError);
    });

    test("without valid 'user', known 'feature', and 'resource'", () => {
      const createdUser = {
        features: ["read:session"],
      };

      const resource = {
        id: 1,
        username: "resource",
        email: "resource:resource",
        password: "resource",
        features: ["read:user"],
        created_at: "2026-0101T00:00:00.00Z",
        updated_at: "2026-0101T00:00:00.00Z",
      };

      const result = authorization.filterOutput(
        createdUser,
        "read:user",
        resource,
      );

      expect(result).toEqual({
        id: 1,
        username: "resource",
        features: ["read:user"],
        created_at: "2026-0101T00:00:00.00Z",
        updated_at: "2026-0101T00:00:00.00Z",
      });
    });
  });
});
