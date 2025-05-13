const express = require("express");
const Task = require("../models/Task");
const router = express.Router();

// POST /tasks
router.post("/", async (req, res) => {
  const { task_str_id, description, estimated_time_minutes } = req.body;
  if (estimated_time_minutes <= 0)
    return res
      .status(400)
      .send({ message: "estimated_time_minutes must be > 0" });

  try {
    const task = new Task({ task_str_id, description, estimated_time_minutes });
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// GET /tasks/:task_str_id
router.get("/:task_str_id", async (req, res) => {
  const task = await Task.findOne({ task_str_id: req.params.task_str_id });
  if (!task) return res.status(404).send({ message: "Task not found" });
  res.json(task);
});

// PUT /tasks/:task_str_id/status
router.put("/:task_str_id/status", async (req, res) => {
  const { new_status } = req.body;
  const validStatus = ["pending", "processing", "completed"];

  if (!validStatus.includes(new_status))
    return res.status(400).send({ message: "Invalid status" });

  const task = await Task.findOne({ task_str_id: req.params.task_str_id });
  if (!task) return res.status(404).send({ message: "Task not found" });

  // Prevent status regression
  const invalidTransitions = {
    completed: ["pending", "processing"],
    processing: ["pending"],
  };

  if (invalidTransitions[task.status]?.includes(new_status)) {
    return res
      .status(400)
      .send({
        message: `Cannot change status from ${task.status} to ${new_status}`,
      });
  }

  task.status = new_status;
  await task.save();
  res.json(task);
});

// GET /tasks/next-to-process
router.get("/next-to-process", async (req, res) => {
  const task = await Task.findOne({ status: "pending" }).sort({
    estimated_time_minutes: 1,
    submitted_at: 1,
  });

  if (!task) return res.status(404).send({ message: "No pending tasks" });
  res.json(task);
});

// GET /tasks/pending
router.get("/pending", async (req, res) => {
  const sort_by =
    req.query.sort_by === "submitted_at"
      ? "submitted_at"
      : "estimated_time_minutes";
  const order = req.query.order === "desc" ? -1 : 1;
  const limit = parseInt(req.query.limit) || 10;

  const tasks = await Task.find({ status: "pending" })
    .sort({ [sort_by]: order })
    .limit(limit);

  res.json(tasks);
});

module.exports = router;
