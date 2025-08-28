// components/Loader.jsx
export default function Loader({ label = "Loading…" }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10">
      <span className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></span>
      <span className="w-3 h-3 bg-blue-500 rounded-full animate-bounce [animation-delay:-.2s]"></span>
      <span className="w-3 h-3 bg-blue-500 rounded-full animate-bounce [animation-delay:-.4s]"></span>
    </div>
  );
}
