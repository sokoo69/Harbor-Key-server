import { Schema, model } from "mongoose";

const transactionSchema = new Schema(
  {
    transactionId: { type: String, required: true, unique: true, index: true },
    propertyId: { type: Schema.Types.ObjectId, ref: "Property", required: true },
    tenantId: { type: String, required: true, index: true },
    ownerId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export const TransactionModel = model("Transaction", transactionSchema);
