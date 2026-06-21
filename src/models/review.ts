import { Schema, model, type InferSchemaType } from "mongoose";

const reviewSchema = new Schema(
  {
    propertyId: { type: Schema.Types.ObjectId, ref: "Property", required: true, index: true },
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
  },
  { timestamps: true },
);

export type Review = InferSchemaType<typeof reviewSchema>;
export const ReviewModel = model("Review", reviewSchema);
