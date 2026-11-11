import {
  ArrowRight,
  CalendarDays,
  Check,
  ClipboardList,
  MessageCircle,
  Sparkles,
  Clapperboard,
  BarChart3,
  Store,
} from "lucide-react";
import { ButtonLink, Logo, cn } from "@/components/ui";
import { HeroPhone, Reveal } from "@/components/landing/motion";
import { faqs, plans, whatsappLink } from "@/config/site";

export default function Home() {
  const wa = whatsappLink();

  return (
    <div className="overflow-x-clip">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        <nav className="flex items-center gap-1 sm:gap-2">
          <a href="#how" className="hidden rounded-full px-4 py-2 text-sm text-ink-700 hover:bg-sand-100 sm:inline">
            How it works
          </a>
          <a href="#pricing" className="hidden rounded-full px-4 py-2 text-sm text-ink-700 hover:bg-sand-100 sm:inline">
            Pricing
          </a>
          <ButtonLink href="/login" variant="ghost" className="px-4 py-2">
            Log in
          </ButtonLink>
          <ButtonLink href="/signup" className="px-4 py-2">
            Get started
          </ButtonLink>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-8 md:grid-cols-[1.15fr_1fr] md:pt-16">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 -top-20 -z-10 size-[520px] rounded-full bg-sunset-400/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -left-40 -z-10 size-[420px] rounded-full bg-sea-500/10 blur-3xl"
        />
        <Reveal>
          <p className="inline-flex items-center gap-2 rounded-full border border-ink-950/10 bg-white/70 px-3 py-1 text-xs font-medium text-ink-700">
            <span className="size-1.5 rounded-full bg-palm-500" /> Now onboarding Goa businesses
          </p>
          <h1 className="mt-5 font-display text-5xl leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
            Local creators.
            <br />
            <em className="text-sunset-500">Real customers.</em>
          </h1>
          <p className="mt-5 max-w-lg text-lg text-ink-700">
            CreatorLoop gets your café, restaurant, hotel or shop a steady stream of reels made by creators who
            know Goa. Answer five questions, approve what you like, and post.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/signup?as=business" variant="accent">
              I run a business <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
            <ButtonLink href="/signup?as=creator" variant="outline">
              I&apos;m a creator
            </ButtonLink>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-500">
            {["Revisions until it's right", "No long contracts", "Works on any phone"].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <Check className="size-4 text-palm-500" aria-hidden /> {t}
              </li>
            ))}
          </ul>
        </Reveal>
        <div className="relative">
          <HeroPhone />
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-y border-ink-950/5 bg-white py-20">
        <div className="mx-auto max-w-6xl px-5">
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-wider text-sunset-500">How it works</p>
            <h2 className="mt-2 max-w-2xl font-display text-4xl leading-tight sm:text-5xl">
              From “we should post more” to a reel on your feed.
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                Icon: ClipboardList,
                title: "Tell us about your place",
                body: "Five quick questions: what you sell, who comes in, what you want more of.",
              },
              {
                Icon: Sparkles,
                title: "Get a ready-to-shoot brief",
                body: "AI writes the hooks, shot list and captions. A local creator picks it up and shoots.",
              },
              {
                Icon: Check,
                title: "Approve and post",
                body: "Review on your phone, ask for changes, approve. Nothing goes live without your OK.",
              },
            ].map(({ Icon, title, body }, i) => (
              <Reveal key={title} delay={i * 0.08}>
                <div className="h-full rounded-[var(--radius-card)] border border-ink-950/8 bg-sand-50 p-6">
                  <div className="flex items-center justify-between">
                    <Icon className="size-6 text-sunset-500" aria-hidden />
                    <span className="font-display text-3xl text-ink-500/40">0{i + 1}</span>
                  </div>
                  <h3 className="mt-6 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-ink-500">{body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Two sides */}
      <section className="mx-auto grid max-w-6xl gap-6 px-5 py-20 md:grid-cols-2">
        <Reveal>
          <div className="h-full rounded-[var(--radius-card)] bg-ink-950 p-8 text-sand-50">
            <Store className="size-7 text-sunset-400" aria-hidden />
            <h2 className="mt-5 font-display text-4xl">For businesses</h2>
            <p className="mt-2 text-sand-200/70">Content that looks like Goa, not like a stock ad.</p>
            <ul className="mt-6 space-y-3">
              {[
                "A steady posting rhythm without hiring an agency",
                "Creators matched to your area and style",
                "Every reel in one place, approved from your phone",
                "A plain-language monthly report on what worked",
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <Check className="mt-0.5 size-5 shrink-0 text-sunset-400" aria-hidden /> {t}
                </li>
              ))}
            </ul>
            <ButtonLink href="/signup?as=business" variant="accent" className="mt-8">
              Start as a business
            </ButtonLink>
          </div>
        </Reveal>
        <Reveal delay={0.08}>
          <div className="h-full rounded-[var(--radius-card)] border border-ink-950/8 bg-white p-8">
            <Clapperboard className="size-7 text-sea-500" aria-hidden />
            <h2 className="mt-5 font-display text-4xl">For creators</h2>
            <p className="mt-2 text-ink-500">500 followers and a great eye? You can earn here.</p>
            <ul className="mt-6 space-y-3">
              {[
                "Paid briefs from local businesses",
                "Clear shot lists, so no guesswork",
                "Upload, get feedback, get approved",
                "Track every payout in one place",
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <Check className="mt-0.5 size-5 shrink-0 text-sea-500" aria-hidden /> {t}
                </li>
              ))}
            </ul>
            <ButtonLink href="/signup?as=creator" className="mt-8">
              Join as a creator
            </ButtonLink>
          </div>
        </Reveal>
      </section>

      {/* AI */}
      <section className="bg-sand-100 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-wider text-sunset-500">AI that does the busywork</p>
            <h2 className="mt-2 max-w-2xl font-display text-4xl leading-tight sm:text-5xl">
              People make the reels. AI handles everything around them.
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { Icon: Sparkles, title: "Brief writer", body: "Your answers become hooks, shots and captions." },
              { Icon: CalendarDays, title: "Season planner", body: "Posts timed for peak season, festivals and events." },
              { Icon: Clapperboard, title: "Creator matching", body: "The right creator for your area, niche and budget." },
              { Icon: BarChart3, title: "Monthly report", body: "What worked, what didn't, what to post next." },
            ].map(({ Icon, title, body }, i) => (
              <Reveal key={title} delay={i * 0.06}>
                <div className="h-full rounded-2xl bg-white p-5">
                  <Icon className="size-5 text-sunset-500" aria-hidden />
                  <h3 className="mt-4 font-semibold">{title}</h3>
                  <p className="mt-1 text-sm text-ink-500">{body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl px-5 py-20">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-wider text-sunset-500">Pricing</p>
          <h2 className="mt-2 font-display text-4xl leading-tight sm:text-5xl">Simple monthly plans.</h2>
          <p className="mt-2 text-ink-500">Creators join free. Businesses pay monthly and can cancel anytime.</p>
        </Reveal>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {plans.map((p, i) => (
            <Reveal key={p.name} delay={i * 0.06}>
              <div
                className={cn(
                  "flex h-full flex-col rounded-[var(--radius-card)] p-7",
                  p.highlighted ? "bg-ink-950 text-sand-50 shadow-xl" : "border border-ink-950/8 bg-white",
                )}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{p.name}</h3>
                  {p.highlighted ? (
                    <span className="rounded-full bg-sunset-500 px-2.5 py-0.5 text-xs font-medium text-white">
                      Most popular
                    </span>
                  ) : null}
                </div>
                <p className="mt-4">
                  <span className="font-display text-5xl">{p.price}</span>
                  <span className={p.highlighted ? "text-sand-200/70" : "text-ink-500"}>{p.period}</span>
                </p>
                <p className={cn("mt-2 text-sm", p.highlighted ? "text-sand-200/70" : "text-ink-500")}>{p.blurb}</p>
                <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2.5">
                      <Check
                        className={cn("mt-0.5 size-4 shrink-0", p.highlighted ? "text-sunset-400" : "text-palm-500")}
                        aria-hidden
                      />
                      {f}
                    </li>
                  ))}
                </ul>
                <ButtonLink
                  href="/signup?as=business"
                  variant={p.highlighted ? "accent" : "outline"}
                  className="mt-8 w-full"
                >
                  {p.price === "Let's talk" ? "Get in touch" : `Choose ${p.name}`}
                </ButtonLink>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-ink-950/5 bg-white py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 md:grid-cols-[1fr_1.4fr]">
          <Reveal>
            <h2 className="font-display text-4xl leading-tight sm:text-5xl">Questions</h2>
            <p className="mt-2 text-ink-500">Anything else, just message us.</p>
          </Reveal>
          <div className="divide-y divide-ink-950/8">
            {faqs.map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                  {f.q}
                  <span className="text-xl text-ink-500 transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-ink-500">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-5 py-20">
        <Reveal>
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-sunset-500 px-8 py-14 text-white sm:px-14">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-white/15 blur-2xl"
            />
            <h2 className="max-w-xl font-display text-4xl leading-tight sm:text-5xl">
              Your first reel could be live next week.
            </h2>
            <p className="mt-3 max-w-lg text-white/85">
              Sign up in a minute. We&apos;ll help you write your first brief.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/signup?as=business" className="bg-ink-950 hover:bg-ink-900">
                Get started <ArrowRight className="size-4" aria-hidden />
              </ButtonLink>
              {wa ? (
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-3 text-sm font-medium text-white hover:bg-white/25"
                >
                  <MessageCircle className="size-4" aria-hidden /> Chat on WhatsApp
                </a>
              ) : null}
            </div>
          </div>
        </Reveal>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-5 pb-10 text-sm text-ink-500 sm:flex-row sm:items-center">
        <Logo className="text-ink-950" />
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <a href="/terms" className="hover:text-ink-950">
            Terms
          </a>
          <a href="/privacy" className="hover:text-ink-950">
            Privacy
          </a>
          <span>Made in Goa · © CreatorLoop</span>
        </p>
      </footer>
    </div>
  );
}
