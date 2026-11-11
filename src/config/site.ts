// Edit business copy and pricing here. Prices are pilot placeholders: confirm before launch.
export const plans = [
  {
    name: "Starter",
    price: "₹6,999",
    period: "/month",
    blurb: "For one café or shop testing content.",
    features: ["4 reels a month", "AI brief and shot list", "Captions and hooks", "1 round of changes per reel"],
    highlighted: false,
  },
  {
    name: "Growth",
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
    name: "Multi-location",
    price: "Let's talk",
    period: "",
    blurb: "Hotels, chains and agencies.",
    features: ["Custom reel volume", "Several creators per month", "Shared approvals for your team"],
    highlighted: false,
  },
] as const;

export const faqs = [
  {
    q: "Do creators need lots of followers?",
    a: "No. We pick creators for the quality of their work and how well they know your area. The content is made for your account, not just theirs.",
  },
  {
    q: "What if I don't like a reel?",
    a: "Leave a comment and the creator revises it. Reels you don't approve don't count toward your plan.",
  },
  {
    q: "Where does the AI come in?",
    a: "It turns your answers into a clear brief with hooks, shots and captions, plans posts around Goa's season, and sums up what performed each month. People still shoot and edit every reel.",
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
