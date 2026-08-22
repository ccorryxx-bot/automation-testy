import {
  Activity,
  BellRing,
  CirclePause,
  CirclePlay,
  ExternalLink,
  KeyRound,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";

type MonitorStatus = "idle" | "starting" | "monitoring" | "stopped" | "error";
type SetupForm = {
  sourceUrl: string;
  siteAdapter: string;
  sourceUsername: string;
  sourcePassword: string;
  paymentAmount: string;
  paymentMethod: string;
  telegramBotToken: string;
  telegramChatId: string;
  dashboardAccessKey: string;
};

const initialForm: SetupForm = {
  sourceUrl: "",
  siteAdapter: "direct-payment-page",
  sourceUsername: "",
  sourcePassword: "",
  paymentAmount: "",
  paymentMethod: "KBZPay",
  telegramBotToken: "",
  telegramChatId: "",
  dashboardAccessKey: "",
};

const statusCopy: Record<MonitorStatus, { label: string; className: string }> = {
  idle: { label: "Not configured", className: "bg-slate-100 text-slate-600" },
  starting: { label: "Saving secure setup", className: "bg-amber-50 text-amber-700" },
  monitoring: { label: "Monitoring active", className: "bg-emerald-50 text-emerald-700" },
  stopped: { label: "Monitoring paused", className: "bg-slate-100 text-slate-600" },
  error: { label: "Action required", className: "bg-rose-50 text-rose-700" },
};

function timeLabel() {
  return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(new Date());
}

export default function Home() {
  const [form, setForm] = useState<SetupForm>(initialForm);
  const [status, setStatus] = useState<MonitorStatus>("idle");
  const [notice, setNotice] = useState("Ready for a one-time secure setup.");
  const [lastPhone, setLastPhone] = useState<string | null>(null);
  const [activity, setActivity] = useState([{ time: "Now", tone: "text-slate-500", text: "No monitoring state has been saved yet." }]);
  const [pending, setPending] = useState<"start" | "stop" | "test" | null>(null);

  const isConfigured = useMemo(
    () => Boolean(form.sourceUrl && form.telegramBotToken && form.telegramChatId && form.dashboardAccessKey),
    [form.sourceUrl, form.telegramBotToken, form.telegramChatId, form.dashboardAccessKey],
  );

  const update = (field: keyof SetupForm, value: string) => setForm(current => ({ ...current, [field]: value }));
  const addActivity = (text: string, tone = "text-slate-500") =>
    setActivity(current => [{ time: timeLabel(), tone, text }, ...current].slice(0, 5));

  async function callApi(endpoint: string, body: Record<string, unknown>) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json", "x-dashboard-key": form.dashboardAccessKey },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "The secure endpoint did not complete the request.");
    return data;
  }

  useEffect(() => {
    if (!form.dashboardAccessKey) return;
    const loadStatus = async () => {
      try {
        const response = await fetch("/api/status", { headers: { "x-dashboard-key": form.dashboardAccessKey } });
        if (!response.ok) return;
        const data = await response.json();
        setLastPhone(data.lastPhoneNumber ?? null);
        if (Array.isArray(data.events)) {
          setActivity(data.events.slice(0, 5).map((event: { at?: string; status?: string; detail?: string }) => ({
            time: event.at ? new Date(event.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—",
            tone: event.status === "error" ? "text-rose-700" : event.status === "changed" ? "text-emerald-700" : "text-slate-500",
            text: event.detail ?? "Worker event recorded.",
          })));
        }
        if (data.lastStatus === "healthy") setStatus("monitoring");
      } catch { /* Dashboard remains useful before Vercel configuration exists. */ }
    };
    void loadStatus();
  }, [form.dashboardAccessKey]);

  async function startMonitoring(event: FormEvent) {
    event.preventDefault();
    if (!isConfigured) {
      setStatus("error");
      setNotice("Add a source URL, Telegram details, and the Vercel dashboard access key before starting.");
      return;
    }
    setPending("start");
    setStatus("starting");
    try {
      await callApi("/api/configure", form);
      setStatus("monitoring");
      setNotice("Secure setup saved. The GitHub Actions monitor has been dispatched.");
      addActivity("Secure configuration saved; first worker run requested.", "text-emerald-700");
    } catch (error) {
      setStatus("error");
      setNotice(error instanceof Error ? error.message : "Unable to start monitoring.");
      addActivity("Configuration could not be saved.", "text-rose-700");
    } finally {
      setPending(null);
    }
  }

  async function testTelegram() {
    if (!form.telegramBotToken || !form.telegramChatId) {
      setStatus("error");
      setNotice("Add the Telegram bot token and chat ID before testing.");
      return;
    }
    setPending("test");
    try {
      await callApi("/api/test-telegram", { telegramBotToken: form.telegramBotToken, telegramChatId: form.telegramChatId });
      setNotice("Telegram test message sent.");
      addActivity("Telegram delivery test completed.", "text-emerald-700");
    } catch (error) {
      setStatus("error");
      setNotice(error instanceof Error ? error.message : "Telegram test failed.");
      addActivity("Telegram delivery test failed.", "text-rose-700");
    } finally {
      setPending(null);
    }
  }

  async function stopMonitoring() {
    setPending("stop");
    try {
      await callApi("/api/toggle", { enabled: false });
      setStatus("stopped");
      setNotice("Monitoring paused. Existing GitHub Action runs will finish safely.");
      addActivity("Monitoring paused by the dashboard.", "text-slate-600");
    } catch (error) {
      setStatus("error");
      setNotice(error instanceof Error ? error.message : "Unable to pause monitoring.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="min-h-screen overflow-hidden px-5 py-6 sm:px-8 lg:px-12 lg:py-9">
      <div className="pointer-events-none fixed -left-24 top-40 h-64 w-64 rounded-full bg-sky-200/45 blur-3xl" />
      <div className="pointer-events-none fixed -right-20 top-14 h-64 w-64 rotate-12 rounded-[4rem] bg-rose-200/40 blur-3xl" />

      <header className="relative mx-auto flex max-w-7xl items-center justify-between border-b border-slate-900/10 pb-5">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-950 text-white shadow-sm"><Activity className="h-5 w-5" /></div>
          <div>
            <p className="text-sm font-extrabold tracking-[-0.04em] text-slate-950">Automation Testy</p>
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">Quiet monitoring, clear signals</p>
          </div>
        </div>
        <a className="hidden items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-slate-950 sm:flex" href="https://github.com" target="_blank" rel="noreferrer">
          Setup guide <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </header>

      <main className="relative mx-auto grid max-w-7xl gap-6 py-8 lg:grid-cols-[1.18fr_0.82fr] lg:gap-8 lg:py-12">
        <section className="rounded-[2rem] border border-white/70 bg-white/72 p-6 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.35)] backdrop-blur sm:p-8">
          <div className="mb-9 flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-xl">
              <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-sky-700"><Sparkles className="h-3.5 w-3.5" /> One-time setup</div>
              <h1 className="text-3xl font-extrabold tracking-[-0.06em] text-slate-950 sm:text-4xl">Watch the number,<br />not the noise.</h1>
              <p className="mt-4 max-w-lg text-sm leading-6 text-slate-500">Save one source configuration securely, then let the worker look for phone-number changes and notify Telegram only when a real change appears.</p>
            </div>
            <div className={`rounded-full px-3 py-1.5 text-xs font-bold ${statusCopy[status].className}`}>{statusCopy[status].label}</div>
          </div>

          <form className="space-y-7" onSubmit={startMonitoring}>
            <div className="grid gap-5 sm:grid-cols-[1fr_0.48fr]">
              <Field label="Source URL" hint="The page or source flow to monitor" required><input value={form.sourceUrl} onChange={e => update("sourceUrl", e.target.value)} type="url" placeholder="https://example.com/payment" /></Field>
              <Field label="Site adapter" hint="Controls extraction logic"><select value={form.siteAdapter} onChange={e => update("siteAdapter", e.target.value)}><option value="direct-payment-page">Direct payment page</option><option value="mmk1053">MMK1053 (placeholder)</option></select></Field>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Source login" hint="Optional; never committed"><input value={form.sourceUsername} onChange={e => update("sourceUsername", e.target.value)} autoComplete="username" placeholder="Username" /></Field>
              <Field label="Source password" hint="Optional; encrypted server-side"><input value={form.sourcePassword} onChange={e => update("sourcePassword", e.target.value)} type="password" autoComplete="current-password" placeholder="Password" /></Field>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Payment amount" hint="Used only by verified adapters"><input value={form.paymentAmount} onChange={e => update("paymentAmount", e.target.value)} inputMode="decimal" placeholder="Optional amount" /></Field>
              <Field label="Payment method" hint="Stored as worker configuration"><input value={form.paymentMethod} onChange={e => update("paymentMethod", e.target.value)} placeholder="KBZPay" /></Field>
            </div>
            <div className="rounded-3xl border border-sky-100 bg-sky-50/65 p-5">
              <div className="mb-5 flex items-center gap-2 text-sm font-extrabold text-slate-900"><BellRing className="h-4 w-4 text-sky-700" /> Telegram delivery</div>
              <div className="grid gap-5 sm:grid-cols-[1fr_0.62fr]">
                <Field label="Bot token" hint="Written to GitHub Secrets" required><input value={form.telegramBotToken} onChange={e => update("telegramBotToken", e.target.value)} type="password" autoComplete="off" placeholder="123456:ABC..." /></Field>
                <Field label="Chat ID" hint="Your target Telegram chat" required><input value={form.telegramChatId} onChange={e => update("telegramChatId", e.target.value)} inputMode="numeric" placeholder="123456789" /></Field>
              </div>
              <button type="button" onClick={testTelegram} disabled={pending !== null} className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-sky-800 underline decoration-sky-300 underline-offset-4 transition hover:text-sky-950 disabled:opacity-50"><BellRing className="h-3.5 w-3.5" /> {pending === "test" ? "Sending test…" : "Test Telegram connection"}</button>
            </div>
            <Field label="Dashboard access key" hint="Matches the secret configured in Vercel" required><input value={form.dashboardAccessKey} onChange={e => update("dashboardAccessKey", e.target.value)} type="password" autoComplete="off" placeholder="Vercel access key" /></Field>
            <div className="flex flex-col gap-4 border-t border-slate-900/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex max-w-md gap-2 text-xs leading-5 text-slate-500"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-slate-700" />Tokens and passwords are sent only to a server endpoint, encrypted into GitHub Secrets, and never stored in repository state.</div>
              <div className="flex gap-2">
                <button type="button" onClick={stopMonitoring} disabled={pending !== null || status === "idle"} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-950 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-45"><CirclePause className="h-4 w-4" /> Stop</button>
                <button type="submit" disabled={pending !== null} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"><CirclePlay className="h-4 w-4" /> {pending === "start" ? "Starting…" : "Start monitoring"}</button>
              </div>
            </div>
          </form>
        </section>

        <aside className="space-y-6">
          <section className="rounded-[2rem] border border-slate-900/10 bg-slate-950 p-6 text-white shadow-[0_24px_60px_-38px_rgba(15,23,42,0.75)] sm:p-7">
            <div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Live status</p><span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_0_5px_rgba(74,222,128,0.12)]" /></div>
            <div className="mt-7"><p className="text-xs text-slate-400">Last detected phone number</p><p className="mt-2 font-[DM_Mono] text-2xl font-medium tracking-[-0.04em] text-white">{lastPhone ?? "— — —"}</p><p className="mt-2 text-xs text-slate-500">Phone numbers appear here after the first successful worker check.</p></div>
            <div className="mt-8 grid grid-cols-2 gap-3 border-t border-white/10 pt-5 text-xs"><div><p className="text-slate-500">Cadence</p><p className="mt-1 font-bold text-white">5 min</p></div><div><p className="text-slate-500">Check window</p><p className="mt-1 font-bold text-white">≤ 1 min</p></div></div>
          </section>
          <section className="rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-[0_24px_70px_-48px_rgba(15,23,42,0.3)] backdrop-blur sm:p-7">
            <div className="flex items-center justify-between"><div><p className="text-sm font-extrabold tracking-[-0.035em] text-slate-950">Activity</p><p className="mt-1 text-xs text-slate-500">Worker and notification events</p></div><RefreshCw className="h-4 w-4 text-slate-400" /></div>
            <div className="mt-6 space-y-4">{activity.map((item, index) => <div key={`${item.time}-${index}`} className="grid grid-cols-[42px_1fr] gap-3 text-xs"><span className="font-[DM_Mono] text-[10px] text-slate-400">{item.time}</span><span className={`leading-5 ${item.tone}`}>{item.text}</span></div>)}</div>
          </section>
          <section className="rounded-[1.7rem] border border-rose-100 bg-rose-50/55 p-5"><div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" /><div><p className="text-sm font-extrabold text-slate-900">Read-only by design</p><p className="mt-1.5 text-xs leading-5 text-slate-600">The worker checks payment targets and never submits a five-digit transfer or slip confirmation.</p></div></div></section>
        </aside>
      </main>

      <footer className="relative mx-auto flex max-w-7xl flex-col justify-between gap-3 border-t border-slate-900/10 py-5 text-xs text-slate-500 sm:flex-row sm:items-center"><span>{notice}</span><span className="inline-flex items-center gap-1.5 font-medium text-slate-700"><KeyRound className="h-3.5 w-3.5" /> Public-repository safe</span></footer>
    </div>
  );
}

function Field({ label, hint, required, children }: { label: string; hint: string; required?: boolean; children: ReactNode }) {
  return <label className="block"><span className="text-sm font-extrabold tracking-[-0.025em] text-slate-900">{label}{required ? <span className="ml-0.5 text-sky-700">*</span> : null}</span><span className="mt-1.5 block text-xs leading-4 text-slate-500">{hint}</span><span className="mt-2.5 block [&>input]:w-full [&>input]:rounded-xl [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white/80 [&>input]:px-3.5 [&>input]:py-3 [&>input]:text-sm [&>input]:text-slate-950 [&>input]:outline-none [&>input]:transition [&>input]:placeholder:text-slate-400 [&>input]:focus:border-slate-700 [&>input]:focus:ring-4 [&>input]:focus:ring-sky-100 [&>select]:w-full [&>select]:rounded-xl [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white/80 [&>select]:px-3.5 [&>select]:py-3 [&>select]:text-sm [&>select]:text-slate-950 [&>select]:outline-none [&>select]:transition [&>select]:focus:border-slate-700 [&>select]:focus:ring-4 [&>select]:focus:ring-sky-100">{children}</span></label>;
}
