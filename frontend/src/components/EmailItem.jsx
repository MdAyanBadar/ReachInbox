// frontend/src/components/EmailItem.jsx
import { useState } from "react";

export default function EmailItem({ email }) {
  const [copied, setCopied] = useState(false);

  const handleCopyReply = () => {
    if (!email.suggestedReply) return;

    navigator.clipboard.writeText(email.suggestedReply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const category = email.category || "Uncategorized";
  const suggestedReply = email.suggestedReply || "No suggested reply available.";

  const categoryStyles = {
    "Interested": "bg-green-100 text-green-700",
    "Meeting Booked": "bg-blue-100 text-blue-700",
    "Not Interested": "bg-red-100 text-red-700",
    "Spam": "bg-gray-100 text-gray-700",
    "Out of Office": "bg-yellow-100 text-yellow-700",
    "Uncategorized": "bg-indigo-100 text-indigo-700",
    "Other": "bg-indigo-200 text-indigo-800"
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-indigo-100 rounded-2xl p-5 shadow-md hover:shadow-xl transition-shadow duration-300 max-w-full break-words relative">
      <div className="flex flex-col gap-2 text-gray-800">
        <p className="text-sm truncate">
          <span className="font-semibold text-indigo-700">From:</span> {email.from || "Unknown"}
        </p>

        <p className="text-lg font-bold text-indigo-900 truncate">{email.subject || "No Subject"}</p>

        <p className="text-gray-700 mt-1 leading-relaxed break-words whitespace-pre-wrap max-h-40 overflow-y-auto">
          {email.body || "No content available."}
        </p>

        <span className={`inline-block mt-3 text-xs px-3 py-1 rounded-full w-fit ${categoryStyles[category] || categoryStyles["Uncategorized"]}`}>
          {category}
        </span>

        <div className="mt-3 bg-white border border-indigo-100 rounded-xl p-3 max-h-32 overflow-y-auto relative">
          <p className="text-sm text-gray-700">
            <strong className="text-indigo-700">Suggested Reply:</strong> {suggestedReply}
          </p>
          {email.suggestedReply && (
            <button
              onClick={handleCopyReply}
              className="absolute top-3 right-3 bg-indigo-500 hover:bg-indigo-600 text-white px-2 py-1 rounded text-xs transition"
            >
              Copy
            </button>
          )}
        </div>

        {email.date && (
          <p className="text-xs text-gray-500 mt-3">
            {new Date(email.date).toLocaleString()}
          </p>
        )}
      </div>

      {copied && (
        <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded shadow-md animate-fade-in-out">
          Copied to clipboard!
        </div>
      )}
    </div>
  );
}
