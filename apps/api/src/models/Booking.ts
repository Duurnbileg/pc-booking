import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import type { BookingStatus, SeatZone } from "@pc-booking/shared";

const bookedSeatSchema = new Schema(
  {
    seatId: { type: String, required: true },
    label: { type: String, required: true },
    zone: { type: String, enum: ["hall", "vip"] satisfies SeatZone[], required: true },
  },
  { _id: false },
);

const bookingSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    cafeId: { type: Schema.Types.ObjectId, ref: "Cafe", required: true },
    seats: { type: [bookedSeatSchema], required: true },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    hours: { type: Number, required: true, min: 1 },
    totalPrice: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["CONFIRMED", "CANCELLED"] satisfies BookingStatus[],
      default: "CONFIRMED",
      required: true,
    },
  },
  { timestamps: true },
);

bookingSchema.index({ cafeId: 1, startAt: 1, endAt: 1 });

export type BookingDocument = InferSchemaType<typeof bookingSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Booking: Model<BookingDocument> =
  mongoose.models.Booking ?? mongoose.model<BookingDocument>("Booking", bookingSchema);
