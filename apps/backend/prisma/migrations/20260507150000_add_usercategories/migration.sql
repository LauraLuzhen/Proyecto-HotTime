-- CreateTable
CREATE TABLE "UserCategory" (
    "userId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,

    CONSTRAINT "UserCategory_pkey" PRIMARY KEY ("userId","categoryId")
);

-- Migrate existing single category assignments
INSERT INTO "UserCategory" ("userId", "categoryId")
SELECT "id", "categoryId"
FROM "User"
WHERE "categoryId" IS NOT NULL;

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_categoryId_fkey";

-- DropColumn
ALTER TABLE "User" DROP COLUMN "categoryId";

-- CreateIndex
CREATE INDEX "UserCategory_categoryId_idx" ON "UserCategory"("categoryId");

-- AddForeignKey
ALTER TABLE "UserCategory" ADD CONSTRAINT "UserCategory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCategory" ADD CONSTRAINT "UserCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
