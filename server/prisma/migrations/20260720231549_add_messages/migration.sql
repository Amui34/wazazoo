-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "contactRequestId" TEXT NOT NULL,
    "senderUserId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "messages_contactRequestId_idx" ON "messages"("contactRequestId");

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_contactRequestId_fkey" FOREIGN KEY ("contactRequestId") REFERENCES "contact_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
