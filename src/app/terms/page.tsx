import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal";

export const metadata: Metadata = { title: "Terms of Service" };

// Plain-language draft. Have it reviewed by a lawyer before a wide public launch.
export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="11 November 2026">
      <LegalSection title="What CreatorLoop does">
        <p>CreatorLoop connects businesses in Goa with local creators who make short videos (&quot;reels&quot;) for them. Businesses describe what they need, creators shoot and upload, and businesses approve the result.</p>
      </LegalSection>
      <LegalSection title="Accounts">
        <ul>
          <li>You must be 18 or older and give accurate information.</li>
          <li>Keep your password private. You are responsible for what happens in your account.</li>
          <li>One business per account.</li>
        </ul>
      </LegalSection>
      <LegalSection title="For businesses">
        <ul>
          <li>Plans are monthly and include a set number of reels. Unused reels do not carry over.</li>
          <li>You pay by UPI or bank transfer against the invoice shown in the app. Sending briefs to creators needs an active plan.</li>
          <li>Your monthly allowance is used when you send a brief to creators, one for each reel the brief asks for. Changes to a reel are included until you approve it.</li>
          <li>You can cancel before the next month starts. Fees for a month already started are not refunded once work has begun.</li>
          <li>Once you approve a reel and your invoice is paid, you may post it on your own channels.</li>
          <li>Make sure anything you ask a creator to film is yours to show, and that people who appear have agreed.</li>
        </ul>
      </LegalSection>
      <LegalSection title="For creators">
        <ul>
          <li>Joining is free. You are an independent creator, not our employee.</li>
          <li>The pay for a brief is shown when you are assigned. You are paid after the business approves the required reels.</li>
          <li>Upload only your own work. Do not use music, footage or images you do not have the right to use.</li>
          <li>When a reel is approved and paid for, the business may use it on its channels. You may show it in your portfolio unless the business asks you not to.</li>
        </ul>
      </LegalSection>
      <LegalSection title="AI-written content">
        <p>Briefs, content plans, reports and creator suggestions are written with AI. They can be wrong. Check details such as prices, offers and opening hours before you rely on or publish them.</p>
      </LegalSection>
      <LegalSection title="What is not allowed">
        <ul>
          <li>Illegal, hateful, sexual or misleading content, or content that infringes someone else&apos;s rights.</li>
          <li>Taking a brief or a creator found here off the platform to avoid fees during an active brief.</li>
          <li>Trying to access other people&apos;s data or disrupt the service.</li>
        </ul>
        <p>We may remove content or suspend accounts that break these rules.</p>
      </LegalSection>
      <LegalSection title="Our responsibility">
        <p>We work to keep the service reliable but provide it as it is. We do not promise specific results such as views, followers or sales. To the extent the law allows, our liability is limited to the fees you paid us in the three months before a claim.</p>
      </LegalSection>
      <LegalSection title="Changes and law">
        <p>We may update these terms and will tell you in the app when we do. These terms are governed by the laws of India, and the courts of Goa have jurisdiction.</p>
      </LegalSection>
    </LegalPage>
  );
}
