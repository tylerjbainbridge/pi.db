/*
  Warnings:

  - Added the required column `featureId` to the `Rec` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Feature" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "intro" TEXT,
    "data" DATETIME,
    "guestId" TEXT NOT NULL,
    FOREIGN KEY ("guestId") REFERENCES "Guest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Rec" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "emoji" TEXT,
    "guestId" TEXT NOT NULL,
    "featureId" TEXT NOT NULL,
    FOREIGN KEY ("guestId") REFERENCES "Guest" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("featureId") REFERENCES "Feature" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Rec" ("content", "guestId", "id", "title", "url") SELECT "content", "guestId", "id", "title", "url" FROM "Rec";
DROP TABLE "Rec";
ALTER TABLE "new_Rec" RENAME TO "Rec";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
