import { prisma } from "./prisma";
import { refreshAccessToken } from "./oauth";

const tenantDomain = process.env.ENTRA_TENANT_DOMAIN;
const tenantId = process.env.ENTRA_TENANT_ID;
const officeE3SkuId = process.env.OFFICE_E3_SKU_ID;
const usageLocation = process.env.ENTRA_USAGE_LOCATION || "CN";

if (!tenantDomain) {
  throw new Error("ENTRA_TENANT_DOMAIN is required");
}
if (!tenantId) {
  throw new Error("ENTRA_TENANT_ID is required");
}

async function getLatestToken() {
  return prisma.adminToken.findFirst({ orderBy: { obtainedAt: "desc" } });
}

export async function getAppConfig() {
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

async function assignOfficeE3License(userId: string, skuId?: string | null) {
  const skuToAssign = skuId || officeE3SkuId;
  if (!skuToAssign) {
    return;
  }
  const accessToken = await getAdminAccessToken();
  const res = await fetch(`https://graph.microsoft.com/v1.0/users/${userId}/assignLicense`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      addLicenses: [{ skuId: skuToAssign }],
      removeLicenses: []
    })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to assign Office 365 E3 license: ${res.status} ${text}`);
  }
}

async function deleteGraphUser(userId: string) {
  const accessToken = await getAdminAccessToken();
  await fetch(`https://graph.microsoft.com/v1.0/users/${userId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  }).catch(() => {
    // Best-effort cleanup; ignore errors.
  });
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
      usageLocation,
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

  // Try to assign Office 365 E3 automatically if configured.
  try {
    const config = await getAppConfig();
    await assignOfficeE3License(data.id, config?.licenseSkuId);
  } catch (err) {
    await deleteGraphUser(data.id);
    throw err;
  }

  const user = await prisma.enterpriseUser.create({
    data: {
      graphUserId: data.id,
      userPrincipalName,
      displayName
    }
  });

  return { graphUserId: user.graphUserId, userPrincipalName, password };
}

export async function resetEnterpriseUserPassword(graphUserId: string) {
  const password = generatePassword();
  const accessToken = await getAdminAccessToken();
  const res = await fetch(`https://graph.microsoft.com/v1.0/users/${graphUserId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      passwordProfile: {
        forceChangePasswordNextSignIn: true,
        password
      }
    })
  });
  if (!res.ok) {
    const text = await res.text();
    let friendlyMessage = `Failed to reset password: ${res.status} ${text}`;
    try {
      const body = JSON.parse(text) as {
        error?: { code?: string; message?: string };
      };
      if (body.error?.code === "Authorization_RequestDenied") {
        friendlyMessage =
          "Graph API 权限不足，无法重置密码。请使用具备全局管理员权限的账号重新在后台进行管理员授权 (User.ReadWrite.All + Directory.ReadWrite.All)。";
      }
    } catch {
      // keep default friendlyMessage
    }
    throw new Error(friendlyMessage);
  }
  return password;
}

export async function refreshAdminGraphToken(force = false) {
  const token = await getLatestToken();
  if (!token) {
    throw new Error("未找到 Graph 授权信息，请先在后台完成管理员授权");
  }
  if (!token.refreshToken) {
    throw new Error("当前 Graph token 缺少 refreshToken，请重新授权");
  }
  const shouldRefresh = force || isTokenExpired(token.expiresAt);
  if (!shouldRefresh) {
    return { refreshed: false, expiresAt: token.expiresAt };
  }
  const config = await getAppConfig();
  if (!config) {
    throw new Error("App config is missing. Save Client ID/Secret in admin console.");
  }
  const refreshed = await refreshAccessToken({
    refreshToken: token.refreshToken,
    clientId: config.clientId,
    clientSecret: config.clientSecret
  });
  const latest = await getLatestToken();
  const expiresAt = latest?.expiresAt ?? new Date(Date.now() + refreshed.expires_in * 1000);
  return { refreshed: true, expiresAt };
}
