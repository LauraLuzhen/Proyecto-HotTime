-- CreateEnum
CREATE TYPE "CommunicationType" AS ENUM ('GENERAL', 'REQUEST_DAYS', 'VACATION', 'ABSENCE', 'TEMP_LEAVE', 'PERM_LEAVE', 'STAFF_SHORTAGE');

-- CreateTable
CREATE TABLE "Communication" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "content" TEXT NOT NULL,
    "type" "CommunicationType" NOT NULL,
    "senderId" INTEGER NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Communication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunicationUser" (
    "id" SERIAL NOT NULL,
    "communicationId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunicationUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommunicationUser_userId_read_idx" ON "CommunicationUser"("userId", "read");

-- CreateIndex
CREATE UNIQUE INDEX "CommunicationUser_communicationId_userId_key" ON "CommunicationUser"("communicationId", "userId");

-- AddForeignKey
ALTER TABLE "Communication" ADD CONSTRAINT "Communication_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Communication" ADD CONSTRAINT "Communication_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationUser" ADD CONSTRAINT "CommunicationUser_communicationId_fkey" FOREIGN KEY ("communicationId") REFERENCES "Communication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationUser" ADD CONSTRAINT "CommunicationUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
