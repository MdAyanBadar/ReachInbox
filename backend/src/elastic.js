import { Client } from "@elastic/elasticsearch";
import dotenv from "dotenv";
dotenv.config();

// Elasticsearch client
const node = process.env.ELASTIC_NODE || "http://localhost:9200";
export const esClient = new Client({ node });

const INDEX = "emails";

// Initialize index if it does not exist
export async function initIndex() {
  const exists = await esClient.indices.exists({ index: INDEX });
  if (!exists) {
    await esClient.indices.create({
      index: INDEX,
      mappings: {
        properties: {
          from: { type: "text" },
          to: { type: "text" },
          subject: { type: "text" },
          body: { type: "text" },
          folder: { type: "keyword" },       // New: folder
          account: { type: "keyword" },      // New: email account
          date: { type: "date" },
          category: { type: "keyword" },     // New: AI category
          suggestedReply: { type: "text" }   // New: AI suggested reply
        }
      }
    });
  }
}

// Add a single email document
export async function addEmail(email) {
  await esClient.index({
    index: INDEX,
    document: email,
    refresh: "wait_for"
  });
}

// Search emails with optional filters: query, folder, account, date range
export async function searchEmails({ query = "", folder, account, startDate, endDate } = {}) {
  const must = [];

  if (query) {
    must.push({
      multi_match: {
        query,
        fields: ["subject", "body", "from", "to"]
      }
    });
  }

  if (folder) {
    must.push({ term: { folder } });
  }

  if (account) {
    must.push({ term: { account } });
  }

  if (startDate || endDate) {
    must.push({
      range: {
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    });
  }

  const result = await esClient.search({
    index: INDEX,
    query: must.length ? { bool: { must } } : { match_all: {} },
    highlight: {
      fields: { subject: {}, body: {} }
    }
  });

  return result.hits.hits.map(hit => ({
    id: hit._id,
    ...hit._source,
    highlight: hit.highlight || {}
  }));
}
