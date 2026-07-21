-- CreateTable
CREATE TABLE "contact_access_logs" (
    "id" TEXT NOT NULL,
    "contactRequestId" TEXT NOT NULL,
    "viewerUserId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "accessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contact_access_logs_contactRequestId_idx" ON "contact_access_logs"("contactRequestId");

-- CreateIndex
CREATE INDEX "contact_access_logs_viewerUserId_idx" ON "contact_access_logs"("viewerUserId");

-- AddForeignKey
ALTER TABLE "contact_access_logs" ADD CONSTRAINT "contact_access_logs_viewerUserId_fkey" FOREIGN KEY ("viewerUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
