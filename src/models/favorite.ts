import { Schema, model, type InferSchemaType } from "mongoose";

const favoriteSchema = new Schema(
  {
    tenantId: { type: String, required: true, index: true },
    propertyId: { type: Schema.Types.ObjectId, ref: "Property", required: true, index: true },
  },
  { timestamps: true },
);

favoriteSchema.index({ tenantId: 1, propertyId: 1 }, { unique: true });

export type Favorite = InferSchemaType<typeof favoriteSchema>;
export const FavoriteModel = model("Favorite", favoriteSchema);
