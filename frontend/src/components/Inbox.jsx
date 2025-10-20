import { useState, useEffect } from "react";
import EmailItem from "./EmailItem";
import { fetchEmails } from "../api/emailApi";

export default function Inbox() {
  const [emails, setEmails] = useState([]);

  useEffect(() => {
    const loadEmails = async () => {
      const data = await fetchEmails(); // already includes AI suggestions
      setEmails(data);
    };
    loadEmails();
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {emails.map((email, i) => (
        <EmailItem key={i} email={email} />
      ))}
    </div>
  );
}
