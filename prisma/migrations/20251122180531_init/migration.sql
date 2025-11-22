-- CreateTable
CREATE TABLE "AppConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clientId" TEXT NOT NULL,
    "clientSecret" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AdminToken" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenType" TEXT NOT NULL,
    "scope" TEXT,
    "expiresIn" INTEGER NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "obtainedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "InviteCode" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enterpriseUserId" INTEGER,
    CONSTRAINT "InviteCode_enterpriseUserId_fkey" FOREIGN KEY ("enterpriseUserId") REFERENCES "EnterpriseUser" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EnterpriseUser" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "graphUserId" TEXT NOT NULL,
    "userPrincipalName" TEXT NOT NULL,
    "displayName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "InviteCode_code_key" ON "InviteCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "EnterpriseUser_graphUserId_key" ON "EnterpriseUser"("graphUserId");

-- CreateIndex
CREATE UNIQUE INDEX "EnterpriseUser_userPrincipalName_key" ON "EnterpriseUser"("userPrincipalName");
