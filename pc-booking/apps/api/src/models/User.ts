import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import type { UserRole } from "@pc-booking/shared";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["CUSTOMER", "CAFE_OWNER", "ADMIN"] satisfies UserRole[],
      default: "CUSTOMER",
      required: true,
    },
  },
  { timestamps: true },
);

export type UserDocument = InferSchemaType<typeof userSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const User: Model<UserDocument> =
  mongoose.models.User ?? mongoose.model<UserDocument>("User", userSchema);
