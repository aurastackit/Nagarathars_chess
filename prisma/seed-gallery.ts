/**
 * One-time content load for the GalleryItem table, curated from the event photographer's
 * (Alagappa Creations) public gallery at aipixture.com. Safe to re-run: it replaces the
 * entire gallery with this curated set. Run with: npx tsx prisma/seed-gallery.ts
 */
import { PrismaClient, GallerySection } from "@prisma/client";

const prisma = new PrismaClient();

const BASE = "https://aipixture.com/img/get/a/40/e/391/m/c/1165";
const TAKEN_AT = new Date("2026-01-04");

type Item = {
  dsc: string;
  title: string;
  section: GallerySection;
};

const ITEMS: Item[] = [
  // Tournament Day (18)
  { dsc: "3670", title: "Boards set up across the hall", section: "TOURNAMENT_DAY" },
  { dsc: "3880", title: "Every age welcome", section: "TOURNAMENT_DAY" },
  { dsc: "3860", title: "Deep in concentration", section: "TOURNAMENT_DAY" },
  { dsc: "3920", title: "Racing the clock", section: "TOURNAMENT_DAY" },
  { dsc: "4010", title: "A four-way showdown", section: "TOURNAMENT_DAY" },
  { dsc: "4060", title: "Mid-tournament focus", section: "TOURNAMENT_DAY" },
  { dsc: "3675", title: "A bird's-eye view of the board", section: "TOURNAMENT_DAY" },
  { dsc: "3705", title: "Players of every age at the tables", section: "TOURNAMENT_DAY" },
  { dsc: "3735", title: "Weighing the next move", section: "TOURNAMENT_DAY" },
  { dsc: "3765", title: "Four boards, four battles", section: "TOURNAMENT_DAY" },
  { dsc: "3840", title: "A full house of young players", section: "TOURNAMENT_DAY" },
  { dsc: "3850", title: "A good move gets a cheer", section: "TOURNAMENT_DAY" },
  { dsc: "3870", title: "Senior players deep in thought", section: "TOURNAMENT_DAY" },
  { dsc: "3890", title: "Two players, eyes on the board", section: "TOURNAMENT_DAY" },
  { dsc: "3900", title: "The adults' division in full swing", section: "TOURNAMENT_DAY" },
  { dsc: "3990", title: "A quiet moment between moves", section: "TOURNAMENT_DAY" },
  { dsc: "4020", title: "Five boards in play", section: "TOURNAMENT_DAY" },
  { dsc: "4040", title: "A classical duel", section: "TOURNAMENT_DAY" },

  // Young Champions (6)
  { dsc: "3655", title: "Ready to play", section: "YOUNG_CHAMPIONS" },
  { dsc: "3663", title: "All eyes on the board", section: "YOUNG_CHAMPIONS" },
  { dsc: "3725", title: "Taking it seriously", section: "YOUNG_CHAMPIONS" },
  { dsc: "3745", title: "A champion in the making", section: "YOUNG_CHAMPIONS" },
  { dsc: "3755", title: "Focused before the match", section: "YOUNG_CHAMPIONS" },
  { dsc: "4090", title: "Holding her own", section: "YOUNG_CHAMPIONS" },

  // Prize Distribution (10)
  { dsc: "4410", title: "Prize-giving on stage", section: "PRIZE_CEREMONY" },
  { dsc: "4310", title: "On stage at the closing ceremony", section: "PRIZE_CEREMONY" },
  { dsc: "4330", title: "The dignitaries look on", section: "PRIZE_CEREMONY" },
  { dsc: "4350", title: "A word from the podium", section: "PRIZE_CEREMONY" },
  { dsc: "4370", title: "First trophy of the day", section: "PRIZE_CEREMONY" },
  { dsc: "4390", title: "Certificate and trophy in hand", section: "PRIZE_CEREMONY" },
  { dsc: "4430", title: "Another champion takes the stage", section: "PRIZE_CEREMONY" },
  { dsc: "4450", title: "Applause for the winners", section: "PRIZE_CEREMONY" },
  { dsc: "4470", title: "A gift for every participant", section: "PRIZE_CEREMONY" },
  { dsc: "4490", title: "Honoured with a traditional shawl", section: "PRIZE_CEREMONY" },

  // Families & Community (9)
  { dsc: "3601", title: "A family game in progress", section: "FAMILIES_COMMUNITY" },
  { dsc: "3610", title: "Generations playing together", section: "FAMILIES_COMMUNITY" },
  { dsc: "3600", title: "The whole community around one board", section: "FAMILIES_COMMUNITY" },
  { dsc: "3960", title: "A lunch break between rounds", section: "FAMILIES_COMMUNITY" },
  { dsc: "3643", title: "Settling in before the first round", section: "FAMILIES_COMMUNITY" },
  { dsc: "3648", title: "Families arriving for the day", section: "FAMILIES_COMMUNITY" },
  { dsc: "3825", title: "Watching from the sidelines", section: "FAMILIES_COMMUNITY" },
  { dsc: "3910", title: "The crowd gathers", section: "FAMILIES_COMMUNITY" },
  { dsc: "3950", title: "Queuing up together", section: "FAMILIES_COMMUNITY" },

  // Organisers & Behind the Scenes (7)
  { dsc: "3685", title: "Organisers greeting a young player", section: "BEHIND_THE_SCENES" },
  { dsc: "3695", title: "A warm welcome from the team", section: "BEHIND_THE_SCENES" },
  { dsc: "3775", title: "Recording the results", section: "BEHIND_THE_SCENES" },
  { dsc: "3805", title: "The organising committee", section: "BEHIND_THE_SCENES" },
  { dsc: "3940", title: "Volunteers serving lunch", section: "BEHIND_THE_SCENES" },
  { dsc: "4140", title: "A few words before the ceremony begins", section: "BEHIND_THE_SCENES" },
  { dsc: "4200", title: "Keeping the programme on track", section: "BEHIND_THE_SCENES" },
];

async function main() {
  const sortOrderBySection = new Map<GallerySection, number>();

  const rows = ITEMS.map((item) => {
    const nextOrder = sortOrderBySection.get(item.section) ?? 0;
    sortOrderBySection.set(item.section, nextOrder + 10);
    return {
      url: `${BASE}/DSC_${item.dsc}.JPG`,
      caption: item.title,
      altText: item.title,
      section: item.section,
      sortOrder: nextOrder,
      takenAt: TAKEN_AT,
    };
  });

  await prisma.galleryItem.deleteMany({});
  await prisma.galleryItem.createMany({ data: rows });

  console.log(`Seeded ${rows.length} gallery items.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
