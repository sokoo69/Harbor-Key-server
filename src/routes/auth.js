import { Router } from "express";
import { verifyJWT } from "../middleware/auth.js";

export const authRouter = Router();

authRouter.get("/me", verifyJWT, (req, res) => {
  res.json({ user: req.user });
});
