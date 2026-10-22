import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { PRIVACY_LAST_UPDATED } from "@/lib/legal";
import { CLASSES_ENABLED } from "@/lib/features";
import Link from "next/link";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy & Your Data",
  description:
    "What personal information Nagarathar's Chess Championship collects, why, who can see it, and how parents and players can have it corrected or deleted.",
  path: "/privacy",
});

const LAST_UPDATED = PRIVACY_LAST_UPDATED.toLocaleDateString("en-IN", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});

const LINK = "font-semibold text-charcoal underline underline-offset-2 hover:text-gold-ink";
const LIST = "mt-3 list-disc space-y-2 pl-5";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="h1 text-charcoal">Privacy Policy</h1>
      <p className="text-small mt-2 text-muted">Last updated {LAST_UPDATED}</p>

      <div className="text-body mt-8 space-y-10 text-foreground/80">
        <p>
          Nagarathar&apos;s Chess Championship is run by volunteers from our community. This page
          explains what personal information this website collects, why we need it, who can see it,
          and how you can ask us to correct or delete it.
        </p>

        <section>
          <h2 className="h3 text-charcoal">What we collect</h2>
          <ul className={LIST}>
            <li>
              <strong className="text-charcoal">Tournament registration:</strong> the player&apos;s
              name, year of birth, gender, email, phone number, city and address; FIDE ID and rating
              if they have one; the community details the form asks for (native place, kovil and
              pirivu, parents&apos; and grandparents&apos; names, Sangam membership); an age-proof
              document and a passport photo.
            </li>
            <li>
              <strong className="text-charcoal">Parent or guardian:</strong> for a player under 18,
              the parent or guardian&apos;s name and their consent.
            </li>
            <li>
              <strong className="text-charcoal">Payments:</strong> for paid events, the amount,
              payment status and Razorpay reference numbers. Card, UPI and bank details go straight
              to Razorpay; we never see or store them.
            </li>
            <li>
              <strong className="text-charcoal">Email verification:</strong> your email address and
              a one-time code, which we store only in scrambled (hashed) form.
            </li>
            {CLASSES_ENABLED ? (
              <li>
                <strong className="text-charcoal">Classes:</strong> name, email and phone number,
                plus a FIDE ID and message if you add them. The class waitlist takes just an email
                address and, optionally, a phone number and the level you&apos;re interested in.
              </li>
            ) : (
              <li>
                <strong className="text-charcoal">Online classes waitlist:</strong> your email
                address and, optionally, a phone number and the level you&apos;re interested in.
              </li>
            )}
            <li>
              <strong className="text-charcoal">Contact form:</strong> your name, email and message.
            </li>
          </ul>
          <p className="mt-3">
            We don&apos;t use analytics or advertising cookies; the only cookies are the sign-in
            cookies our organisers use in the admin area. To stop repeated form submissions, your IP
            address is held briefly in memory. It isn&apos;t saved to our database.
          </p>
        </section>

        <section>
          <h2 className="h3 text-charcoal">Why we use it</h2>
          {CLASSES_ENABLED ? (
            <p className="mt-3">
              To run tournaments and classes: checking which age category a player belongs in,
              confirming entries, taking payment for paid events, contacting you about an event or
              class, publishing results, and answering your messages. We don&apos;t sell your
              information or use it for advertising.
            </p>
          ) : (
            <p className="mt-3">
              To run tournaments: checking which age category a player belongs in, confirming
              entries, taking payment for paid events, contacting you about an event, publishing
              results, and answering your messages — and to tell waitlist members when online
              classes open. We don&apos;t sell your information or use it for advertising.
            </p>
          )}
        </section>

        <section>
          <h2 className="h3 text-charcoal">Children</h2>
          <p className="mt-3">
            Many of our players are under 18. For them, the registration form asks for a parent or
            guardian&apos;s name and consent, and we only use the child&apos;s details on that
            basis. We don&apos;t track children&apos;s activity online or show them advertising.
          </p>
        </section>

        <section>
          <h2 className="h3 text-charcoal">What is public</h2>
          <ul className={LIST}>
            <li>
              Tournament results and pairings, which show players&apos; names and scores, and a page
              for each player listing the tournaments they played, their age category and results.
            </li>
            <li>Photos and videos from our events, in the gallery.</li>
          </ul>
          <p className="mt-3">
            Age-proof documents and passport photos are never public. They&apos;re kept in a private
            storage bucket that only our organisers can open. If you&apos;d like a photo, video or
            result of you or your child taken down,{" "}
            <Link href="/contact" className={LINK}>
              contact us
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="h3 text-charcoal">Who else handles it</h2>
          <p className="mt-3">
            A few service providers run parts of this website for us and handle your information
            only on our behalf:
          </p>
          <ul className={LIST}>
            <li>Supabase, our database</li>
            <li>Amazon Web Services, for hosting, private file storage and sending emails</li>
            <li>Razorpay, for payments to paid events</li>
          </ul>
          <p className="mt-3">
            Gallery videos play from YouTube or Google Drive. The player only loads when you press
            play, and from then on their own privacy policies apply.
          </p>
        </section>

        <section>
          <h2 className="h3 text-charcoal">How long we keep it</h2>
          <p className="mt-3">
            We keep registration details only as long as we need them to run this and future
            Nagarathar&apos;s Chess events, for example to keep results and age categories accurate.
            You can ask us to delete your information at any time.
          </p>
        </section>

        <section>
          <h2 className="h3 text-charcoal">Your rights</h2>
          <p className="mt-3">
            Under India&apos;s Digital Personal Data Protection Act, 2023, you can ask us to:
          </p>
          <ul className={LIST}>
            <li>
              tell you what personal information we hold about you and who we&apos;ve shared it with
            </li>
            <li>correct, complete or update it</li>
            <li>delete it</li>
            <li>
              stop using it, by withdrawing your consent (this doesn&apos;t undo anything we did
              before you withdrew it)
            </li>
          </ul>
          <p className="mt-3">
            You can also nominate someone to exercise these rights for you if you die or become
            unable to act for yourself. A parent or guardian can make any of these requests for
            their child.
          </p>
          <p className="mt-3">
            To make a request or a complaint,{" "}
            <Link href="/contact" className={LINK}>
              send us a message
            </Link>
            . If you&apos;re not satisfied with our reply, you can complain to the Data Protection
            Board of India.
          </p>
        </section>

        <section>
          <h2 className="h3 text-charcoal">Changes to this policy</h2>
          <p className="mt-3">
            If we change this policy, we&apos;ll update this page and the date at the top.
          </p>
        </section>
      </div>
    </main>
  );
}
