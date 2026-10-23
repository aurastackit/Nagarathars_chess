import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { PRIVACY_LAST_UPDATED } from "@/lib/legal";
import { CLASSES_ENABLED } from "@/lib/features";
import { ageProofRetentionDays } from "@/lib/retention";
import { PLAYER_SESSION_HOURS } from "@/lib/player-token";
import Link from "next/link";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy & Your Data",
  description:
    "What personal information Nagarathar's Chess Championship collects, why, who can see it, how long we keep it, and how to ask us to delete it.",
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
  const ageProofDays = ageProofRetentionDays();
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="h1 text-charcoal">Privacy Policy</h1>
      <p className="text-small mt-2 text-muted">Last updated {LAST_UPDATED}</p>

      <div className="text-body mt-8 space-y-10 text-foreground/80">
        <p>
          Nagarathar&apos;s Chess Championship is run by volunteers from our community. This page
          explains, in plain words, what information we collect, why, who can see it, how long we
          keep it and how you can ask us to delete it.
        </p>

        <section>
          <h2 className="h3 text-charcoal">What we collect</h2>
          <ul className={LIST}>
            <li>
              <strong className="text-charcoal">When you register for a tournament:</strong> the
              player&apos;s name, year of birth, gender, email, phone number, city and address; FIDE
              ID and rating if they have one; and the community details the form asks for (native
              place, kovil and pirivu, parents&apos; and grandparents&apos; names, Sangam
              membership).
            </li>
            <li>
              <strong className="text-charcoal">Two documents:</strong> an age proof (Aadhaar, birth
              certificate or school ID) and a passport photo. Please hide all but the last 4 digits
              of an Aadhaar number before you upload it.
            </li>
            <li>
              <strong className="text-charcoal">For players under 18:</strong> the parent or
              guardian&apos;s name and their consent.
            </li>
            <li>
              <strong className="text-charcoal">Payments:</strong> for paid events, the amount,
              whether it was paid and Razorpay&apos;s reference numbers. Card, UPI and bank details
              go straight to Razorpay. We never see or store them.
            </li>
            <li>
              <strong className="text-charcoal">Email codes:</strong> when you check your email with
              a 6-digit code, we keep the code only in scrambled form, and it stops working after 10
              minutes.
            </li>
            {CLASSES_ENABLED ? (
              <li>
                <strong className="text-charcoal">Classes:</strong> name, email and phone number,
                plus a FIDE ID and message if you add them. The class waitlist takes just an email
                address and, if you like, a phone number and the level you&apos;re interested in.
              </li>
            ) : (
              <li>
                <strong className="text-charcoal">Online classes waitlist:</strong> your email
                address and, if you like, a phone number and the level you&apos;re interested in.
              </li>
            )}
            <li>
              <strong className="text-charcoal">Contact form:</strong> your name, email and message.
            </li>
          </ul>
          <p className="mt-3">
            To stop people sending the same form again and again, your IP address is held briefly in
            memory. It isn&apos;t saved to our database.
          </p>
        </section>

        <section>
          <h2 className="h3 text-charcoal">Why we need it</h2>
          <ul className={LIST}>
            <li>The age proof lets us check which age category a player belongs in.</li>
            <li>The passport photo goes on the player&apos;s ID card for the tournament.</li>
            <li>
              Contact details let us confirm the entry and tell you about the event, for example if
              the date changes.
            </li>
            <li>The other details help us run fair tournaments and publish correct results.</li>
            {CLASSES_ENABLED ? (
              <li>Class details let us arrange classes and keep in touch with you about them.</li>
            ) : (
              <li>The waitlist lets us tell you when online classes open.</li>
            )}
          </ul>
          <p className="mt-3">We don&apos;t sell your information or use it for advertising.</p>
        </section>

        <section>
          <h2 className="h3 text-charcoal">Who can see it</h2>
          <ul className={LIST}>
            <li>
              <strong className="text-charcoal">Our organisers</strong> (signed in to the admin
              area) see registrations so they can review and confirm them.
            </li>
            <li>
              <strong className="text-charcoal">Only organisers can open an age proof</strong>, and
              every time one is opened we record who opened it and when. Age proofs are never put in
              emails, spreadsheets we download or ID cards.
            </li>
            <li>
              <strong className="text-charcoal">You</strong> can see and update your own
              registration on{" "}
              <Link href="/my-registration" className={LINK}>
                My registration
              </Link>
              , after entering a code we email to you.
            </li>
            <li>
              <strong className="text-charcoal">Everyone</strong> can see tournament results and
              pairings (players&apos; names and scores), a page for each player listing the
              tournaments they played with their age category and results, and photos and videos
              from our events in the gallery.
            </li>
            <li>
              <strong className="text-charcoal">At the venue</strong>, anyone who scans the QR code
              on an ID card sees the player&apos;s name, photo, category, registration number and
              whether their entry is confirmed.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="h3 text-charcoal">How we protect your documents</h2>
          <ul className={LIST}>
            <li>
              Photos and age proofs are stored in private storage with no public access. There is no
              public web address for any of them.
            </li>
            <li>
              When an organiser opens one, the website creates a link that stops working after 2
              minutes.
            </li>
            <li>
              We check every upload is a real image or PDF, both on your device and again on our
              server.
            </li>
            <li>
              If you replace a document, or a registration is deleted, the old files are deleted
              too.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="h3 text-charcoal">How long we keep it</h2>
          <ul className={LIST}>
            <li>
              <strong className="text-charcoal">Age proofs:</strong> deleted automatically{" "}
              {ageProofDays} days after the tournament ends. We only need them to check age
              categories.
            </li>
            <li>
              <strong className="text-charcoal">Passport photos and registration details:</strong>{" "}
              kept so we can run future events and keep results and age categories accurate, until
              you ask us to delete them.
            </li>
            <li>
              <strong className="text-charcoal">Email codes:</strong> stop working after 10 minutes.
            </li>
            <li>
              <strong className="text-charcoal">Messages and waitlist entries:</strong> kept until
              you ask us to delete them.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="h3 text-charcoal">Cookies</h2>
          <p className="mt-3">
            We don&apos;t use analytics or advertising cookies. We use only two kinds of sign-in
            cookie:
          </p>
          <ul className={LIST}>
            <li>
              When you enter an email code, a cookie keeps this browser signed in to My registration
              and lets it finish the registration form. It lasts {PLAYER_SESSION_HOURS} hours, or
              until you sign out.
            </li>
            <li>Our organisers&apos; sign-in to the admin area.</li>
          </ul>
        </section>

        <section>
          <h2 className="h3 text-charcoal">Children</h2>
          <p className="mt-3">
            Many of our players are under 18. For them, the registration form asks for a parent or
            guardian&apos;s name and consent, and we only use the child&apos;s details on that
            basis. We don&apos;t track children online or show them advertising. A parent or
            guardian can make any of the requests below for their child.
          </p>
        </section>

        <section>
          <h2 className="h3 text-charcoal">Your rights</h2>
          <p className="mt-3">
            Under India&apos;s Digital Personal Data Protection Act, 2023, you can ask us to:
          </p>
          <ul className={LIST}>
            <li>tell you what information we hold about you and who we&apos;ve shared it with</li>
            <li>correct, complete or update it</li>
            <li>delete it</li>
            <li>
              stop using it, by withdrawing your consent (this doesn&apos;t undo anything we did
              before)
            </li>
          </ul>
          <p className="mt-3">
            You can also name someone to make these requests for you if you die or can&apos;t act
            for yourself.
          </p>
        </section>

        <section>
          <h2 className="h3 text-charcoal">How to ask us to delete your information</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5">
            <li>
              Send us a message on the{" "}
              <Link href="/contact" className={LINK}>
                Contact page
              </Link>{" "}
              from the email address you registered with.
            </li>
            <li>
              Tell us the player&apos;s name and the tournament (or the registration number), and
              what you&apos;d like deleted — for example the whole registration, just the photo, or
              a result or gallery photo.
            </li>
            <li>
              We&apos;ll check the request really comes from you, delete the information, and reply
              to tell you it&apos;s done.
            </li>
          </ol>
          <p className="mt-3">
            To fix a mistake instead, you can update a registration yourself on{" "}
            <Link href="/my-registration" className={LINK}>
              My registration
            </Link>{" "}
            until it&apos;s confirmed. If you&apos;re not happy with our reply to any request or
            complaint, you can complain to the Data Protection Board of India.
          </p>
        </section>

        <section>
          <h2 className="h3 text-charcoal">Companies that help us</h2>
          <p className="mt-3">
            These service providers run parts of this website for us. They handle your information
            only on our behalf:
          </p>
          <ul className={LIST}>
            <li>Supabase, our database</li>
            <li>Amazon Web Services, for hosting, private file storage and sending emails</li>
            <li>Razorpay, for payments to paid events</li>
          </ul>
          <p className="mt-3">
            Gallery videos play from YouTube or Google Drive. The video player only loads when you
            press play, and from then on their own privacy policies apply.
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
