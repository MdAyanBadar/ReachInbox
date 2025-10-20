import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import axios from "axios";
import aiRoutes from "./routes/aiRoutes.js";
import emailRoutes from "./routes/emailRoutes.js";

import { initIndex, addEmail, searchEmails, esClient } from "./elastic.js";
import { syncEmails } from "./services/imapService.js";
import { categorizeEmail, suggestReply } from "./services/aiService.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({ origin: "*" }));

// ------------------- Webhook URLs -------------------
const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK_URL;
const GENERIC_WEBHOOK = process.env.WEBHOOK_URL;

// ------------------- Notifications -------------------
async function sendSlackNotification(email) {
  if (!SLACK_WEBHOOK) return;
  try {
    await axios.post(SLACK_WEBHOOK, {
      text: `📧 New Interested Email from ${email.from}: ${email.subject}`,
    });
  } catch (err) {
    console.error("Slack notification error:", err);
  }
}

async function triggerWebhook(email) {
  if (!GENERIC_WEBHOOK) return;
  try {
    await axios.post(GENERIC_WEBHOOK, { email });
  } catch (err) {
    console.error("Webhook error:", err);
  }
}

// ------------------- Incoming Email Handling -------------------
export async function handleIncomingEmail(email) {
  try {
    email.body = email.body || "No content provided";
    email.subject = email.subject || "No subject";

    // ✅ AI Categorization & Suggested Reply
    email.category = await categorizeEmail(email);
    email.suggestedReply = await suggestReply(email);
    email.date = email.date || new Date().toISOString();

    console.log("Processed Email:", {
      from: email.from,
      subject: email.subject,
      category: email.category,
      suggestedReply: email.suggestedReply,
    });

    // Store in Elasticsearch
    await addEmail(email);

    // Notifications for Interested emails
    if (email.category === "Interested") {
      await sendSlackNotification(email);
      await triggerWebhook(email);
    }
  } catch (err) {
    console.error("Failed to process email:", err);
  }
}

// ------------------- Routes -------------------
app.get("/", (req, res) => res.json({ status: "Server is running" }));

app.get("/api/init-sync", async (req, res) => {
  try {
    await initIndex();
    res.json({ status: "Elasticsearch sync initialized successfully" });
  } catch (err) {
    console.error("Init sync failed:", err);
    res.status(500).json({ error: "Failed to initialize Elasticsearch" });
  }
});

app.post("/api/emails", async (req, res) => {
  try {
    const email = req.body || {};
    await handleIncomingEmail(email);
    res.status(201).json({
      ok: true,
      category: email.category,
      suggestedReply: email.suggestedReply,
    });
  } catch (err) {
    console.error("Add email failed:", err);
    res.status(500).json({ error: "Failed to add email" });
  }
});

app.get("/api/emails/search", async (req, res) => {
  try {
    const query = String(req.query.query || "");
    const folder = req.query.folder;
    const account = req.query.account;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    
    const results = await searchEmails({ query, folder, account, startDate, endDate });
    res.json(results);
  } catch (err) {
    console.error("Search failed:", err);
    res.status(500).json({ error: "Search failed" });
  }
});

// Reprocess emails with AI suggestions
app.post("/api/emails/reprocess-ai", async (req, res) => {
  try {
    const results = await searchEmails({ query: "" }); // Get all emails
    let processed = 0;
    
    for (const email of results) {
      if (!email.category || !email.suggestedReply || 
          email.category === "Other" || email.suggestedReply === "No suggested reply available.") {
        try {
          const aiData = await categorizeEmail(email);
          const suggestedReply = await suggestReply(email);
          
          // Update the email in Elasticsearch
          await esClient.update({
            index: "emails",
            id: email.id,
            doc: {
              category: aiData,
              suggestedReply: suggestedReply
            }
          });
          processed++;
        } catch (err) {
          console.error(`Failed to process email ${email.id}:`, err);
        }
      }
    }
    
    res.json({ 
      message: `Reprocessed ${processed} emails with AI suggestions`,
      total: results.length,
      processed 
    });
  } catch (err) {
    console.error("Reprocess failed:", err);
    res.status(500).json({ error: "Reprocess failed" });
  }
});

app.use("/api/ai", aiRoutes);

// Mount email routes at /api/emails/ai to avoid conflict with search endpoint
app.use("/api/emails/ai", emailRoutes);

// ------------------- Server & IMAP -------------------
const PORT = process.env.PORT || 3001;

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);

  // Init Elasticsearch
  try {
    await initIndex();
    console.log("✅ Elasticsearch initialized");
  } catch (err) {
    console.error("Elasticsearch init failed:", err);
  }

  // Start IMAP sync and pass handleIncomingEmail for AI processing
  try {
    await syncEmails(handleIncomingEmail);
    console.log("📬 IMAP sync started for all accounts");
  } catch (err) {
    console.error("IMAP sync failed:", err);
  }
});
