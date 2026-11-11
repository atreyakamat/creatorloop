import { ButtonLink, Logo } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-sand-50 px-5 text-center">
      <div>
        <Logo className="justify-center" />
        <h1 className="mt-8 font-display text-5xl">We can&apos;t find that page</h1>
        <p className="mt-3 text-ink-500">It may have moved, or you may not have access to it.</p>
        <ButtonLink href="/dashboard" className="mt-8">
          Go to your dashboard
        </ButtonLink>
      </div>
    </main>
  );
}
