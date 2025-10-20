import express from "express";
import { notifySlack, notifyWebhook } from "../notifyService.js";
import { initIndex, addEmail, searchEmails } from "../elasticService.js";
import { syncEmails } from "../imapService.js";
import { categorizeEmail, suggestReply } from "../aiService.js";

const router = express.Router();

// Initialize Elasticsearch and start syncing emails
router.get("/start", async (req, res) => {
    try {
      await initIndex();
  
      syncEmails(async (email) => {
        try {
          await addEmail(email);
  
          try {
            const category = await categorizeEmail(email);
            email.category = category;
  
            const suggestedReply = await suggestReply(email);
            email.suggestedReply = suggestedReply;
          } catch (aiErr) {
            console.error("AI processing error:", aiErr);
          }
  
          try {
            await notifySlack(email);
            await notifyWebhook(email);
          } catch (notifyErr) {
            console.error("Notification error:", notifyErr);
          }
  
          console.log("Email processed:", email.subject, "| Category:", email.category || "N/A");
        } catch (emailErr) {
          console.error("Email sync callback error:", emailErr);
        }
      });
  
      res.json({ status: "Email syncing started" });
    } catch (err) {
      console.error("Failed to start syncing:", err);
      // Log the full error stack for debugging
      console.error(err.stack);
      res.status(500).json({ error: "Failed to start email syncing", details: err.message });
    }
  });
  

// Search emails
router.get("/search", async (req, res) => {
  const { q } = req.query;
  try {
    const results = await searchEmails(q || "");
    res.json(results);
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Search failed" });
  }
});

export default router;
