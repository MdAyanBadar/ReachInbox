import dotenv from "dotenv";
dotenv.config(); // must run before anything else

import { categorizeEmail, suggestReply } from "./services/aiService.js";

console.log("Loaded key prefix:", process.env.OPENAI_API_KEY?.slice(0, 5) || "undefined");

async function testAI() {
  const email = {
    from: "user@example.com",
    subject: "Meeting tomorrow",
    body: "Hey, just confirming our meeting schedule for tomorrow.",
  };

  const category = await categorizeEmail(email);
  console.log("Category:", category);

  const reply = await suggestReply(email);
  console.log("Suggested Reply:", reply);
}

testAI();
