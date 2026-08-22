import {
  Activity,
  ArrowUpRight,
  BellRing,
  CircleCheck,
  Github,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";

type StateEvent = { at?: string; status?: string; detail?: string };
type MonitorState = {
  lastPhoneNumber?: string | null;
  lastCheckedAt?: string | null;
  lastNotifiedAt?: string | null;
  lastStatus?: string;
  events?: StateEvent[];
};

const repositoryUrl = "https://github.com/ccorryxx-bot/automation-testy";
const actionsUrl = `${repositoryUrl}/actions/workflows/payment-number-monitor.yml`;
const settingsUrl = `${repositoryUrl}/settings/secrets/actions`;
const stateUrl = "https://raw.githubusercontent.com/ccorryxx-bot/automation-testy/main/state/monitor-state.json";

function formatTime(value?: string | null) {
  if (!value) return "Not checked yet";
  return new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function eventTone(status?: string) {
  if (status === "changed") return "text-emerald-700";
  if (status === "error" || status === "parse_failed") return "text-rose-700";
  if (status === "expired") return "text-amber-700";
  return "text-slate-500";
}

export default function Home() {
  const [state, setState] = useState<MonitorState>({ lastStatus: "idle", events: [] });
  const [stateMessage, setStateMessage] = useState("Reading public non-secret monitor state.");

  useEffect(() => {
    const loadState = async () => {
      try {
        const response = await fetch(`${stateUrl}?t=${Date.now()}`, { cache: "no-store" });
        if (!response.ok) throw new Error("State file is not available yet.");
        const nextState = await response.json() as MonitorState;
        setState(nextState);
        setStateMessage("State is read from the repository; no credentials are used by this page.");
      } catch {
        setStateMessage("The worker has not published monitor state yet. Configure GitHub Secrets, then run the workflow.");
      }
    };
    void loadState();
  }, []);

  const activity = state.events?.slice(0, 5) ?? [];

  return (
    <div className="min-h-screen overflow-hidden px-5 py-6 sm:px-8 lg:px-12 lg:py-9">
      <div className="pointer-events-none fixed -left-24 top-40 h-64 w-64 rounded-full bg-sky-200/45 blur-3xl" />
      <div className="pointer-events-none fixed -right-20 top-14 h-64 w-64 rotate-12 rounded-[4rem] bg-rose-200/40 blur-3xl" />

      <header className="relative mx-auto flex max-w-7xl items-center justify-between border-b border-slate-900/10 pb-5">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-950 text-white shadow-sm"><Activity className="h-5 w-5" /></div>
          <div><p className="text-sm font-extrabold tracking-[-0.04em] text-slate-950">Automation Testy</p><p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">Quiet monitoring, clear signals</p></div>
        </div>
        <a className="hidden items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-slate-950 sm:flex" href={repositoryUrl} target="_blank" rel="noreferrer">Open repository <ArrowUpRight className="h-3.5 w-3.5" /></a>
      </header>

      <main className="relative mx-auto grid max-w-7xl gap-6 py-8 lg:grid-cols-[1.12fr_0.88fr] lg:gap-8 lg:py-12">
        <section className="rounded-[2rem] border border-white/70 bg-white/72 p-6 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.35)] backdrop-blur sm:p-8">
          <div className="mb-10 max-w-2xl">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-sky-700"><Sparkles className="h-3.5 w-3.5" /> Secrets-only monitoring</div>
            <h1 className="text-3xl font-extrabold tracking-[-0.06em] text-slate-950 sm:text-4xl">Watch the number,<br />not the keys.</h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-500">This hosted page is intentionally read-only. It does not collect, display, store, or forward source credentials, Telegram tokens, chat IDs, or access keys.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <SetupCard number="01" title="Add GitHub Secrets" detail="Store source settings and Telegram credentials only in repository Actions Secrets." href={settingsUrl} action="Open Secrets" />
            <SetupCard number="02" title="Run the workflow" detail="GitHub Actions checks the configured target every five minutes, with a bounded read-only window." href={actionsUrl} action="Open Actions" />
            <SetupCard number="03" title="Read the signal" detail="The worker normalizes Myanmar phone numbers and compares only non-secret state." />
            <SetupCard number="04" title="Receive Telegram" detail="Telegram receives a notice only after a detected number change. Slip confirmation is never submitted." />
          </div>

          <div className="mt-7 flex gap-3 rounded-3xl border border-sky-100 bg-sky-50/65 p-5">
            <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-sky-700" />
            <div><p className="text-sm font-extrabold text-slate-900">No dashboard control plane</p><p className="mt-1 text-xs leading-5 text-slate-600">Vercel hosts this static status interface only. GitHub Secrets and GitHub Actions own configuration and execution, so there is no Vercel access key to type into this page.</p></div>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-[2rem] border border-slate-900/10 bg-slate-950 p-6 text-white shadow-[0_24px_60px_-38px_rgba(15,23,42,0.75)] sm:p-7">
            <div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Read-only status</p><span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_0_5px_rgba(74,222,128,0.12)]" /></div>
            <div className="mt-7"><p className="text-xs text-slate-400">Last detected phone number</p><p className="mt-2 font-[DM_Mono] text-2xl font-medium tracking-[-0.04em] text-white">{state.lastPhoneNumber ?? "— — —"}</p><p className="mt-2 text-xs text-slate-500">{formatTime(state.lastCheckedAt)}</p></div>
            <div className="mt-8 grid grid-cols-2 gap-3 border-t border-white/10 pt-5 text-xs"><div><p className="text-slate-500">Cadence</p><p className="mt-1 font-bold text-white">5 min</p></div><div><p className="text-slate-500">Check window</p><p className="mt-1 font-bold text-white">≤ 55 sec</p></div></div>
          </section>

          <section className="rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-[0_24px_70px_-48px_rgba(15,23,42,0.3)] backdrop-blur sm:p-7">
            <div className="flex items-center justify-between"><div><p className="text-sm font-extrabold tracking-[-0.035em] text-slate-950">Signal log</p><p className="mt-1 text-xs text-slate-500">Public non-secret worker state</p></div><RefreshCw className="h-4 w-4 text-slate-400" /></div>
            <div className="mt-6 space-y-4">{activity.length ? activity.map((event, index) => <div key={`${event.at}-${index}`} className="grid grid-cols-[55px_1fr] gap-3 text-xs"><span className="font-[DM_Mono] text-[10px] text-slate-400">{event.at ? new Date(event.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</span><span className={`leading-5 ${eventTone(event.status)}`}>{event.detail ?? "Worker event recorded."}</span></div>) : <p className="text-xs leading-5 text-slate-500">{stateMessage}</p>}</div>
          </section>

          <section className="rounded-[1.7rem] border border-rose-100 bg-rose-50/55 p-5"><div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" /><div><p className="text-sm font-extrabold text-slate-900">Read-only by design</p><p className="mt-1.5 text-xs leading-5 text-slate-600">The worker checks payment targets and never submits a five-digit transfer or slip confirmation.</p></div></div></section>
        </aside>
      </main>

      <footer className="relative mx-auto flex max-w-7xl flex-col justify-between gap-3 border-t border-slate-900/10 py-5 text-xs text-slate-500 sm:flex-row sm:items-center"><span>{stateMessage}</span><span className="inline-flex items-center gap-1.5 font-medium text-slate-700"><Github className="h-3.5 w-3.5" /> GitHub Secrets-only</span></footer>
    </div>
  );
}

function SetupCard({ number, title, detail, href, action }: { number: string; title: string; detail: string; href?: string; action?: string }) {
  return <div className="rounded-3xl border border-slate-200/80 bg-white/70 p-5"><div className="flex items-center justify-between"><span className="font-[DM_Mono] text-xs text-sky-700">{number}</span>{href ? <CircleCheck className="h-4 w-4 text-sky-600" /> : <BellRing className="h-4 w-4 text-slate-400" />}</div><h2 className="mt-5 text-base font-extrabold tracking-[-0.035em] text-slate-950">{title}</h2><p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>{href && action ? <a className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-sky-800 underline decoration-sky-300 underline-offset-4" href={href} target="_blank" rel="noreferrer">{action} <ArrowUpRight className="h-3.5 w-3.5" /></a> : null}</div>;
}
