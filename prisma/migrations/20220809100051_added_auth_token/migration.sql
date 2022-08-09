-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AuthToken" (
    "authTokenId" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tokenVersion" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "AuthToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("userId") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_AuthToken" ("authTokenId", "tokenVersion", "userId") SELECT "authTokenId", "tokenVersion", "userId" FROM "AuthToken";
DROP TABLE "AuthToken";
ALTER TABLE "new_AuthToken" RENAME TO "AuthToken";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
