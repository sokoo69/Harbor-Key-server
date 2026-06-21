import { Router } from "express";
import { FavoriteModel } from "../models/favorite.js";
import { PropertyModel } from "../models/property.js";
import { requireRole, verifyJWT } from "../middleware/auth.js";

export const favoriteRouter = Router();

favoriteRouter.get("/", verifyJWT, requireRole("tenant"), async (req, res, next) => {
  try {
    const favorites = await FavoriteModel.find({ tenantId: req.user?.userId })
      .populate("propertyId")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ favorites });
  } catch (error) {
    next(error);
  }
});

favoriteRouter.post("/:propertyId", verifyJWT, requireRole("tenant"), async (req, res, next) => {
  try {
    const property = await PropertyModel.findById(req.params.propertyId).lean();
    if (!property) {
      res.status(404).json({ message: "Property not found" });
      return;
    }

    const favorite = await FavoriteModel.findOneAndUpdate(
      { tenantId: req.user?.userId, propertyId: property._id },
      { $setOnInsert: { tenantId: req.user?.userId, propertyId: property._id } },
      { upsert: true, new: true },
    );

    res.status(201).json({ favorite });
  } catch (error) {
    next(error);
  }
});

favoriteRouter.delete("/:propertyId", verifyJWT, requireRole("tenant"), async (req, res, next) => {
  try {
    await FavoriteModel.deleteOne({
      tenantId: req.user?.userId,
      propertyId: req.params.propertyId,
    });

    res.json({ message: "Favorite removed" });
  } catch (error) {
    next(error);
  }
});
