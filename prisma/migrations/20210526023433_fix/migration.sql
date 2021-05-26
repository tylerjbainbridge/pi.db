/*
  Warnings:

  - You are about to drop the column `data` on the `Feature` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Feature" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "intro" TEXT,
    "date" DATETIME
);
INSERT INTO "new_Feature" ("id", "intro", "title", "url") SELECT "id", "intro", "title", "url" FROM "Feature";
DROP TABLE "Feature";
ALTER TABLE "new_Feature" RENAME TO "Feature";
CREATE UNIQUE INDEX "Feature.url_unique" ON "Feature"("url");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
