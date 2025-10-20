// backend/src/routes/emailRoutes.js
import express from "express";
import { categorizeEmail, suggestReply } from "../services/aiService.js";

const router = express.Router();

// Process a single email through AI
router.post("/ai-process", async (req, res) => {
  try {
    const email = req.body;

    // Call AI functions
    const category = await categorizeEmail(email);
    const suggestedReply = await suggestReply(email);

    // Optional: Save results to your DB here
    // await saveEmailAIData(email.id, { category, suggestedReply });

    res.json({ category, suggestedReply });
  } catch (err) {
    console.error("AI processing error:", err);
    res.status(500).json({ category: "Other", suggestedReply: "No suggested reply available." });
  }
});

export default router;
