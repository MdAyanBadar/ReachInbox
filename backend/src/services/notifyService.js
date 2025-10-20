import { IncomingWebhook } from "@slack/webhook";
import axios from "axios";

const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
const webhookUrl = process.env.WEBHOOK_URL;

export async function notifySlack(email) {
  if (!slackWebhookUrl) return console.error("Slack Webhook URL missing");

  try {
    const slack = new IncomingWebhook(slackWebhookUrl);
    await slack.send({
      text: `New Interested Email:\nFrom: ${email.from}\nSubject: ${email.subject}\nBody: ${email.body}`,
    });
    console.log("Slack notification sent");
  } catch (err) {
    console.error("Slack error:", err);
  }
}

export async function notifyWebhook(email) {
  if (!webhookUrl) return console.error("Webhook URL missing");

  try {
    await axios.post(webhookUrl, email);
    console.log("Webhook notification sent");
  } catch (err) {
    console.error("Webhook error:", err);
  }
}
