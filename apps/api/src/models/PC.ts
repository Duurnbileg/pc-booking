import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import type { PcStatus } from "@pc-booking/shared";

const pcSchema = new Schema(
  {
    cafeId: {
      type: Schema.Types.ObjectId,
      ref: "Cafe",
      required: true,
      index: true,
    },
    externalId: { type: String },
    name: { type: String, required: true, trim: true },
    zone: { type: String },
    location: { type: String, default: "" },
    gear: { type: String, default: "" },
    displaySpecs: { type: String, default: "" },
    images: { type: [String], default: [] },
    hasVip: { type: Boolean, default: false },
    vipPrice: { type: Number, min: 0 },
    stagePrice: { type: Number, min: 0 },
    hallPrice: { type: Number, min: 0 },
    status: {
      type: String,
      enum: [
        "AVAILABLE",
        "IN_USE",
        "RESERVED",
        "OFFLINE",
        "MAINTENANCE",
      ] satisfies PcStatus[],
      default: "AVAILABLE",
      index: true,
    },
    specifications: {
      cpu: String,
      gpu: String,
      ram: Number,
    },
    pricePerHour: { type: Number, min: 0 },
  },
  { timestamps: true, collection: "pcs" },
);

export type PcDocument = InferSchemaType<typeof pcSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const PC: Model<PcDocument> =
  mongoose.models.PC ?? mongoose.model<PcDocument>("PC", pcSchema);
