import { Schema, model, type InferSchemaType } from "mongoose";

const ownerInfoSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    image: { type: String, default: "" },
    role: { type: String, default: "owner" },
  },
  { _id: false },
);

const propertySchema = new Schema(
  {
    title: { type: String, required: true, index: true },
    description: { type: String, required: true },
    location: { type: String, required: true, index: true },
    propertyType: { type: String, required: true, index: true },
    rent: { type: Number, required: true },
    rentType: { type: String, required: true },
    bedrooms: { type: Number, required: true },
    bathrooms: { type: Number, required: true },
    size: { type: String, required: true },
    amenities: [{ type: String }],
    images: [{ type: String }],
    extraFeatures: [{ type: String }],
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
      index: true,
    },
    rejectionFeedback: { type: String, default: "" },
    ownerId: { type: String, required: true, index: true },
    ownerInfo: { type: ownerInfoSchema, required: true },
  },
  { timestamps: true },
);

propertySchema.index({ status: 1, location: 1, propertyType: 1, rent: 1 });

export type Property = InferSchemaType<typeof propertySchema>;
export const PropertyModel = model("Property", propertySchema);
