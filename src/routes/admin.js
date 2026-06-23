import { Router } from "express";
import mongoose from "mongoose";
import { BookingModel } from "../models/booking.js";
import { PropertyModel } from "../models/property.js";
import { TransactionModel } from "../models/transaction.js";
import { requireRole, verifyJWT } from "../middleware/auth.js";

export const adminRouter = Router();

adminRouter.get("/summary", verifyJWT, requireRole("admin"), async (req, res, next) => {
  try {
    const db = mongoose.connection.db;
    
    const [totalUsers, totalOwners, totalProperties, totalBookings] = await Promise.all([
      db.collection("user").countDocuments(),
      db.collection("user").countDocuments({ role: "owner" }),
      PropertyModel.countDocuments(),
      BookingModel.countDocuments()
    ]);

    // Aggregate monthly earnings from Transactions
    const earningsPipeline = [
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" }
          },
          totalAmount: { $sum: "$amount" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ];

    const earningsData = await TransactionModel.aggregate(earningsPipeline);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // Format data for Recharts
    const chartData = earningsData.map(item => ({
      label: months[item._id.month - 1],
      amount: item.totalAmount
    }));

    res.json({
      totalUsers,
      totalOwners,
      totalProperties,
      totalBookings,
      chartData
    });
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/users", verifyJWT, requireRole("admin"), async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit ?? 10), 1), 50);
    const skip = (page - 1) * limit;

    const db = mongoose.connection.db;
    const users = await db
      .collection("user")
      .find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await db.collection("user").countDocuments();
    res.json({ users, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (error) {
    next(error);
  }
});

adminRouter.patch("/users/:id/role", verifyJWT, requireRole("admin"), async (req, res, next) => {
  try {
    let queryId = req.params.id;
    try {
      queryId = new mongoose.Types.ObjectId(req.params.id);
    } catch {}

    await mongoose.connection.db.collection("user").updateOne(
      { $or: [{ _id: req.params.id }, { _id: queryId }, { id: req.params.id }] },
      { $set: { role: req.body.role } },
    );

    res.json({ message: "Role updated" });
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/properties", verifyJWT, requireRole("admin"), async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit ?? 10), 1), 50);
    const skip = (page - 1) * limit;

    const [total, properties] = await Promise.all([
      PropertyModel.countDocuments(),
      PropertyModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ]);

    res.json({ properties, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (error) {
    next(error);
  }
});

adminRouter.patch("/properties/:id/moderate", verifyJWT, requireRole("admin"), async (req, res, next) => {
  try {
    const property = await PropertyModel.findById(req.params.id);
    if (!property) {
      res.status(404).json({ message: "Property not found" });
      return;
    }

    if (req.body.status === "Rejected" && !req.body.rejectionFeedback?.trim()) {
      res.status(400).json({ message: "Rejection feedback is required when rejecting a property" });
      return;
    }

    property.status = req.body.status;
    property.rejectionFeedback = req.body.rejectionFeedback ?? "";
    await property.save();
    res.json({ property });
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/bookings", verifyJWT, requireRole("admin"), async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit ?? 10), 1), 50);
    const skip = (page - 1) * limit;

    const [total, bookings] = await Promise.all([
      BookingModel.countDocuments(),
      BookingModel.find().populate("propertyId").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ]);

    res.json({ bookings, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/transactions", verifyJWT, requireRole("admin"), async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit ?? 10), 1), 50);
    const skip = (page - 1) * limit;

    const [total, transactions] = await Promise.all([
      TransactionModel.countDocuments(),
      TransactionModel.find().populate("propertyId").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ]);

    const userIds = [...new Set(transactions.flatMap(t => [t.tenantId, t.ownerId]))].filter(Boolean);
    const objectIds = userIds.map(id => {
      try { return new mongoose.Types.ObjectId(id); } catch { return id; }
    });

    const users = await mongoose.connection.db.collection("user").find({
      $or: [ { _id: { $in: objectIds } }, { _id: { $in: userIds } }, { id: { $in: userIds } } ]
    }).toArray();
    
    const userMap = Object.fromEntries(users.map(u => [(u._id || u.id).toString(), u.name]));

    const enrichedTransactions = transactions.map(t => ({
      ...t,
      tenantName: userMap[t.tenantId] || t.tenantId,
      ownerName: userMap[t.ownerId] || t.ownerId
    }));

    res.json({ transactions: enrichedTransactions, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (error) {
    next(error);
  }
});
