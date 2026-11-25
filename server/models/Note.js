const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, default: "" },
  },
  { timestamps: true }, // adds createdAt and updatedAt automatically
);

module.exports = mongoose.model("Note", noteSchema);
