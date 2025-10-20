// frontend/src/components/EmailList.jsx
import EmailItem from "./EmailItem";

export default function EmailList({ emails }) {
  return (
    <div className="flex flex-col gap-4">
      {emails.map((email, index) => (
        <EmailItem key={index} email={email} />
      ))}
    </div>
  );
}
