export type CommitteeMember = {
  id: string;
  name: string;
  /** Leave unset to show the default "Trustee" label (see roleOf). */
  role?: string;
  /** Year they joined; null hides the "Since" line. */
  since: number | null;
  /** 800×800 portrait, used for the spotlight. */
  photo: string;
  /** 400×400 portrait, used for the small avatars. */
  photoSmall: string;
  /** The site's own message shown for this trustee — not a quotation of anyone else. */
  quote: string;
};

export const DEFAULT_ROLE = "Trustee";
export const roleOf = (m: CommitteeMember) => m.role ?? DEFAULT_ROLE;

// PLACEHOLDERS: name, role and since are waiting on each trustee's real
// details (photos and display order are final).
export const COMMITTEE: CommitteeMember[] = [
  {
    id: "01",
    name: "Trustee 01",
    since: null,
    photo: "/images/committee/01.webp",
    photoSmall: "/images/committee/01-400.webp",
    quote: "Think one move ahead today, and tomorrow you'll see three. Every great game starts with a calm mind.",
  },
  {
    id: "02",
    name: "Trustee 02",
    since: null,
    photo: "/images/committee/02.webp",
    photoSmall: "/images/committee/02-400.webp",
    quote: "A lost game is a lesson in disguise. Replay it, learn from it, and come back stronger.",
  },
  {
    id: "03",
    name: "Trustee 03",
    since: null,
    photo: "/images/committee/03.webp",
    photoSmall: "/images/committee/03-400.webp",
    quote: "Shake hands before and after every game. How you play matters as much as whether you win.",
  },
  {
    id: "04",
    name: "Trustee 04",
    since: null,
    photo: "/images/committee/04.webp",
    photoSmall: "/images/committee/04-400.webp",
    quote: "Patience is a quiet superpower. Look at the board twice, then make your move.",
  },
  {
    id: "05",
    name: "Trustee 05",
    since: null,
    photo: "/images/committee/05.webp",
    photoSmall: "/images/committee/05-400.webp",
    quote: "Every pawn can become a queen. Keep moving forward, one square at a time.",
  },
  {
    id: "06",
    name: "Trustee 06",
    since: null,
    photo: "/images/committee/06.webp",
    photoSmall: "/images/committee/06-400.webp",
    quote: "The board is the same for everyone. Practice and curiosity are what make the difference.",
  },
  {
    id: "07",
    name: "Trustee 07",
    since: null,
    photo: "/images/committee/07.webp",
    photoSmall: "/images/committee/07-400.webp",
    quote: "Win with grace, lose with courage, and always enjoy the game together.",
  },
];
