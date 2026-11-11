const messages: Record<string, string> = {
  not_configured: "AI writing isn't available right now. Nothing was lost, so please try again later.",
  limit: "You've reached today's AI limit. Try again tomorrow.",
  failed: "The AI couldn't finish just now. Nothing was lost, so try again in a moment.",
  no_data: "No reels were delivered in this month, so there's nothing to report on yet.",
};

export function AiNotice({ code }: { code?: string }) {
  if (!code || !messages[code]) return null;
  return (
    <p role="alert" className="mt-6 rounded-xl bg-sunset-500/10 px-4 py-3 text-sm text-sunset-600">
      {messages[code]}
    </p>
  );
}
