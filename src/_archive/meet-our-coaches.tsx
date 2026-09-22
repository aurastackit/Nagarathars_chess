// Archived from the homepage. To restore: import { MeetOurCoachesSection } from
// "@/_archive/meet-our-coaches" and render it inside src/app/page.tsx where the
// "Meet Our Coaches" section used to sit (between "Programs By Level"/"Online
// Tutoring & Classes" and "Tournament Formats").
import { Reveal } from "@/components/reveal";
import { ProfileGrid, type Profile } from "@/components/profile-modal";

export const COACHES: Profile[] = [
  {
    id: "coach-arun",
    name: "Coach Arun",
    role: "Head Coach — Beginner & Group Classes",
    initials: "CA",
    bio: "Leads our beginner fundamentals program, covering piece movement, basic tactics, and opening principles for first-time players.",
    facts: [
      { label: "FIDE Rating", value: "1850" },
      { label: "Experience", value: "6+ years" },
      { label: "Specialty", value: "Beginners" },
    ],
    highlights: [
      "Trained 100+ first-time players from zero chess knowledge",
      "Runs the Tue–Fri group fundamentals track",
      "Also available for 1-on-1 beginner sessions",
    ],
  },
  {
    id: "coach-priya",
    name: "Coach Priya",
    role: "Intermediate Tactics Coach",
    initials: "CP",
    bio: "Works with intermediate players on tactics, middle-game strategy, and endgame technique.",
    facts: [
      { label: "FIDE Rating", value: "2010" },
      { label: "Experience", value: "8+ years" },
      { label: "Specialty", value: "Tactics" },
    ],
    highlights: [
      "Focuses on pattern recognition and calculation drills",
      "Helps players bridge from casual to competitive play",
      "Weekend 1-on-1 sessions available",
    ],
  },
  {
    id: "coach-karthik",
    name: "Coach Karthik",
    role: "Advanced Tournament Prep",
    initials: "CK",
    bio: "Prepares competitive players for tournaments with database-driven analysis and personalized improvement plans.",
    facts: [
      { label: "FIDE Rating", value: "2150" },
      { label: "Experience", value: "10+ years" },
      { label: "Specialty", value: "Tournament prep" },
    ],
    highlights: [
      "Builds personalized opening repertoires with players",
      "Reviews tournament games move-by-move afterward",
      "Works closely with players ahead of state-level events",
    ],
  },
  {
    id: "coach-meena",
    name: "Coach Meena",
    role: "Youth & Kids Coach",
    initials: "CM",
    bio: "Specializes in introducing young children to chess through games, puzzles, and simple rule-based lessons.",
    facts: [
      { label: "FIDE Rating", value: "1720" },
      { label: "Experience", value: "5+ years" },
      { label: "Specialty", value: "Kids" },
    ],
    highlights: [
      "Uses puzzle-based, game-first teaching for young kids",
      "Keeps sessions short and engaging for shorter attention spans",
      "Popular with first-time parents new to chess",
    ],
  },
  {
    id: "coach-suresh",
    name: "Coach Suresh",
    role: "Endgame Specialist",
    initials: "CS",
    bio: "Focuses on endgame studies and technique, helping players convert small advantages into full points.",
    facts: [
      { label: "FIDE Rating", value: "1980" },
      { label: "Experience", value: "7+ years" },
      { label: "Specialty", value: "Endgames" },
    ],
    highlights: [
      "Runs weekly endgame study sessions",
      "Known for turning drawn positions into wins",
      "Sunday morning slots available",
    ],
  },
];

export function MeetOurCoachesSection() {
  return (
    <section className="chess-pattern-light bg-background py-16">
      <div className="mx-auto max-w-6xl px-4">
        <Reveal className="text-center">
          <h2 className="text-2xl font-bold text-charcoal">Meet Our Coaches</h2>
          <p className="mx-auto mt-2 max-w-xl text-foreground/60">
            Click a coach to see their background. The instructors behind our online classes.
          </p>
        </Reveal>
        <ProfileGrid profiles={COACHES} layout="circle-side" />
      </div>
    </section>
  );
}
