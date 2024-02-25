const mongoose = require("mongoose");

const File = new mongoose.Schema({
  path: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  password: String,
  downloadCount: {
    type: Number,
    required: true,
    default: 0,
  },
  expiryDate: { type: Date, default: null }, // Default to null, meaning no expiration initially
  expiryTime: { type: String, default: null }, // Stored as string for human-readable format
});

module.exports = mongoose.model("File", File);
