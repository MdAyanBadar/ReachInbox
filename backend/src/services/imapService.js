// imapService.js
import { ImapFlow } from "imapflow";
import { Client as ESClient } from "@elastic/elasticsearch";
import axios from "axios";
import { handleIncomingEmail } from "../index.js"; // use the centralized email handler

const accounts = [
  { user: process.env.EMAIL_1_USER, pass: process.env.EMAIL_1_PASS },
  { user: process.env.EMAIL_2_USER, pass: process.env.EMAIL_2_PASS },
];

export async function syncEmails() {
  for (const acc of accounts) {
    const client = new ImapFlow({
      host: "imap.gmail.com",
      port: 993,
      secure: true,
      auth: { user: acc.user, pass: acc.pass },
    });

    client.on("error", (err) => console.error("IMAP error", err));
    await client.connect();
    await client.mailboxOpen("INBOX");

    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - 30); // last 30 days

    // Fetch existing emails
    const uids = await client.search({ since: sinceDate });
    if (uids && uids.length) {
      for await (const msg of client.fetch(uids, { envelope: true, source: true })) {
        const email = {
          from: msg.envelope.from?.[0]?.address || "",
          subject: msg.envelope.subject || "No Subject",
          body: msg.source?.toString() || "No content",
          folder: "INBOX",
          account: acc.user,
          date: msg.envelope.date || new Date().toISOString(),
        };

        // Send to centralized handler
        await handleIncomingEmail(email);
      }
    }

    // Listen for new emails
    client.on("exists", async () => {
      const newUids = await client.search({ unseen: true });
      if (newUids && newUids.length) {
        for await (const msg of client.fetch(newUids, { envelope: true, source: true })) {
          const email = {
            from: msg.envelope.from?.[0]?.address || "",
            subject: msg.envelope.subject || "No Subject",
            body: msg.source?.toString() || "No content",
            folder: "INBOX",
            account: acc.user,
            date: msg.envelope.date || new Date().toISOString(),
          };

          await handleIncomingEmail(email);
        }
      }
    });

    console.log(`IMAP connected and idling for ${acc.user}`);
    // client stays connected for real-time IDLE
  }
}
