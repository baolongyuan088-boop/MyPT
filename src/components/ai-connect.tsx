"use client";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
export function AIConnect() {
  const [key, setKey] = useState("");
  const [model, setModel] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/ai-config").then(async r => {
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setModel(d.model); setSaved(d.configured); setReady(true);
    }).catch(() => setError("请先从登录页进入本机体验。"));
  }, []);
  async function connect(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const r = await fetch("/api/ai-config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ apiKey: key, model }) });
      const d = await r.json();
      if (!r.ok || !d.ok) throw new Error(d.error || "连接失败，请重试。");
      setKey(""); setSaved(true);
    } catch (e) { setError(e instanceof Error ? e.message : "连接失败"); }
    finally { setBusy(false); }
  }
  return <div className="space-y-6 py-4">
    <header><p className="text-sm text-muted-foreground">MyPT · 个人体验</p><h1 className="mt-2 text-3xl font-bold">连接你的 AI 管家</h1><p className="mt-3 text-sm text-muted-foreground">聊饮食、聊运动，也聊聊今天的状态。</p></header>
    <form onSubmit={connect} className="space-y-5 rounded-3xl bg-card p-5">
      <p className="font-medium">火山方舟</p>
      <label className="block text-sm">API Key<input type="password" autoComplete="off" value={key} onChange={e => setKey(e.target.value)} disabled={busy || !ready} placeholder={saved ? "已保存，留空可继续使用" : "粘贴新创建的密钥"} className="mt-2 w-full rounded-xl border border-border bg-background p-3" /></label>
      <label className="block text-sm">模型 ID<input value={model} required onChange={e => setModel(e.target.value)} disabled={busy || !ready} placeholder="复制方舟调用示例中的 model 值" className="mt-2 w-full rounded-xl border border-border bg-background p-3" /></label>
      <p className="text-xs leading-relaxed text-muted-foreground">支持方舟上已开通的豆包或 GLM 模型。模型 ID 请从控制台复制。测试会产生一次少量 API 调用。</p>
      <button disabled={busy || !ready || !model.trim() || (!saved && !key.trim())} className="w-full rounded-xl bg-foreground p-3 font-semibold text-background disabled:opacity-40">{busy ? "正在测试连接…" : "测试并保存"}</button>
      {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
      {saved && <p role="status" className="text-sm">已保存可用配置。<Link href="/insights" className="ml-2 underline">开始聊天 →</Link></p>}
    </form>
    <p className="px-2 text-xs leading-relaxed text-muted-foreground">密钥仅保存在这台电脑的服务端，不会写入 GitHub。聊天时会将消息、个人档案及近期饮食和训练记录发送给所选模型。</p>
  </div>;
}
