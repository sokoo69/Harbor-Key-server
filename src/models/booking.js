import { Schema, model } from "mongoose";

const bookingSchema = new Schema(
  {
    propertyId: { type: Schema.Types.ObjectId, ref: "Property", required: true },
    tenantId: { type: String, required: true, index: true },
    ownerId: { type: String, required: true, index: true },
    moveInDate: { type: String, required: true },
    contactNumber: { type: String, required: true },
    additionalNotes: { type: String, default: "" },
    amount: { type: Number, required: true },
    bookingStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed"],
      default: "Pending",
    },
    transactionId: { type: String, default: "", index: true },
  },
  { timestamps: true },
);

bookingSchema.index({ tenantId: 1, createdAt: -1 });
bookingSchema.index({ ownerId: 1, bookingStatus: 1 });

export const BookingModel = model("Booking", bookingSchema);
