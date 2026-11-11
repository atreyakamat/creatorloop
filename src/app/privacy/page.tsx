import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal";

export const metadata: Metadata = { title: "Privacy Policy" };

// Plain-language draft. Have it reviewed by a lawyer before a wide public launch.
export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="11 November 2026">
      <LegalSection title="What we collect">
        <ul>
          <li>Account details: your name, email, password (stored encrypted by our login provider) and, if you add it, your WhatsApp number.</li>
          <li>Businesses: your business name, type, area, Instagram handle, what you tell us about your business, your briefs, your feedback on reels, and any results you log.</li>
          <li>Creators: your display name, bio, niches, Instagram handle, follower count, rate and portfolio links, your applications, the videos you upload, and your payouts.</li>
          <li>Plan, invoice and payout records. We do not collect or store card or bank details.</li>
        </ul>
      </LegalSection>
      <LegalSection title="How we use it">
        <ul>
          <li>To run the service: writing briefs, matching creators with businesses, delivering and reviewing reels, and keeping payment records.</li>
          <li>To contact you about your account, briefs and payments.</li>
          <li>We do not sell your data and we do not use it for advertising.</li>
        </ul>
      </LegalSection>
      <LegalSection title="Who can see what">
        <ul>
          <li>A business sees only its own briefs, reels, invoices and reports, and the public profile of the creator assigned to its brief.</li>
          <li>A creator sees open briefs (business name, type, area and the brief), their own work and their own payouts.</li>
          <li>Our admin can see everything needed to run the service, including phone numbers, to coordinate work.</li>
          <li>Uploaded videos are private. They are shown only to the creator, the business that owns the brief and our admin.</li>
        </ul>
      </LegalSection>
      <LegalSection title="Services we rely on">
        <ul>
          <li>Supabase stores accounts, data and videos.</li>
          <li>Netlify hosts the website.</li>
          <li>Anthropic provides the AI that writes briefs, plans, reports and creator suggestions. We send it business details and brief answers, and creators&apos; niches, bios, follower counts and rates. We do not send names of people, emails, phone numbers, Instagram handles or videos.</li>
        </ul>
      </LegalSection>
      <LegalSection title="How long we keep it">
        <p>We keep your data while your account is active. Payment records are kept as long as the law requires. Ask us to delete your account and we will remove your profile and content that we are not required to keep.</p>
      </LegalSection>
      <LegalSection title="Your choices">
        <p>You can edit your profile in the app at any time. To get a copy of your data, correct it or delete your account, contact us and we will respond within 30 days.</p>
      </LegalSection>
      <LegalSection title="Cookies">
        <p>We use only the cookies needed to keep you signed in. We do not use advertising or tracking cookies.</p>
      </LegalSection>
    </LegalPage>
  );
}
