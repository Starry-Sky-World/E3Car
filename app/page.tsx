"use client";

import { useState } from "react";

type RedeemResponse = {
  userPrincipalName: string;
  password: string;
};

export default function Home() {
  const [displayName, setDisplayName] = useState("");
  const [localPart, setLocalPart] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RedeemResponse | null>(null);
<<<<<<< HEAD
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  async function handleCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage(`已复制：${text}`);
      setTimeout(() => setCopyMessage(null), 2000);
    } catch {
      setCopyMessage("复制失败，请手动选择复制");
      setTimeout(() => setCopyMessage(null), 2000);
    }
  }
=======
  const [resetUserPrincipalName, setResetUserPrincipalName] = useState("");
  const [resetInviteCode, setResetInviteCode] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetResult, setResetResult] = useState<RedeemResponse | null>(null);
>>>>>>> feeb82c (Add password reset flow and admin copy helpers)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    const res = await fetch("/api/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, localPart, inviteCode })
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json();
      setError(body.error || "操作失败");
      return;
    }
    const data = (await res.json()) as RedeemResponse;
    setResult(data);
  }

  async function handleResetSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResetLoading(true);
    setResetError(null);
    setResetResult(null);
    const res = await fetch("/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userPrincipalName: resetUserPrincipalName,
        inviteCode: resetInviteCode
      })
    });
    setResetLoading(false);
    if (!res.ok) {
      const body = await res.json();
      setResetError(body.error || "操作失败");
      return;
    }
    const data = (await res.json()) as RedeemResponse;
    setResetResult(data);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
