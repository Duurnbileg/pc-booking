import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const integrationSchema = new Schema(
  {
    cafeId: {
      type: Schema.Types.ObjectId,
      ref: "Cafe",
      required: true,
      unique: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ["ICAFE_CLOUD", "MOCK"],
      default: "ICAFE_CLOUD",
      required: true,
    },
    apiKeyEncrypted: { type: String },
    cafeExternalId: { type: String },
    status: {
      type: String,
      enum: ["DISCONNECTED", "CONNECTED", "ERROR"],
      default: "DISCONNECTED",
    },
    lastSyncAt: { type: Date },
  },
  { timestamps: true, collection: "integrations" },
);

export type IntegrationDocument = InferSchemaType<typeof integrationSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Integration: Model<IntegrationDocument> =
  mongoose.models.Integration ??
  mongoose.model<IntegrationDocument>("Integration", integrationSchema);
