import http from "node:http";
const seen = [];
const sample = (props) => {
  if (props.shots) return { title: "Sunset deck prawns", concept: "Show the fry and the view.", hooks: ["a", "b", "c"], shots: [{ shot: "Pour", seconds: 3, direction: "Window light" }, { shot: "Fry", seconds: 4, direction: "Close" }], captions: ["One", "Two"], hashtags: ["#goa", "#assagao"], audio: "Laid-back acoustic", post_timing: "Friday evening", creator_notes: "Confirm opening hours." };
  if (props.weeks) return { summary: "Peak season focus.", weeks: [1, 2, 3, 4].map((n) => ({ label: `Week ${n}`, theme: "Breakfast", ideas: [{ title: "Poee sandwich", hook: "Before 9am", why_now: "Cool mornings" }, { title: "Deck view", hook: "Look up", why_now: "Clear skies" }] })) };
  if (props.headline) return { headline: "2 reels approved.", what_worked: ["Food close-ups"], to_improve: ["Log results"], next_steps: ["Shoot the deck", "Post Fridays"] };
  if (props.picks) return { picks: [{ candidate: 2, reason: "Food niche fits a café." }, { candidate: 99, reason: "Not in list" }, { candidate: 2, reason: "Duplicate" }, { candidate: 1, reason: "Applied with a relevant note." }] };
  return {};
};
http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    const json = JSON.parse(body || "{}");
    const fmt = json.output_config?.format;
    seen.push({ path: req.url, key: req.headers.authorization, model: json.model, hasSystem: typeof json.system === "string", fmt: fmt?.type, user: json.messages?.[0]?.content ?? "" });
    if (req.url === "/__seen") { res.end(JSON.stringify(seen.slice(0, -1))); return; }
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ id: "msg_test", type: "message", role: "assistant", model: json.model, stop_reason: "end_turn", stop_sequence: null, usage: { input_tokens: 10, output_tokens: 10 }, content: [{ type: "text", text: JSON.stringify(sample(fmt?.schema?.properties ?? {})) }] }));
  });
}).listen(4010);
