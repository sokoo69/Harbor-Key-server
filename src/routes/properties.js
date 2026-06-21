import { Router } from "express";
import mongoose from "mongoose";
import { PropertyModel } from "../models/property.js";
import { requireRole, verifyJWT } from "../middleware/auth.js";

export const propertyRouter = Router();

propertyRouter.get("/", async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit ?? 9), 1), 30);
    const skip = (page - 1) * limit;
    const search = String(req.query.search ?? "").trim();
    const location = String(req.query.location ?? search).trim();
    const propertyType = String(req.query.type ?? "").trim();
    const sort = String(req.query.sort ?? "recent");
    const minPrice = isNaN(Number(req.query.minPrice)) || req.query.minPrice === "" ? 0 : Number(req.query.minPrice);
    const maxPrice = isNaN(Number(req.query.maxPrice)) || req.query.maxPrice === "" ? Number.MAX_SAFE_INTEGER : Number(req.query.maxPrice);

    const filter = { status: "Approved" };
    if (location) filter.location = { $regex: location, $options: "i" };
    if (propertyType) filter.propertyType = propertyType;
    filter.rent = { $gte: minPrice, $lte: maxPrice };

    const sortStage =
      sort === "price-asc"
        ? { rent: 1 }
        : sort === "price-desc"
          ? { rent: -1 }
          : { createdAt: -1 };

    const [total, properties] = await Promise.all([
      PropertyModel.countDocuments(filter),
      PropertyModel.find(filter).sort(sortStage).skip(skip).limit(limit).lean(),
    ]);

    res.json({
      properties,
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    next(error);
  }
});

propertyRouter.get("/featured", async (_req, res, next) => {
  try {
    const properties = await PropertyModel.find({ status: "Approved" })
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();
    res.json({ properties });
  } catch (error) {
    next(error);
  }
});

propertyRouter.get("/:id", verifyJWT, async (req, res, next) => {
  try {
    const property = await PropertyModel.findById(req.params.id).lean();
    if (!property) {
      res.status(404).json({ message: "Property not found" });
      return;
    }

    if (
      property.status !== "Approved" &&
      req.user?.role !== "admin" &&
      req.user?.userId !== property.ownerId
    ) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    res.json({ property });
  } catch (error) {
    next(error);
  }
});

propertyRouter.post("/", verifyJWT, requireRole("owner", "admin"), async (req, res, next) => {
  try {
    if (!req.body.title || !req.body.location) {
      res.status(400).json({ message: "Title and location are required" });
      return;
    }

    const property = await PropertyModel.create({
      ...req.body,
      ownerId: req.user?.userId,
      status: req.body.status ?? "Pending",
    });

    res.status(201).json({ property });
  } catch (error) {
    next(error);
  }
});

propertyRouter.patch("/:id", verifyJWT, requireRole("owner", "admin"), async (req, res, next) => {
  try {
    const property = await PropertyModel.findById(req.params.id);
    if (!property) {
      res.status(404).json({ message: "Property not found" });
      return;
    }

    if (req.user?.role !== "admin" && property.ownerId !== req.user?.userId) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    Object.assign(property, req.body);
    await property.save();
    res.json({ property });
  } catch (error) {
    next(error);
  }
});

propertyRouter.delete("/:id", verifyJWT, requireRole("owner", "admin"), async (req, res, next) => {
  try {
    const property = await PropertyModel.findById(req.params.id);
    if (!property) {
      res.status(404).json({ message: "Property not found" });
      return;
    }

    if (req.user?.role !== "admin" && property.ownerId !== req.user?.userId) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    await property.deleteOne();
    res.json({ message: "Property deleted" });
  } catch (error) {
    next(error);
  }
});
