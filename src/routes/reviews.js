import { Router } from "express";
import mongoose from "mongoose";
import { ReviewModel } from "../models/review.js";
import { requireRole, verifyJWT } from "../middleware/auth.js";

export const reviewRouter = Router();

reviewRouter.get("/featured", async (_req, res, next) => {
  try {
    const reviews = await ReviewModel.find({ rating: { $gte: 4 } })
      .sort({ createdAt: -1 })
      .limit(4)
      .lean();
    res.json({ reviews });
  } catch (error) {
    next(error);
  }
});

reviewRouter.get("/property/:propertyId", async (req, res, next) => {
  try {
    const propertyId = Array.isArray(req.params.propertyId) ? req.params.propertyId[0] : req.params.propertyId;
    const reviews = await ReviewModel.find({ propertyId: new mongoose.Types.ObjectId(propertyId) })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ reviews });
  } catch (error) {
    next(error);
  }
});

reviewRouter.post("/property/:propertyId", verifyJWT, requireRole("tenant"), async (req, res, next) => {
  try {
    if (typeof req.body.rating !== "number" || req.body.rating < 1 || req.body.rating > 5) {
      res.status(400).json({ message: "Rating must be a number between 1 and 5" });
      return;
    }

    const propertyId = Array.isArray(req.params.propertyId) ? req.params.propertyId[0] : req.params.propertyId;
    const review = await ReviewModel.create({
      propertyId: new mongoose.Types.ObjectId(propertyId),
      tenantId: req.user?.userId,
      name: req.body.name,
      email: req.body.email,
      rating: req.body.rating,
      comment: req.body.comment,
    });

    res.status(201).json({ review });
  } catch (error) {
    next(error);
  }
});
