import { useState, useEffect } from "react";
import { startSync, fetchEmails, processEmailAI } from "./api/emailApi";
import EmailList from "./components/EmailList";

export default function App() {
  const [status, setStatus] = useState("");
  const [emails, setEmails] = useState([]);
  const [query, setQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [loading, setLoading] = useState(false);

  // Normalize category from backend
  const normalizeCategory = (cat) => {
    if (!cat) return "Other";
    cat = cat.toLowerCase();
    if (cat.includes("interested")) return "Interested";
    if (cat.includes("meeting booked")) return "Meeting Booked";
    if (cat.includes("not interested")) return "Not Interested";
    if (cat.includes("spam")) return "Spam";
    if (cat.includes("out of office")) return "Out of Office";
    return "Other";
  };

  useEffect(() => {
    handleStart();
  }, []);

  const handleStart = async () => {
    setStatus("Starting sync...");
    setLoading(true);
    try {
      await startSync();
      setStatus("Sync started. Loading emails...");
      await loadEmails();
    } catch (err) {
      console.error(err);
      setStatus("Sync failed");
    }
    setLoading(false);
  };

  const loadEmails = async (searchQuery = "") => {
    setLoading(true);
    setStatus("Fetching emails...");
    try {
      const results = await fetchEmails(searchQuery);

      // Process AI suggestions for emails missing suggestedReply
      const processed = await Promise.all(
        results.map(async (email) => {
          if (!email.suggestedReply) {
            setStatus(`Processing email: "${email.subject}"...`);
            const aiData = await processEmailAI(email);
            return { ...email, ...aiData };
          }
          return email;
        })
      );

      // Normalize categories and filter only emails with suggestions
      const filtered = processed
        .map((e) => ({ ...e, category: normalizeCategory(e.category) }))
        .filter((e) => e.suggestedReply);

      setEmails(filtered);
      setStatus(`Loaded ${filtered.length} emails with suggestions`);
    } catch (err) {
      console.error(err);
      setStatus("Failed to load emails");
    }
    setLoading(false);
  };

  const handleSearch = async () => {
    await loadEmails(query);
  };

  const filteredEmails =
    filterCategory === "All"
      ? emails
      : emails.filter((email) => email.category === filterCategory);

  const categories = [
    "All",
    "Interested",
    "Meeting Booked",
    "Not Interested",
    "Spam",
    "Out of Office",
    "Other",
  ];

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex flex-col">
      {/* Controls */}
      <div className="sticky top-0 z-50 bg-indigo-50 p-4 shadow-md flex flex-col md:flex-row gap-3 md:gap-4 items-center">
        <h1 className="text-3xl md:text-4xl font-bold text-indigo-900 flex-1 text-center md:text-left">
          ReachInbox
        </h1>

        <button
          onClick={handleStart}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded shadow-md transition disabled:opacity-50 flex-shrink-0"
        >
          {loading ? "Syncing..." : "Start Sync"}
        </button>

        <input
          type="text"
          placeholder="Search emails..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="border px-3 py-2 rounded flex-1 min-w-0 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />

        <button
          onClick={handleSearch}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded shadow-md transition flex-shrink-0"
        >
          Search
        </button>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="border px-3 py-2 rounded flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Status */}
      {status && <p className="text-gray-700 p-4">{status}</p>}

      {/* Emails */}
      <div className="flex-1 overflow-auto p-4">
        {loading && (
          <div className="text-center text-indigo-700 font-semibold mt-10">
            Loading emails...
          </div>
        )}
        {!loading && filteredEmails.length === 0 && (
          <p className="text-gray-500 text-center mt-10">
            No emails with suggestions.
          </p>
        )}
        <EmailList emails={filteredEmails} />
      </div>
    </div>
  );
}
