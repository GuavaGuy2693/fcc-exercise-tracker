require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI);

// ===== SCHEMAS =====

const exerciseSchema = new mongoose.Schema({
    userId: String,
    description: String,
    duration: Number,
    date: Date,
});

const userSchema = new mongoose.Schema({
    username: String,
});

const User = mongoose.model("User", userSchema);
const Exercise = mongoose.model("Exercise", exerciseSchema);

// ===== ROUTES =====

// Create user
app.post("/api/users", async (req, res) => {
    const user = new User({ username: req.body.username });
    await user.save();

    res.json({
        username: user.username,
        _id: user._id,
    });
});

// Get all users
app.get("/api/users", async (req, res) => {
    const users = await User.find();
    res.json(users);
});

// Add exercise
app.post("/api/users/:_id/exercises", async (req, res) => {
    const { description, duration, date } = req.body;
    const user = await User.findById(req.params._id);

    if (!user) return res.json({ error: "User not found" });

    const exerciseDate = date ? new Date(date) : new Date();

    const exercise = new Exercise({
        userId: user._id,
        description,
        duration: Number(duration),
        date: exerciseDate,
    });

    await exercise.save();

    res.json({
        _id: user._id,
        username: user.username,
        description,
        duration: Number(duration),
        date: exerciseDate.toDateString(),
    });
});

// Get logs
app.get("/api/users/:_id/logs", async (req, res) => {
    const { from, to, limit } = req.query;
    const user = await User.findById(req.params._id);

    if (!user) return res.json({ error: "User not found" });

    let filter = { userId: user._id };

    if (from || to) {
        filter.date = {};
        if (from) filter.date.$gte = new Date(from);
        if (to) filter.date.$lte = new Date(to);
    }

    let query = Exercise.find(filter).sort({ date: 1 });

    if (limit) query = query.limit(Number(limit));

    const exercises = await query;

    const log = exercises.map((e) => ({
        description: e.description,
        duration: e.duration,
        date: e.date.toDateString(),
    }));

    res.json({
        _id: user._id,
        username: user.username,
        count: log.length,
        log,
    });
});

// ===== START SERVER =====

const listener = app.listen(process.env.PORT || 3000, () => {
    console.log("Server running...");
});
