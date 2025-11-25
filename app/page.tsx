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
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [resetUserPrincipalName, setResetUserPrincipalName] = useState("");
  const [resetInviteCode, setResetInviteCode] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetResult, setResetResult] = useState<RedeemResponse | null>(null);

  async function handleCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage(`已复制：${text}`);
    } catch {
      setCopyMessage("复制失败，请手动选择复制");
    }
    setTimeout(() => setCopyMessage(null), 2000);
  }

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
      <div className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
        <h1 className="heading">使用兑换码创建企业账户</h1>
        <p className="text-gray-700">按步骤完成授权与兑换，系统将为你的组织自动创建企业账户，并可选择分配 Office 365 E3。</p>
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
        </form>
      )}

      {result && (
        <div className="bg-green-50 border border-green-200 rounded p-5 sm:p-6 space-y-3">
          <h2 className="text-2xl font-semibold text-green-700">创建成功</h2>
          {copyMessage && (
            <p className="text-green-700 text-sm" role="status" aria-live="polite">{copyMessage}</p>
          )}
          <div className="grid sm:grid-cols-2 gap-3 text-sm sm:text-base">
            <div className="flex flex-wrap items-center gap-2 break-all">
              <span>
                企业账户：<span className="font-mono">{result.userPrincipalName}</span>
              </span>
              <button className="link" onClick={() => handleCopy(result.userPrincipalName)}>
                复制
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-gray-700">
              <span>
                初始密码：<span className="font-mono">{result.password}</span>
              </span>
              <button className="link" onClick={() => handleCopy(result.password)}>
                复制
              </button>
            </div>
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
        </div>
      )}

      <section className="space-y-4 sm:space-y-5 mt-10">
        <h2 className="text-2xl font-semibold text-gray-900">兑换码 + 账号重置密码</h2>
        <p className="text-sm text-gray-600">
          同时提供兑换码和对应的用户账号才能重置密码，防止被滥用。
        </p>
        {!resetResult && (
          <form
            onSubmit={handleResetSubmit}
            className="card p-5 sm:p-6 space-y-4 sm:space-y-5"
          >
            <div>
              <label htmlFor="resetUser" className="block text-sm font-medium mb-1">用户账号（userPrincipalName）</label>
              <input
                className="input"
                id="resetUser"
                value={resetUserPrincipalName}
                onChange={(e) => setResetUserPrincipalName(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="resetCode" className="block text-sm font-medium mb-1">兑换码</label>
              <input
                className="input"
                id="resetCode"
                value={resetInviteCode}
                onChange={(e) => setResetInviteCode(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={resetLoading}
              aria-busy={resetLoading}
            >
              {resetLoading ? "重置中..." : "重置密码"}
            </button>
            {resetError && <p className="text-red-600 text-sm" role="alert" aria-live="polite">{resetError}</p>}
          </form>
        )}

        {resetResult && (
          <div className="bg-green-50 border border-green-200 rounded p-5 sm:p-6 space-y-3">
            <h3 className="text-xl font-semibold text-green-700">密码重置成功</h3>
            {copyMessage && (
              <p className="text-green-700 text-sm" role="status" aria-live="polite">{copyMessage}</p>
            )}
            <div className="grid sm:grid-cols-2 gap-3 text-sm sm:text-base">
              <div className="flex flex-wrap items-center gap-2 break-all">
                <span>
                  企业账户：<span className="font-mono">{resetResult.userPrincipalName}</span>
                </span>
                <button className="link" onClick={() => handleCopy(resetResult.userPrincipalName)}>
                  复制
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-gray-700">
                <span>
                  新密码：<span className="font-mono">{resetResult.password}</span>
                </span>
                <button className="link" onClick={() => handleCopy(resetResult.password)}>
                  复制
                </button>
              </div>
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
