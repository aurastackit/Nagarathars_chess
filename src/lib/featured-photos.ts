/**
 * Hand-picked real photos from the January 2026 Nagarathar's Chess Championship,
 * sourced from the event photographer's (Alagappa Creations) public gallery at
 * aipixture.com. These are proof/preview images and carry the studio's watermark —
 * swap in licensed, watermark-free originals before handover (see README §12).
 */
export type FeaturedPhoto = {
  id: string;
  src: string;
  title: string;
  caption: string;
};

const BASE = "https://aipixture.com/img/get/a/40/e/391/m/c/1165";

export const HERO_MOMENT_PHOTO: FeaturedPhoto = {
  id: "moment-prize",
  src: `${BASE}/DSC_4410.JPG`,
  title: "Prize-giving on stage",
  caption: "Nagarathar's Chess Championship 2026",
};

export const TOURNAMENTS_HEADER_PHOTO: FeaturedPhoto = {
  id: "moment-hall",
  src: `${BASE}/DSC_3670.JPG`,
  title: "Boards set up across the hall",
  caption: "Nagarathar's Chess Championship 2026",
};

export const CLASSES_HEADER_PHOTO: FeaturedPhoto = {
  id: "moment-kids",
  src: `${BASE}/DSC_3880.JPG`,
  title: "Every age welcome",
  caption: "Nagarathar's Chess Championship 2026",
};

export const FEATURED_GALLERY_PHOTOS: FeaturedPhoto[] = [
  {
    id: "moment-family",
    src: `${BASE}/DSC_3601.JPG`,
    title: "A family game in progress",
    caption: "Nagarathar's Chess Championship 2026",
  },
  {
    id: "moment-generations",
    src: `${BASE}/DSC_3610.JPG`,
    title: "Generations playing together",
    caption: "Nagarathar's Chess Championship 2026",
  },
  {
    id: "moment-floor-group",
    src: `${BASE}/DSC_3600.JPG`,
    title: "The whole community around one board",
    caption: "Nagarathar's Chess Championship 2026",
  },
  {
    id: "moment-concentration",
    src: `${BASE}/DSC_3860.JPG`,
    title: "Deep in concentration",
    caption: "Nagarathar's Chess Championship 2026",
  },
  {
    id: "moment-clock",
    src: `${BASE}/DSC_3920.JPG`,
    title: "Racing the clock",
    caption: "Nagarathar's Chess Championship 2026",
  },
  {
    id: "moment-lunch",
    src: `${BASE}/DSC_3960.JPG`,
    title: "A lunch break between rounds",
    caption: "Nagarathar's Chess Championship 2026",
  },
  {
    id: "moment-closing",
    src: `${BASE}/DSC_4310.JPG`,
    title: "On stage at the closing ceremony",
    caption: "Nagarathar's Chess Championship 2026",
  },
  {
    id: "moment-showdown",
    src: `${BASE}/DSC_4010.JPG`,
    title: "A four-way showdown",
    caption: "Nagarathar's Chess Championship 2026",
  },
  {
    id: "moment-focus",
    src: `${BASE}/DSC_4060.JPG`,
    title: "Mid-tournament focus",
    caption: "Nagarathar's Chess Championship 2026",
  },
];
