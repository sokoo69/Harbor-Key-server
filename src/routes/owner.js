import { Router } from "express";
import { BookingModel } from "../models/booking.js";
import { PropertyModel } from "../models/property.js";
import { TransactionModel } from "../models/transaction.js";
import { requireRole, verifyJWT } from "../middleware/auth.js";

export const ownerRouter = Router();

ownerRouter.get("/properties", verifyJWT, requireRole("owner"), async (req, res, next) => {
  try {
    const properties = await PropertyModel.find({ ownerId: req.user?.userId }).sort({ createdAt: -1 }).lean();
    res.json({ properties });
  } catch (error) {
    next(error);
  }
});

ownerRouter.get("/summary", verifyJWT, requireRole("owner"), async (req, res, next) => {
  try {
    const [properties, bookings, earnings] = await Promise.all([
      PropertyModel.countDocuments({ ownerId: req.user?.userId }),
      BookingModel.countDocuments({ ownerId: req.user?.userId, bookingStatus: { $ne: "Rejected" } }),
      TransactionModel.aggregate([
        { $match: { ownerId: req.user?.userId } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    res.json({
      totalProperties: properties,
      totalBookings: bookings,
      totalEarnings: earnings[0]?.total ?? 0,
    });
  } catch (error) {
    next(error);
  }
});

ownerRouter.get("/monthly-earnings", verifyJWT, requireRole("owner"), async (req, res, next) => {
  try {
    const now = new Date();
    const months = Array.from({ length: 12 }, (_, index) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - index), 1);
      return {
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        label: d.toLocaleString("en-US", { month: "short" }),
        amount: 0,
      };
    });

    const transactions = await TransactionModel.aggregate([
      { $match: { ownerId: req.user?.userId, date: { $gte: new Date(now.getFullYear(), now.getMonth() - 11, 1) } } },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
          },
          amount: { $sum: "$amount" },
        },
      },
    ]);

    const byKey = new Map(
      transactions.map((entry) => [
        `${entry._id.year}-${String(entry._id.month).padStart(2, "0")}`,
        entry.amount,
      ]),
    );

    const data = months.map((month) => ({
      ...month,
      amount: byKey.get(month.key) ?? 0,
    }));

    res.json({ data });
  } catch (error) {
    next(error);
  }
});
