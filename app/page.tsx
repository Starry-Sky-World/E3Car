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

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
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
            </p>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            请使用该账号登录 Microsoft 365/Entra，首次登录需要修改密码。
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
    </div>
  );
}
