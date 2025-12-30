import mongoose from "mongoose";

const analyticsSchema = new mongoose.Schema(
  {
    shortId: {
      type: String,
      required: true,
      index: true,
    },
    source: {
      type: String, // redis | mongodb
      required: true,
    },
    timestamp: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

const Analytics = mongoose.model("Analytics", analyticsSchema);

export default Analytics;
