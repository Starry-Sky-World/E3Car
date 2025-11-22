import { prisma } from "./prisma";
import { refreshAccessToken } from "./oauth";

const tenantDomain = process.env.ENTRA_TENANT_DOMAIN;
const tenantId = process.env.ENTRA_TENANT_ID;

if (!tenantDomain) {
  throw new Error("ENTRA_TENANT_DOMAIN is required");
}
if (!tenantId) {
  throw new Error("ENTRA_TENANT_ID is required");
}

async function getLatestToken() {
  return prisma.adminToken.findFirst({ orderBy: { obtainedAt: "desc" } });
}

async function getAppConfig() {
  return prisma.appConfig.findFirst({ orderBy: { id: "desc" } });
}

function isTokenExpired(expiresAt: Date) {
  return expiresAt.getTime() < Date.now() + 60 * 1000; // refresh 1 min early
}

export async function getAdminAccessToken() {
  const token = await getLatestToken();
  const config = await getAppConfig();
  if (!config) {
    throw new Error("App config is missing. Save Client ID/Secret in admin console.");
  }
  if (!token) {
    throw new Error("No admin token stored. Run OAuth admin authorization first.");
  }

  if (!isTokenExpired(token.expiresAt)) {
    return token.accessToken;
  }

  if (!token.refreshToken) {
    throw new Error("Token expired and no refresh token available.");
  }

  const refreshed = await refreshAccessToken({
    refreshToken: token.refreshToken,
    clientId: config.clientId,
    clientSecret: config.clientSecret
  });

  return refreshed.access_token;
}

function slugifyName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 32) || `user${Math.floor(Math.random() * 10000)}`;
}

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789!@#$%^&*()";
  let pwd = "";
  for (let i = 0; i < 20; i += 1) {
    pwd += chars[Math.floor(Math.random() * chars.length)];
  }
  return pwd;
}

export async function createEnterpriseUser({
  displayName,
  localPart
}: {
  displayName: string;
  localPart?: string;
}) {
  const mailNickname = (localPart && localPart.trim()) || slugifyName(displayName);
  const userPrincipalName = `${mailNickname}@${tenantDomain}`;
  const password = generatePassword();
  const accessToken = await getAdminAccessToken();

  const res = await fetch("https://graph.microsoft.com/v1.0/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      accountEnabled: true,
      displayName,
      mailNickname,
      userPrincipalName,
      passwordProfile: {
        forceChangePasswordNextSignIn: true,
        password
      }
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Graph API error: ${res.status} ${text}`);
  }

  const data = (await res.json()) as { id: string };
  const user = await prisma.enterpriseUser.create({
    data: {
      graphUserId: data.id,
      userPrincipalName,
      displayName
    }
  });

  return { graphUserId: user.graphUserId, userPrincipalName, password };
}
