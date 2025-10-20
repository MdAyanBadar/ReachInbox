
import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

function getOpenAI() {
  return new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
  });
}

// ------------------- Email Categorization -------------------
export async function categorizeEmail(email) {
  try {
    const client = await getOpenAI();
    const subject = email.subject || "No Subject";
    const body = email.body || "No content provided";

    const response = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are an email assistant. Categorize incoming emails into one of these: Interested, Meeting Booked, Not Interested, Spam, Out of Office, Other."
        },
        {
          role: "user",
          content: `Categorize this email:\nSubject: ${subject}\nBody: ${body}`
        }
      ],
      temperature: 0,
    });

    return response.choices?.[0]?.message?.content?.trim() || "Other";
  } catch (err) {
    console.error("AI categorization error:", err);
    return "Other";
  }
}

// ------------------- Suggested Reply -------------------
export async function suggestReply(email) {
  try {
    const client = await getOpenAI();
    const from = email.from || "Unknown sender";
    const subject = email.subject || "No Subject";
    const body = email.body || "No content provided";

    const response = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an email assistant. Suggest a polite, concise reply for this email."
        },
        {
          role: "user",
          content: `Email details:\nFrom: ${from}\nSubject: ${subject}\nBody: ${body}`
        }
      ],
      temperature: 0.7,
    });

    return response.choices?.[0]?.message?.content?.trim() || "No suggested reply available.";
  } catch (err) {
    console.error("AI reply suggestion error:", err);
    return "No suggested reply available.";
  }
}
