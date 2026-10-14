-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "VideoProvider" AS ENUM ('NONE', 'YOUTUBE', 'DRIVE', 'S3');

-- CreateEnum
CREATE TYPE "GallerySection" AS ENUM ('TOURNAMENT_DAY', 'YOUNG_CHAMPIONS', 'PRIZE_CEREMONY', 'FAMILIES_COMMUNITY', 'BEHIND_THE_SCENES', 'CLASSES', 'HIGHLIGHTS');

-- CreateTable
CREATE TABLE "GalleryItem" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mediaType" "MediaType" NOT NULL DEFAULT 'IMAGE',
    "videoProvider" "VideoProvider" NOT NULL DEFAULT 'NONE',
    "thumbnailUrl" TEXT,
    "caption" TEXT,
    "altText" TEXT,
    "section" "GallerySection" NOT NULL DEFAULT 'TOURNAMENT_DAY',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "takenAt" TIMESTAMP(3),
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "tournamentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GalleryItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GalleryItem_section_sortOrder_idx" ON "GalleryItem"("section", "sortOrder");

-- AddForeignKey
ALTER TABLE "GalleryItem" ADD CONSTRAINT "GalleryItem_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Enable Row Level Security
ALTER TABLE "public"."GalleryItem" ENABLE ROW LEVEL SECURITY;