<<<<<<< HEAD
      <div className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
        <h1 className="heading">使用兑换码创建企业账户</h1>
        <p className="text-gray-700">按步骤完成授权与兑换，系统将为你的组织自动创建企业账户，并可选择分配 Office 365 E3。</p>
      </div>
      <div className="grid sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        <div className="card p-4">
          <div className="text-sm font-semibold text-gray-900 mb-1">步骤 1</div>
          <p className="text-sm text-gray-700">管理员在后台完成 Graph 配置与授权</p>
        </div>
        <div className="card p-4">
          <div className="text-sm font-semibold text-gray-900 mb-1">步骤 2</div>
          <p className="text-sm text-gray-700">创建并分发兑换码给用户</p>
        </div>
        <div className="card p-4">
          <div className="text-sm font-semibold text-gray-900 mb-1">步骤 3</div>
          <p className="text-sm text-gray-700">用户在此输入兑换码创建企业账户</p>
        </div>
      </div>
      {!result && (
        <form
          onSubmit={handleSubmit}
          className="card p-5 sm:p-6 space-y-4 sm:space-y-5"
        >
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium mb-1">显示名</label>
            <input
              className="input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              id="displayName"
              required
            />
          </div>
          <div>
            <label htmlFor="localPart" className="block text-sm font-medium mb-1">
              账号前缀（可选，留空将自动生成）
            </label>
            <input
              className="input"
              value={localPart}
              onChange={(e) => setLocalPart(e.target.value)}
              id="localPart"
            />
          </div>
          <div>
            <label htmlFor="inviteCode" className="block text-sm font-medium mb-1">兑换码</label>
            <input
              className="input"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              id="inviteCode"
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? "提交中..." : "创建企业账户"}
          </button>
          {error && <p className="text-red-600 text-sm" role="alert" aria-live="polite">{error}</p>}
          {copyMessage && (
            <p className="text-green-700 text-sm" role="status" aria-live="polite">{copyMessage}</p>
          )}
        </form>
      )}

      {result && (
        <div className="bg-green-50 border border-green-200 rounded p-5 sm:p-6 space-y-3">
          <h2 className="text-2xl font-semibold text-green-700">创建成功</h2>
          <div className="grid sm:grid-cols-2 gap-3 text-sm sm:text-base">
            <p className="break-all">
              企业账户：<span className="font-mono">{result.userPrincipalName}</span>
              <button
                className="ml-2 link"
                onClick={() => handleCopy(result.userPrincipalName)}
              >
                复制
              </button>
            </p>
            <p className="text-gray-700">
              初始密码：<span className="font-mono">{result.password}</span>
              <button
                className="ml-2 link"
                onClick={() => handleCopy(result.password)}
              >
                复制
              </button>
=======
      <h1 className="text-3xl font-bold mb-6 sm:mb-8 text-gray-900">
        使用兑换码创建企业账户
      </h1>
      <section className="space-y-4 sm:space-y-5">
        <h2 className="text-2xl font-semibold text-gray-900">创建新企业账户</h2>
        {!result && (
          <form
            onSubmit={handleSubmit}
            className="bg-white shadow rounded p-5 sm:p-6 space-y-4 sm:space-y-5 border border-gray-100"
          >
            <div>
              <label className="block text-sm font-medium mb-1">显示名</label>
              <input
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                账号前缀（可选，留空将自动生成）
              </label>
              <input
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={localPart}
                onChange={(e) => setLocalPart(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">兑换码</label>
              <input
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2.5 rounded hover:bg-blue-700 transition-colors font-medium"
              disabled={loading}
            >
              {loading ? "提交中..." : "创建企业账户"}
            </button>
            {error && <p className="text-red-600 text-sm">{error}</p>}
          </form>
        )}

        {result && (
          <div className="bg-green-50 border border-green-200 rounded p-5 sm:p-6 space-y-3">
            <h3 className="text-xl font-semibold text-green-700">创建成功</h3>
            <div className="grid sm:grid-cols-2 gap-3 text-sm sm:text-base">
              <p className="break-all">
                企业账户：<span className="font-mono">{result.userPrincipalName}</span>
              </p>
              <p className="text-gray-700">
                初始密码：<span className="font-mono">{result.password}</span>
              </p>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              请使用该账号登录 Microsoft 365/Entra，首次登录需要修改密码。
>>>>>>> feeb82c (Add password reset flow and admin copy helpers)
            </p>
            <button
              className="text-blue-700 underline font-medium"
              onClick={() => {
                setResult(null);
                setDisplayName("");
                setLocalPart("");
                setInviteCode("");
              }}
            >
              返回继续创建
            </button>
          </div>
        )}
      </section>

      <section className="space-y-4 sm:space-y-5 mt-10">
        <h2 className="text-2xl font-semibold text-gray-900">兑换码 + 账号重置密码</h2>
        {!resetResult && (
          <form
            onSubmit={handleResetSubmit}
            className="bg-white shadow rounded p-5 sm:p-6 space-y-4 sm:space-y-5 border border-gray-100"
          >
            <div>
              <label className="block text-sm font-medium mb-1">用户账号（userPrincipalName）</label>
              <input
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={resetUserPrincipalName}
                onChange={(e) => setResetUserPrincipalName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">兑换码</label>
              <input
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={resetInviteCode}
                onChange={(e) => setResetInviteCode(e.target.value)}
                required
              />
            </div>
            <p className="text-sm text-gray-500">
              同时提供兑换码和对应的用户账号才能重置密码，防止被滥用。
            </p>
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2.5 rounded hover:bg-indigo-700 transition-colors font-medium"
              disabled={resetLoading}
            >
              {resetLoading ? "重置中..." : "重置密码"}
            </button>
            {resetError && <p className="text-red-600 text-sm">{resetError}</p>}
          </form>
        )}

        {resetResult && (
          <div className="bg-green-50 border border-green-200 rounded p-5 sm:p-6 space-y-3">
            <h3 className="text-xl font-semibold text-green-700">密码重置成功</h3>
            <div className="grid sm:grid-cols-2 gap-3 text-sm sm:text-base">
              <p className="break-all">
                企业账户：<span className="font-mono">{resetResult.userPrincipalName}</span>
              </p>
              <p className="text-gray-700">
                新密码：<span className="font-mono">{resetResult.password}</span>
              </p>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              请尽快登录并修改密码，避免泄漏。
            </p>
            <button
              className="text-blue-700 underline font-medium"
              onClick={() => {
                setResetResult(null);
                setResetInviteCode("");
                setResetUserPrincipalName("");
              }}
            >
              返回重新操作
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
