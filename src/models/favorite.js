import { Schema, model } from "mongoose";

const favoriteSchema = new Schema(
  {
    tenantId: { type: String, required: true, index: true },
    propertyId: { type: Schema.Types.ObjectId, ref: "Property", required: true, index: true },
  },
  { timestamps: true },
);

favoriteSchema.index({ tenantId: 1, propertyId: 1 }, { unique: true });

export const FavoriteModel = model("Favorite", favoriteSchema);
