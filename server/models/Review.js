import { Schema, model } from "mongoose";

const reviewSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    text: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const Review = model("Review", reviewSchema);

export default Review;
