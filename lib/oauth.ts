import { prisma } from "./prisma";

const tenantId = process.env.ENTRA_TENANT_ID;
const redirectUri = process.env.OAUTH_REDIRECT_URI;

if (!tenantId) {
  throw new Error("ENTRA_TENANT_ID is required");
}

if (!redirectUri) {
  throw new Error("OAUTH_REDIRECT_URI is required");
}

const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

export function buildAuthorizeUrl(clientId: string, state: string) {
  const authorizeEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`;
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    response_mode: "query",
    scope:
      "offline_access https://graph.microsoft.com/User.ReadWrite.All openid profile",
    state
  });
  return `${authorizeEndpoint}?${params.toString()}`;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  scope?: string;
  expires_in: number;
}

export async function exchangeCodeForToken({
  code,
  clientId,
  clientSecret
}: {
  code: string;
  clientId: string;
  clientSecret: string;
}) {
  const form = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    scope: "offline_access https://graph.microsoft.com/User.ReadWrite.All"
  });

  const res = await fetch(tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString()
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to exchange code: ${res.status} ${body}`);
  }

  const data = (await res.json()) as TokenResponse;
  await prisma.adminToken.create({
    data: {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenType: data.token_type,
      scope: data.scope,
      expiresIn: data.expires_in,
      expiresAt: new Date(Date.now() + data.expires_in * 1000)
    }
  });
  return data;
}

export async function refreshAccessToken({
  refreshToken,
  clientId,
  clientSecret
}: {
  refreshToken: string;
  clientId: string;
  clientSecret: string;
}) {
  const form = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    scope: "offline_access https://graph.microsoft.com/User.ReadWrite.All"
  });

  const res = await fetch(tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString()
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to refresh token: ${res.status} ${body}`);
  }

  const data = (await res.json()) as TokenResponse;
  await prisma.adminToken.create({
    data: {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? refreshToken,
      tokenType: data.token_type,
      scope: data.scope,
      expiresIn: data.expires_in,
      expiresAt: new Date(Date.now() + data.expires_in * 1000)
    }
  });
  return data;
}
