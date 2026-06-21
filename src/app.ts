import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { authRouter } from "./routes/auth.js";
import { bookingRouter } from "./routes/bookings.js";
import { favoriteRouter } from "./routes/favorites.js";
import { paymentRouter } from "./routes/payments.js";
import { propertyRouter } from "./routes/properties.js";
import { reviewRouter } from "./routes/reviews.js";
import { adminRouter } from "./routes/admin.js";
import { ownerRouter } from "./routes/owner.js";

export const app = express();

const allowedOrigins = new Set([
  env.clientOrigin,
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("CORS blocked"));
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "property-rental-api",
  });
});

app.use("/api/auth", authRouter);
app.use("/api/properties", propertyRouter);
app.use("/api/favorites", favoriteRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/admin", adminRouter);
app.use("/api/owner", ownerRouter);
