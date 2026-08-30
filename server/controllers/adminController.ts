import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware.ts";
import { db } from "../services/db.ts";

export async function getAdminStats(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const stats = await db.getAdminStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (err: any) {
    console.error("[Admin] getAdminStats error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve administrative analytics.",
    });
  }
}
