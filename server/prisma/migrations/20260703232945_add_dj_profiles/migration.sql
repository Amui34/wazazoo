-- AlterEnum
ALTER TYPE "ProfileType" ADD VALUE 'DJ';

-- CreateTable
CREATE TABLE "dj_profiles" (
    "profileId" TEXT NOT NULL,
    "equipmentNotes" TEXT,

    CONSTRAINT "dj_profiles_pkey" PRIMARY KEY ("profileId")
);

-- CreateTable
CREATE TABLE "dj_styles" (
    "djProfileId" TEXT NOT NULL,
    "styleId" TEXT NOT NULL,

    CONSTRAINT "dj_styles_pkey" PRIMARY KEY ("djProfileId","styleId")
);

-- AddForeignKey
ALTER TABLE "dj_profiles" ADD CONSTRAINT "dj_profiles_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dj_styles" ADD CONSTRAINT "dj_styles_djProfileId_fkey" FOREIGN KEY ("djProfileId") REFERENCES "dj_profiles"("profileId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dj_styles" ADD CONSTRAINT "dj_styles_styleId_fkey" FOREIGN KEY ("styleId") REFERENCES "musical_styles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
