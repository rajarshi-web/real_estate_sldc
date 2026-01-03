const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    price: {
      type: Number,
      required: true,
    },
    location: {
      address: String,
      city: String,
      state: String,
      country: String,
    },
    propertyType: {
      type: String,
      enum: ["apartment", "house", "villa", "commercial", "land"],
      required: true,
    },
    status: {
      type: String,
      enum: ["available", "sold", "rented"],
      default: "available",
    },
    images: [String],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // agent
      required: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Property", propertySchema);
