// Edit business copy and pricing here. Prices are pilot placeholders: confirm before launch.
export const plans = [
  {
    id: "starter",
    name: "Starter",
    priceInr: 6999,
    reels: 4,
    price: "₹6,999",
    period: "/month",
    blurb: "For one café or shop testing content.",
    features: ["4 reels a month", "AI brief and shot list", "Captions and hooks", "Revisions until you approve"],
    highlighted: false,
  },
  {
    id: "growth",
    name: "Growth",
    priceInr: 12999,
    reels: 8,
    price: "₹12,999",
    period: "/month",
    blurb: "For places that want to be seen every week.",
    features: [
      "8 reels a month",
      "Everything in Starter",
      "Seasonal content calendar",
      "Monthly “what worked” report",
    ],
    highlighted: true,
  },
  {
    id: "custom",
    name: "Multi-location",
    priceInr: null,
    reels: null,
    price: "Let's talk",
    period: "",
    blurb: "Hotels, chains and agencies.",
    features: ["Custom reel volume", "Several creators per month", "Shared approvals for your team"],
    highlighted: false,
  },
] as const;

export function planName(id: string) {
  return plans.find((p) => p.id === id)?.name ?? "No plan";
}

export const faqs = [
  {
    q: "Do creators need lots of followers?",
    a: "No. We pick creators for the quality of their work and how well they know your area. The content is made for your account, not just theirs.",
  },
  {
    q: "What if I don't like a reel?",
    a: "Leave a comment and the creator revises it until you're happy. Revisions don't use up your plan.",
  },
  {
    q: "Where does the AI come in?",
    a: "It turns your answers into a clear brief with hooks, shots and captions, plans posts around Goa's season, and sums up what performed each month. People still shoot and edit every reel.",
  },
  {
    q: "How do I pay?",
    a: "Monthly, by UPI or bank transfer. Your invoice shows in the app with a pay button, and you can cancel before the next month starts.",
  },
  {
    q: "Is this only for Goa?",
    a: "For now, yes. Starting local keeps quality high and lets us work with creators who know the area.",
  },
] as const;

export function whatsappLink(text = "Hi! I'd like to know more about CreatorLoop.") {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "");
  return number ? `https://wa.me/${number}?text=${encodeURIComponent(text)}` : null;
}

// Where payments go. Set these in the environment; without them the app shows
// invoices but no pay button.
export function upiLink(amountInr: number, note: string) {
  const id = process.env.NEXT_PUBLIC_UPI_ID?.trim();
  if (!id || !/^[\w.\-]{2,256}@[A-Za-z]{2,64}$/.test(id)) return null;
  const name = process.env.NEXT_PUBLIC_UPI_NAME?.trim() || "CreatorLoop";
  const params = new URLSearchParams({ pa: id, pn: name, am: String(amountInr), cu: "INR", tn: note.slice(0, 50) });
  return `upi://pay?${params.toString()}`;
}

export function contactEmail() {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();
  return email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ? email : null;
}
