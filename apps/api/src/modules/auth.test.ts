import { signAccess, verifyAccess } from "../lib/jwt";
import { Role } from "@maquis/shared";

describe("JWT helpers", () => {
  it("signe et vérifie un token d'accès", () => {
    const token = signAccess("user-001", Role.ADMIN);
    const payload = verifyAccess(token);
    expect(payload.sub).toBe("user-001");
    expect(payload.role).toBe(Role.ADMIN);
    expect(payload.type).toBe("access");
  });

  it("lève une erreur pour un token invalide", () => {
    expect(() => verifyAccess("token.invalide.xxx")).toThrow();
  });
});
