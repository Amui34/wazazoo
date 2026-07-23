-- CreateTable
CREATE TABLE "live_spots" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "live_spots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "live_spots_profileId_key" ON "live_spots"("profileId");

-- CreateIndex
CREATE INDEX "live_spots_endsAt_idx" ON "live_spots"("endsAt");

-- AddForeignKey
ALTER TABLE "live_spots" ADD CONSTRAINT "live_spots_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
