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
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">使用兑换码创建企业账户</h1>
      {!result && (
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow rounded p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium mb-1">显示名</label>
            <input
              className="w-full border rounded px-3 py-2"
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
              className="w-full border rounded px-3 py-2"
              value={localPart}
              onChange={(e) => setLocalPart(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">兑换码</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? "提交中..." : "创建企业账户"}
          </button>
          {error && <p className="text-red-600 text-sm">{error}</p>}
        </form>
      )}

      {result && (
        <div className="bg-green-50 border border-green-200 rounded p-6 space-y-3">
          <h2 className="text-2xl font-semibold text-green-700">创建成功</h2>
          <p>
            企业账户：<span className="font-mono">{result.userPrincipalName}</span>
          </p>
          <p className="text-sm text-gray-700">
            初始密码：<span className="font-mono">{result.password}</span>
          </p>
          <p className="text-sm text-gray-600">
            请使用该账号登录 Microsoft 365/Entra，首次登录需要修改密码。
          </p>
          <button
            className="text-blue-700 underline"
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
