import { Request, Response } from "express";
import { db } from "../services/db.ts";
import { hashPassword, comparePassword, generateToken } from "../services/authService.ts";
import { AuthenticatedRequest } from "../middleware/authMiddleware.ts";
import { User } from "../models/types.ts";

export async function signup(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password, role = "student" } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        message: "Please provide your name, college email address, and password.",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        message: "Please provide a valid email format.",
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
      return;
    }

    const existing = await db.findUserByEmail(email);
    if (existing) {
      res.status(409).json({
        success: false,
        message: "An account with this email address already exists. Please log in.",
      });
      return;
    }

    const passwordHash = await hashPassword(password);
    const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newUser: User = {
      id,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role: role === "admin" ? "admin" : "student",
      createdAt: now,
      updatedAt: now,
    };

    await db.createUser(newUser);
    const token = generateToken(newUser);

    const { passwordHash: _, ...safeUser } = newUser;

    res.status(201).json({
      success: true,
      message: "Account created successfully.",
      data: {
        user: safeUser,
        token,
      },
    });
  } catch (err: any) {
    console.error("[Auth] Signup error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error during registration.",
    });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
      return;
    }

    const user = await db.findUserByEmail(email);
    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password. Please verify your credentials.",
      });
      return;
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password. Please verify your credentials.",
      });
      return;
    }

    const token = generateToken(user);
    const { passwordHash: _, ...safeUser } = user;

    res.json({
      success: true,
      message: "Login successful.",
      data: {
        user: safeUser,
        token,
      },
    });
  } catch (err: any) {
    console.error("[Auth] Login error:", err);
    res.status(500).json({
      success: false,
      message: "An unexpected error occurred during authentication.",
    });
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized." });
      return;
    }

    const user = await db.findUserById(req.user.id);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found." });
      return;
    }

    const { passwordHash: _, ...safeUser } = user;
    res.json({
      success: true,
      data: { user: safeUser },
    });
  } catch (err: any) {
    console.error("[Auth] getMe error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch user profile." });
  }
}

export function logout(req: Request, res: Response): void {
  res.json({
    success: true,
    message: "Logged out successfully.",
  });
}
