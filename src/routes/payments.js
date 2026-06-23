import { Router } from "express";
import Stripe from "stripe";
import mongoose from "mongoose";
import { env } from "../config/env.js";
import { BookingModel } from "../models/booking.js";
import { PropertyModel } from "../models/property.js";
import { TransactionModel } from "../models/transaction.js";
import { requireRole, verifyJWT } from "../middleware/auth.js";

export const paymentRouter = Router();

const stripe = env.stripeSecretKey
  ? new Stripe(env.stripeSecretKey)
  : null;

paymentRouter.post("/checkout", verifyJWT, requireRole("tenant"), async (req, res, next) => {
  try {
    if (!stripe) {
      res.status(500).json({ message: "Stripe is not configured" });
      return;
    }

    const property = await PropertyModel.findById(req.body.propertyId).lean();
    if (!property) {
      res.status(404).json({ message: "Property not found" });
      return;
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${env.clientOrigin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.clientOrigin}/properties/${property._id}`,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: property.title,
              description: property.location,
            },
            unit_amount: Math.round(Number(property.rent) * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        propertyId: String(property._id ?? ""),
        ownerId:    String(property.ownerId ?? ""),
        tenantId:   String(req.user?.userId ?? req.user?.id ?? ""),
        moveInDate: String(req.body.moveInDate ?? ""),
        contactNumber: String(req.body.contactNumber ?? ""),
        additionalNotes: String(req.body.additionalNotes ?? ""),
        amount:     String(property.rent ?? 0),
      },
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.log("[CHECKOUT ERROR]", error?.message, error?.type, error?.code);
    next(error);
  }
});

paymentRouter.post("/confirm", verifyJWT, requireRole("tenant"), async (req, res, next) => {
  try {
    if (!stripe) {
      res.status(500).json({ message: "Stripe is not configured" });
      return;
    }

    const checkoutSession = await stripe.checkout.sessions.retrieve(req.body.sessionId);
    if (checkoutSession.payment_status !== "paid") {
      res.status(400).json({ message: "Payment not completed" });
      return;
    }

    const metadata = checkoutSession.metadata;
    const transactionId = checkoutSession.id;

    const existingTransaction = await TransactionModel.findOne({ transactionId }).lean();
    if (existingTransaction) {
      res.json({ ok: true, transactionId, finalized: true });
      return;
    }

    const property = await PropertyModel.findById(metadata?.propertyId).lean();
    if (!property) {
      res.status(404).json({ message: "Property not found" });
      return;
    }

    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      await BookingModel.create(
        [
          {
            propertyId: property._id,
            tenantId: String(metadata?.tenantId),
            ownerId: String(metadata?.ownerId),
            moveInDate: String(metadata?.moveInDate),
            contactNumber: String(metadata?.contactNumber),
            additionalNotes: String(metadata?.additionalNotes ?? ""),
            amount: Number(metadata?.amount ?? property.rent),
            bookingStatus: "Pending",
            paymentStatus: "Paid",
            transactionId,
          },
        ],
        { session },
      );

      await TransactionModel.create(
        [
          {
            transactionId,
            propertyId: property._id,
            tenantId: String(metadata?.tenantId),
            ownerId: String(metadata?.ownerId),
            amount: Number(metadata?.amount ?? property.rent),
            date: new Date(),
          },
        ],
        { session },
      );
    });

    session.endSession();
    res.json({ ok: true, transactionId });
  } catch (error) {
    next(error);
  }
});
