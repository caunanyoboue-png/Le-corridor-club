import jwt from "jsonwebtoken";
import { Role } from "@maquis/shared";

export interface JwtPayload {
  sub: string;
  role: Role;
  type: "access" | "refresh";
}

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? "dev_access_secret";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? "dev_refresh_secret";
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES_IN ?? "8h";
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN ?? "30d";

export function signAccess(userId: string, role: Role): string {
  return jwt.sign({ sub: userId, role, type: "access" }, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRES,
  } as jwt.SignOptions);
}

export function signRefresh(userId: string, role: Role): string {
  return jwt.sign({ sub: userId, role, type: "refresh" }, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES,
  } as jwt.SignOptions);
}

export function verifyAccess(token: string): JwtPayload {
  return jwt.verify(token, ACCESS_SECRET) as JwtPayload;
}

export function verifyRefresh(token: string): JwtPayload {
  return jwt.verify(token, REFRESH_SECRET) as JwtPayload;
}
