import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import type { CafeStatus } from "@pc-booking/shared";

const openingHoursSchema = new Schema(
  {
    day: { type: Number, required: true, min: 0, max: 6 },
    open: { type: String, required: true },
    close: { type: String, required: true },
    closed: { type: Boolean, default: false },
  },
  { _id: false },
);

const cafeSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, default: "" },
    address: { type: String, required: true },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [106.917, 47.918],
      },
    },
    phone: { type: String, required: true },
    images: { type: [String], default: [] },
    gear: { type: String, default: "" },
    displaySpecs: { type: String, default: "" },
    totalPcs: { type: Number, min: 0, default: 0 },
    openingHours: { type: [openingHoursSchema], default: [] },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "SUSPENDED"] satisfies CafeStatus[],
      default: "PENDING",
      index: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    pricePerHour: { type: Number, required: true, min: 0 },
  },
  { timestamps: true, collection: "cafes" },
);

cafeSchema.index({ location: "2dsphere" });
cafeSchema.index({ name: "text", description: "text", address: "text" });

export type CafeDocument = InferSchemaType<typeof cafeSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Cafe: Model<CafeDocument> =
  mongoose.models.Cafe ?? mongoose.model<CafeDocument>("Cafe", cafeSchema);
