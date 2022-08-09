-- CreateTable
CREATE TABLE "AuthToken" (
    "authTokenId" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tokenVersion" INTEGER NOT NULL,
    CONSTRAINT "AuthToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("userId") ON DELETE RESTRICT ON UPDATE CASCADE
);
