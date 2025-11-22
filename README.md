# Entra Invite Redemption

一个基于 Next.js 14 + Prisma 的示例系统，管理员配置 Microsoft Graph 应用并完成 OAuth 授权，向用户分发兑换码，用户通过兑换码自动在 Entra（Azure AD）中创建企业账户。

## 技术栈

- Next.js 14（App Router）
- TypeScript
- Tailwind CSS
- Prisma + SQLite
- 手写 Microsoft OAuth 2.0 + Graph API 调用

## 环境变量

在项目根目录创建 `.env`，示例：

```env
ENTRA_TENANT_ID="your-tenant-id"
ENTRA_TENANT_DOMAIN="yourtenant.onmicrosoft.com"
OAUTH_REDIRECT_URI="http://localhost:3000/api/admin/oauth/callback"
ADMIN_PASSWORD="some-strong-password"
DATABASE_URL="file:./dev.db"
```

## 本地运行

```bash
npm install
npx prisma migrate dev --name init
npm run dev
```

## Azure Portal 基本配置

1. 在 Azure Portal 创建一个 App Registration。
2. 记录 Tenant ID 和 onmicrosoft.com 域名（填入 `.env`）。
3. 在应用中配置 Redirect URI：`http://localhost:3000/api/admin/oauth/callback`。
4. 创建 Client Secret 并妥善保存。
5. 将 Client ID / Client Secret 填入后台 `/admin` 后点击“管理员授权”完成 OAuth 同意。

## 使用流程

1. 管理员访问 `/admin`，使用 `ADMIN_PASSWORD` 登录。
2. 填写 Client ID / Client Secret 并保存，然后点击“前往管理员授权”完成一次性授权。
3. 在后台创建兑换码（可批量）。
4. 用户访问 `/`，输入显示名和兑换码，系统验证后调用 Graph API 创建企业账户并返回账号信息。
