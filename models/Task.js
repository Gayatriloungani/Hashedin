const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  task_str_id: { type: String, unique: true, required: true },
  description: { type: String, required: true },
  estimated_time_minutes: { type: Number, required: true },
  status: {
    type: String,
    enum: ["pending", "processing", "completed"],
    default: "pending",
  },
  submitted_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Task", taskSchema);
