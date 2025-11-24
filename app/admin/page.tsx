"use client";

import { useCallback, useEffect, useState } from "react";

type ConfigResponse = {
  hasConfig: boolean;
  clientId: string | null;
  hasSecret: boolean;
  licenseSkuId: string | null;
  updatedAt: string | null;
  token: {
    expiresAt: string;
    expired: boolean;
    scope?: string | null;
    tokenLength: number;
  } | null;
};

type Invite = {
  id: number;
  code: string;
  used: boolean;
  usedAt: string | null;
  createdAt: string;
  enterpriseUser?: {
    userPrincipalName: string;
  } | null;
};

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [activeTab, setActiveTab] = useState<"config" | "invites">("config");
  const [config, setConfig] = useState<ConfigResponse | null>(null);
  const [configForm, setConfigForm] = useState({
    clientId: "",
    clientSecret: "",
    licenseSkuId: ""
  });
  const [invites, setInvites] = useState<Invite[]>([]);
  const [inviteCount, setInviteCount] = useState(5);
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingSkus, setLoadingSkus] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [skus, setSkus] = useState<
    Array<{
      skuId: string;
      name: string;
      capabilityStatus: string;
      consumedUnits: number;
      enabled: number;
      servicePlans: Array<{ name: string; status: string }>;
    }>
  >([]);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const unusedCodes = invites.filter((invite) => !invite.used).map((invite) => invite.code);
  const usedCodes = invites.filter((invite) => invite.used).map((invite) => invite.code);

  const fetchWithAuth = useCallback(
    async (input: RequestInfo | URL, initFactory?: () => RequestInit) => {
      const attempt = () => fetch(input, initFactory ? initFactory() : undefined);
      let res = await attempt();
      if (res.status !== 401) {
        return res;
      }
      const refreshRes = await fetch("/api/admin/token", { method: "POST" });
      if (!refreshRes.ok) {
        return res;
      }
      return attempt();
    },
    []
  );

  const fetchConfigAndInvites = useCallback(async () => {
    setError(null);
    const res = await fetchWithAuth("/api/admin/config");
    if (res.status === 401) {
      setAuthed(false);
      return;
    }
    if (!res.ok) {
      setError("加载配置失败");
      return;
    }
    const data: ConfigResponse = await res.json();
    setAuthed(true);
    setConfig(data);
    if (data.clientId) {
      setConfigForm((prev) => ({
        ...prev,
        clientId: data.clientId ?? "",
        licenseSkuId: data.licenseSkuId ?? ""
      }));
    }

    const inviteRes = await fetchWithAuth("/api/admin/invite");
    if (inviteRes.status === 401) {
      setAuthed(false);
      return;
    }
    if (inviteRes.ok) {
      const inviteData = (await inviteRes.json()) as Invite[];
      setInvites(inviteData);
      setSelectedCodes([]);
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    fetchConfigAndInvites();
  }, [fetchConfigAndInvites]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json();
      setError(body.error || "登录失败");
      return;
    }
    setAuthed(true);
    setMessage("登录成功");
    fetchConfigAndInvites();
  }

  async function handleSaveConfig(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    const res = await fetchWithAuth("/api/admin/config", () => ({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(configForm)
    }));
    setLoading(false);
    if (res.status === 401) {
      setAuthed(false);
      setError("未授权");
      return;
    }
    if (!res.ok) {
      const body = await res.json();
      setError(body.error || "保存失败");
      return;
    }
    setMessage("配置已保存");
    fetchConfigAndInvites();
  }

  async function handleFetchSkus() {
    setLoadingSkus(true);
    setError(null);
    const res = await fetchWithAuth("/api/admin/skus");
    setLoadingSkus(false);
    if (res.status === 401) {
      setAuthed(false);
      setError("未授权");
      return;
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "获取订阅 SKU 失败");
      return;
    }
    const body = (await res.json()) as {
      skus: Array<{
        skuId: string;
        name: string;
        capabilityStatus: string;
        consumedUnits: number;
        enabled: number;
        servicePlans: Array<{ name: string; status: string }>;
      }>;
    };
    setSkus(body.skus);
  }

  async function handleCreateCodes(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const res = await fetchWithAuth("/api/admin/invite", () => ({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count: inviteCount })
    }));
    if (res.status === 401) {
      setAuthed(false);
      setError("未授权");
      return;
    }
    if (!res.ok) {
      const body = await res.json();
      setError(body.error || "创建失败");
      return;
    }
    const body = await res.json();
    setMessage(`已创建兑换码：${body.codes.join(", ")}`);
    fetchConfigAndInvites();
  }

  async function handleCreateSingle(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetchWithAuth("/api/admin/invite", () => ({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: inviteCode })
    }));
    if (res.status === 401) {
      setAuthed(false);
      setError("未授权");
      return;
    }
    if (!res.ok) {
      const body = await res.json();
      setError(body.error || "创建失败");
      return;
    }
    setInviteCode("");
    setMessage("兑换码已创建");
    fetchConfigAndInvites();
  }

  async function handleDelete(code: string) {
    setError(null);
    setMessage(null);
    const res = await fetchWithAuth(`/api/admin/invite?code=${code}&force=true`, () => ({
      method: "DELETE"
    }));
    if (res.status === 401) {
      setAuthed(false);
      setError("未授权");
      return;
    }
    if (!res.ok) {
      const body = await res.json();
      setError(body.error || "删除失败");
      return;
    }
    setMessage("兑换码已删除");
    fetchConfigAndInvites();
  }

  async function handleCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage(`已复制：${text}`);
      setTimeout(() => setCopyMessage(null), 2000);
    } catch (err) {
      setError("复制失败，请手动选择复制");
    }
  }

  function toggleSelect(code: string) {
    setSelectedCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  }

  function toggleSelectAll() {
    if (selectedCodes.length === invites.length) {
      setSelectedCodes([]);
    } else {
      setSelectedCodes(invites.map((i) => i.code));
    }
  }

  async function handleCopySelected() {
    if (!selectedCodes.length) {
      setError("请先勾选要复制的兑换码");
      return;
    }
    setError(null);
    await handleCopy(selectedCodes.join("\n"));
  }

  async function handleCopyUnused() {
    if (!unusedCodes.length) {
      setError("没有未使用的兑换码");
      return;
    }
    setError(null);
    await handleCopy(unusedCodes.join("\n"));
  }

  async function handleCopyUsed() {
    if (!usedCodes.length) {
      setError("没有已使用的兑换码");
      return;
    }
    setError(null);
    await handleCopy(usedCodes.join("\n"));
  }

  return (
    <div className="space-y-8 px-4 py-6 sm:px-0">
      <h1 className="heading">管理后台</h1>

      {!authed && (
        <form
          onSubmit={handleLogin}
          className="card p-6 space-y-4 max-w-md mx-auto"
        >
          <div>
            <label htmlFor="adminPassword" className="block text-sm font-medium mb-1">后台密码</label>
            <input
              id="adminPassword"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
            aria-busy={loading}
          >
            登录
          </button>
          {error && <p className="text-red-600 text-sm" role="alert" aria-live="polite">{error}</p>}
          {message && <p className="text-green-600 text-sm" role="status" aria-live="polite">{message}</p>}
        </form>
      )}

      {authed && (
        <>
          <div className="card p-2 sm:p-3 flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              className={`btn ${activeTab === "config" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setActiveTab("config")}
            >
              配置与授权
            </button>
            <button
              type="button"
              className={`btn ${activeTab === "invites" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setActiveTab("invites")}
            >
              兑换码管理
            </button>
          </div>
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded" role="alert" aria-live="polite">
              {error}
            </div>
          )}
          {(message || copyMessage) && (
            <div className="p-3 bg-green-100 text-green-700 rounded space-y-1" role="status" aria-live="polite">
              {message && <div>{message}</div>}
              {copyMessage && <div className="text-sm">{copyMessage}</div>}
            </div>
          )}

          {activeTab === "config" && (
          <section className="card p-6">
            <h2 className="text-xl font-semibold mb-4">Graph 应用配置</h2>
            <form className="space-y-4" onSubmit={handleSaveConfig}>
              <div>
                <label htmlFor="clientId" className="block text-sm font-medium mb-1">Client ID</label>
                <input
                  className="input"
                  value={configForm.clientId}
                  onChange={(e) => setConfigForm({ ...configForm, clientId: e.target.value })}
                  id="clientId"
                />
              </div>
              <div>
                <label htmlFor="clientSecret" className="block text-sm font-medium mb-1">Client Secret</label>
                <input
                  type="password"
                  className="input"
                  value={configForm.clientSecret}
                  onChange={(e) =>
                    setConfigForm({ ...configForm, clientSecret: e.target.value })
                  }
                  id="clientSecret"
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label htmlFor="licenseSkuId" className="block text-sm font-medium mb-1">自动分配 SKU</label>
                  <select
                    className="select"
                    value={configForm.licenseSkuId}
                    onChange={(e) => setConfigForm({ ...configForm, licenseSkuId: e.target.value })}
                    id="licenseSkuId"
                  >
                    <option value="">不自动分配</option>
                    {skus.map((sku) => (
                      <option key={sku.skuId} value={sku.skuId}>
                        {sku.name} ({sku.consumedUnits}/{sku.enabled || "∞"}) {sku.capabilityStatus}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    从订阅 SKU 中选择（如 Office 365 E3: ENTERPRISEPACK）。未选择则跳过授权。
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary whitespace-nowrap"
                  onClick={handleFetchSkus}
                  disabled={loadingSkus || !config?.token}
                  aria-busy={loadingSkus}
                >
                  {loadingSkus ? "加载中..." : "拉取 SKU"}
                </button>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <button
                  type="submit"
                  className="btn btn-primary w-full sm:w-auto"
                  disabled={loading}
                  aria-busy={loading}
                >
                  保存配置
                </button>
                <a
                  href="/api/admin/oauth/authorize"
                  className="btn bg-purple-600 hover:bg-purple-700 text-white text-center w-full sm:w-auto"
                >
                  前往管理员授权
                </a>
              </div>
              {config && (
                <div className="text-sm text-gray-700 space-y-1">
                  <div>已保存配置: {config.hasConfig ? "是" : "否"}</div>
                  <div>Token: {config.token ? "已存储" : "未获取"}</div>
                  {config.token && (
                    <ul className="list-disc ml-5">
                      <li>长度 {config.token.tokenLength}</li>
                      <li>过期时间 {new Date(config.token.expiresAt).toLocaleString()}</li>
                      <li>{config.token.expired ? "已过期" : "未过期"}</li>
                    </ul>
                  )}
                </div>
              )}
            </form>
          </section>
          )}

          {activeTab === "invites" && (
          <section className="card p-6 space-y-4">
            <h2 className="text-xl font-semibold">兑换码管理</h2>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <form className="grid gap-3 sm:flex sm:items-end sm:gap-3" onSubmit={handleCreateCodes}>
                <div className="sm:w-40">
                  <label className="block text-sm font-medium mb-1">批量创建数量</label>
                  <input
                    type="number"
                    className="input"
                    value={inviteCount}
                    min={1}
                    onChange={(e) => setInviteCount(Number(e.target.value))}
                  />
                </div>
                <button className="btn btn-success w-full sm:w-auto" type="submit">
                  批量生成
                </button>
              </form>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={toggleSelectAll}
                >
                  {selectedCodes.length === invites.length ? "取消全选" : "全选"}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleCopySelected}
                  disabled={!selectedCodes.length}
                >
                  复制选中 ({selectedCodes.length})
                </button>
                <button
                  type="button"
                  className="bg-indigo-600 text-white px-3 py-2 rounded text-sm"
                  onClick={handleCopyUnused}
                  disabled={!unusedCodes.length}
                >
                  复制未使用 ({unusedCodes.length})
                </button>
                <button
                  type="button"
                  className="bg-purple-600 text-white px-3 py-2 rounded text-sm"
                  onClick={handleCopyUsed}
                  disabled={!usedCodes.length}
                >
                  复制已使用 ({usedCodes.length})
                </button>
              </div>
            </div>
              <form className="grid gap-3 sm:flex sm:items-end sm:gap-3" onSubmit={handleCreateSingle}>
                <div className="sm:flex-1">
                  <label htmlFor="singleCode" className="block text-sm font-medium mb-1">指定兑换码</label>
                  <input
                    className="input"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    id="singleCode"
                  />
                </div>
                <button className="btn btn-primary w-full sm:w-auto" type="submit">
                  创建
                </button>
              </form>

            {invites.length === 0 && (
              <div className="p-6 bg-gray-50 border rounded text-sm text-gray-700">暂无兑换码，先在上方创建或批量生成。</div>
            )}
            <div className="overflow-x-auto -mx-4 sm:mx-0 hidden sm:block">
              <div className="min-w-[640px] sm:min-w-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="py-2 px-2">
                        <input
                          type="checkbox"
                          checked={selectedCodes.length === invites.length && invites.length > 0}
                          onChange={toggleSelectAll}
                        />
                      </th>
                      <th className="py-2 px-2">兑换码</th>
                      <th className="py-2 px-2">状态</th>
                      <th className="py-2 px-2">使用时间</th>
                      <th className="py-2 px-2">企业账户</th>
                      <th className="py-2 px-2 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invites.map((invite) => (
                      <tr key={invite.id} className="border-b odd:bg-gray-50">
                        <td className="py-2 px-2">
                          <input
                            type="checkbox"
                            checked={selectedCodes.includes(invite.code)}
                            onChange={() => toggleSelect(invite.code)}
                          />
                        </td>
                        <td className="py-2 px-2 font-mono break-words">
                          <button
                            type="button"
                            className="text-left w-full hover:underline"
                            onClick={() => handleCopy(invite.code)}
                          >
                            {invite.code}
                          </button>
                        </td>
                        <td className="py-2 px-2">
                          <span className={`${invite.used ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"} inline-block px-2 py-1 rounded text-xs`}>
                            {invite.used ? "已使用" : "未使用"}
                          </span>
                        </td>
                        <td className="py-2 px-2">
                          {invite.usedAt ? new Date(invite.usedAt).toLocaleString() : "-"}
                        </td>
                        <td className="py-2 px-2">
                          {invite.enterpriseUser?.userPrincipalName ? (
                            <span className="inline-block px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                              {invite.enterpriseUser.userPrincipalName}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="py-2 px-2 text-right">
<<<<<<< HEAD
                          {!invite.used && (
                            <button
                              className="text-red-600 hover:underline"
                              onClick={() => {
                                if (confirm("确定要作废该兑换码吗？")) handleRevoke(invite.code);
                              }}
                            >
                              作废
                            </button>
                          )}
=======
                          <button
                            className="text-red-600 hover:underline"
                            onClick={() => handleDelete(invite.code)}
                          >
                            删除
                          </button>
>>>>>>> feeb82c (Add password reset flow and admin copy helpers)
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="sm:hidden space-y-3">
              {invites.map((invite) => (
                <div key={invite.id} className="border rounded p-3 bg-white">
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      className="font-mono text-sm text-left hover:underline break-words"
                      onClick={() => handleCopy(invite.code)}
                    >
                      {invite.code}
                    </button>
                    {!invite.used && (
                      <button
                        className="text-red-600 text-sm"
                        onClick={() => {
                          if (confirm("确定要作废该兑换码吗？")) handleRevoke(invite.code);
                        }}
                      >
                        作废
                      </button>
                    )}
                  </div>
                  <div className="mt-2 text-xs text-gray-700 space-y-1">
                    <div>状态：{invite.used ? "已使用" : "未使用"}</div>
                    <div>使用时间：{invite.usedAt ? new Date(invite.usedAt).toLocaleString() : "-"}</div>
                    <div>企业账户：{invite.enterpriseUser?.userPrincipalName || "-"}</div>
                  </div>
                  <div className="mt-2">
                    <label className="inline-flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={selectedCodes.includes(invite.code)}
                        onChange={() => toggleSelect(invite.code)}
                      />
                      选择
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </section>
          )}
        </>
      )}
    </div>
  );
}
