const BASE_URL = "http://localhost:3001/api";

// Fetch emails from backend (already includes category & suggestedReply)
export async function fetchEmails(query = "") {
  try {
    const res = await fetch(`${BASE_URL}/emails/search?query=${encodeURIComponent(query)}`);
    const data = await res.json();
    return data; // should include category & suggestedReply
  } catch (err) {
    console.error("Fetch emails error:", err);
    return [];
  }
}

// Start sync
export async function startSync() {
  try {
    const res = await fetch(`${BASE_URL}/init-sync`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Sync error:", err);
    return { status: "Failed to start sync" };
  }
}
export async function processEmailAI(email) {
    try {
      const res = await fetch(`${BASE_URL}/emails/ai-process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(email),
      });
      const data = await res.json();
      return data; // { category, suggestedReply }
    } catch (err) {
      console.error("AI processing error:", err);
      return { category: "Other", suggestedReply: "No suggested reply available." };
    }
  }
  