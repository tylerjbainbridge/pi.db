/*
  Warnings:

  - You are about to drop the column `guestId` on the `Feature` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "_FeatureToGuest" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    FOREIGN KEY ("A") REFERENCES "Feature" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("B") REFERENCES "Guest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Feature" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "intro" TEXT,
    "data" DATETIME
);
INSERT INTO "new_Feature" ("data", "id", "intro", "title", "url") SELECT "data", "id", "intro", "title", "url" FROM "Feature";
DROP TABLE "Feature";
ALTER TABLE "new_Feature" RENAME TO "Feature";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "_FeatureToGuest_AB_unique" ON "_FeatureToGuest"("A", "B");

-- CreateIndex
CREATE INDEX "_FeatureToGuest_B_index" ON "_FeatureToGuest"("B");
