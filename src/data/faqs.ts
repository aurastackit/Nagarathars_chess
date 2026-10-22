import { CLASSES_ENABLED } from "@/lib/features";

/** Home page FAQ — rendered on the page and as FAQPage JSON-LD, which must match it word for word. */
export const FAQS = [
  {
    q: "Do I need a FIDE rating to register?",
    a: "No. Every tournament is open to non-rated players — FIDE ID and rating fields are optional on the registration form.",
  },
  {
    q: "Is there an entry fee?",
    a: "Most of our tournaments are free to enter. Where a fee applies, it's shown clearly on the tournament page before you register.",
  },
  {
    q: "How is my age category decided?",
    a: "Automatically, from the year of birth you enter when you register: Under 11, Under 19 or Above 19, based on your age in the tournament year.",
  },
  CLASSES_ENABLED
    ? {
        q: "How do online classes work?",
        a: "Classes run live online in small groups or one-on-one, from beginner fundamentals through advanced tactics. Check the Online Classes page for current schedules.",
      }
    : {
        q: "When will online classes start?",
        a: "We're preparing online coaching for beginners through advanced players. Join the list on the Online Classes page and we'll tell you as soon as dates are set.",
      },
];
