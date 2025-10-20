import { Client } from "@elastic/elasticsearch";
import dotenv from "dotenv";
dotenv.config();

// Default to localhost if ELASTIC_NODE is not set
const elasticNode = process.env.ELASTIC_NODE || "http://localhost:9200";

// Use ES 8 client defaults (no compatibility headers needed)
const client = new Client({ node: elasticNode });
const INDEX = "emails";

// Initialize the index with mappings
export async function initIndex() {
  try {
    const exists = await client.indices.exists({ index: INDEX });
    if (!exists) {
      await client.indices.create({
        index: INDEX,
        mappings: {
          properties: {
            from: { type: "text" },
            to: { type: "text" },
            subject: { type: "text" },
            body: { type: "text" },
            date: { type: "date" },
          },
        },
      });
      console.log("Elasticsearch index created with mappings");
    } else {
      console.log("Elasticsearch index already exists");
    }
  } catch (err) {
    if (err.meta?.body?.error?.type === "resource_already_exists_exception") {
      console.log("Elasticsearch index already exists (caught in catch)");
    } else {
      console.error("Error initializing Elasticsearch index:", err);
      throw err;
    }
  }
}

// Add a single email
export async function addEmail(email) {
  try {
    await client.index({
      index: INDEX,
      document: email,
      refresh: "wait_for",
    });
    console.log("Email added to Elasticsearch");
  } catch (err) {
    console.error("Error adding email:", err);
  }
}

// Add multiple emails using bulk API
export async function bulkAddEmails(emails) {
  if (!emails.length) return;

  const body = emails.flatMap(email => [{ index: { _index: INDEX } }, email]);

  try {
    const bulkResponse = await client.bulk({ refresh: "wait_for", body });

    if (bulkResponse.errors) {
      const erroredDocuments = [];
      bulkResponse.items.forEach((action, i) => {
        const operation = Object.keys(action)[0];
        if (action[operation].error) {
          erroredDocuments.push({
            status: action[operation].status,
            error: action[operation].error,
            document: emails[i],
          });
        }
      });
      console.error("Some documents failed to index:", erroredDocuments);
    } else {
      console.log(`Successfully added ${emails.length} emails`);
    }
  } catch (err) {
    console.error("Error in bulk indexing:", err);
  }
}

// Search emails
export async function searchEmails(query) {
  try {
    const result = await client.search({
      index: INDEX,
      query: {
        multi_match: {
          query,
          fields: ["subject", "body", "from", "to"],
        },
      },
      highlight: {
        fields: {
          subject: {},
          body: {},
        },
      },
    });

    return result.hits.hits.map(hit => ({
      ...hit._source,
      highlight: hit.highlight || {},
    }));
  } catch (err) {
    console.error("Error searching emails:", err);
    return [];
  }
}
