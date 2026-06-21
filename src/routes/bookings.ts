import { Router } from "express";
import { BookingModel } from "../models/booking.js";
import { PropertyModel } from "../models/property.js";
import { requireRole, verifyJWT } from "../middleware/auth.js";

export const bookingRouter = Router();

bookingRouter.get("/mine", verifyJWT, requireRole("tenant"), async (req, res, next) => {
  try {
    const bookings = await BookingModel.find({ tenantId: req.user?.userId })
      .populate("propertyId")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ bookings });
  } catch (error) {
    next(error);
  }
});

bookingRouter.get("/owner", verifyJWT, requireRole("owner"), async (req, res, next) => {
  try {
    const bookings = await BookingModel.find({ ownerId: req.user?.userId })
      .populate("propertyId")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ bookings });
  } catch (error) {
    next(error);
  }
});

bookingRouter.get("/admin", verifyJWT, requireRole("admin"), async (_req, res, next) => {
  try {
    const bookings = await BookingModel.find()
      .populate("propertyId")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ bookings });
  } catch (error) {
    next(error);
  }
});

bookingRouter.patch("/:id/status", verifyJWT, async (req, res, next) => {
  try {
    const booking = await BookingModel.findById(req.params.id);
    if (!booking) {
      res.status(404).json({ message: "Booking not found" });
      return;
    }

    const property = await PropertyModel.findById(booking.propertyId).lean();
    const canManage =
      req.user?.role === "admin" || (req.user?.role === "owner" && property?.ownerId === req.user?.userId);

    if (!canManage) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    booking.bookingStatus = req.body.status;
    await booking.save();
    res.json({ booking });
  } catch (error) {
    next(error);
  }
});
