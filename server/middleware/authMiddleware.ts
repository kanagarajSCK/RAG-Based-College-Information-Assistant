import { Request, Response, NextFunction } from "express";
import { verifyToken, TokenPayload } from "../services/authService.ts";
import { db } from "../services/db.ts";

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      message: "Authentication required. Please log in.",
    });
    return;
  }

  const token = authHeader.split(" ")[1];
  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({
      success: false,
      message: "Session expired or invalid token. Please log in again.",
    });
    return;
  }

  // Verify user still exists in DB
  const user = await db.findUserById(payload.id);
  if (!user) {
    res.status(401).json({
      success: false,
      message: "User account not found.",
    });
    return;
  }

  req.user = payload;
  next();
}

export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({
      success: false,
      message: "Forbidden. Administrator privileges required.",
    });
    return;
  }
  next();
}
