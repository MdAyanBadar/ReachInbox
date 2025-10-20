import express from "express";
import { categorizeEmail, suggestReply } from "../services/aiService.js";

const router = express.Router();

router.post("/analyze-email", async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ ok: false, error: "Missing email content" });
    }

    const email = { subject: "AI Analysis", body: content };
    const category = await categorizeEmail(email);
    const suggestedReply = await suggestReply(email);

    res.json({ ok: true, category, suggestedReply });
  } catch (err) {
    console.error("AI API error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});


export default router;
