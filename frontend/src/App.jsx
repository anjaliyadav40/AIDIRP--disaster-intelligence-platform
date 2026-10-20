
import { useEffect, useState } from "react";
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowUpRight,
  Bell, CheckCircle2, ChevronDown, Clock3, CloudLightning,
  Flame, LayoutDashboard, MapPin, Menu, Radio, RefreshCw,
  Search, ShieldAlert, ShieldCheck, Users, Waves, Plus, X, Send,
} from "lucide-react";

const API = "http://127.0.0.1:8000";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Incidents", icon: ShieldAlert },
  { label: "Live Map", icon: MapPin },
  { label: "Analytics", icon: Activity },
];

const hazardIcons = {
  flood: Waves,
  fire: Flame,
  earthquake: Activity,
  cyclone: CloudLightning,
};

function severityClass(value = "medium") {
  return {
    critical: "bg-red-500/15 text-red-300 ring-red-500/20",
    high: "bg-orange-500/15 text-orange-300 ring-orange-500/20",
    medium: "bg-amber-500/15 text-amber-300 ring-amber-500/20",
    low: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/20",
  }[value.toLowerCase()] || "bg-slate-500/15 text-slate-300 ring-slate-500/20";
}

function StatCard({ title, value, subtitle, icon: Icon, color, trend }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#101b2d] p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
            {value}
          </p>
        </div>
        <div className={`rounded-xl p-3 ${color}`}>
          <Icon size={21} />
        </div>
      </div>
      <div className="mt-5 flex items-center gap-2 text-xs text-slate-400">
        {trend && <span className="text-slate-300">{trend}</span>}
        <span>{subtitle}</span>
      </div>
    </div>
  );
}

function App() {
  const [incidents, setIncidents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formMessage, setFormMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    title: "",
    hazard_type: "flood",
    severity: "medium",
    latitude: "",
    longitude: "",
    description: "",
  });

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [incidentResponse, statsResponse] = await Promise.all([
        fetch(`${API}/incidents?limit=100`),
        fetch(`${API}/dashboard/stats`),
      ]);

      if (!incidentResponse.ok || !statsResponse.ok) {
        throw new Error("The API returned an error. Check your backend.");
      }

      const incidentData = await incidentResponse.json();
      const statsData = await statsResponse.json();

      setIncidents(incidentData.incidents || []);
      setStats(statsData);
    } catch {
      setError("Cannot connect to the backend. Start FastAPI on port 8000.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReportSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setFormMessage("");
    setFormError("");

    try {
      const response = await fetch(`${API}/incidents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.detail
            ? JSON.stringify(result.detail)
            : "Could not save the incident."
        );
      }

      setFormMessage(`Incident #${result.id} saved successfully!`);
      setForm({
        title: "",
        hazard_type: "flood",
        severity: "medium",
        latitude: "",
        longitude: "",
        description: "",
      });

      await loadData();
    } catch (err) {
      setFormError(err.message || "Unable to connect to the API.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredIncidents = incidents.filter((item) => {
    const matchesSearch =
      `${item.title} ${item.hazard_type} ${item.status}`
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesSeverity =
      severityFilter === "all" ||
      item.severity?.toLowerCase() === severityFilter;

    return matchesSearch && matchesSeverity;
  });

  const number = (value) =>
    typeof value === "number" ? value : 0;

  return (
    <div className="min-h-screen bg-[#0a1220] text-slate-200">
      {mobileMenu && (
        <button
          aria-label="Close menu"
          onClick={() => setMobileMenu(false)}
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/[0.07] bg-[#0d1728] transition-transform lg:translate-x-0 ${
          mobileMenu ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center gap-3 border-b border-white/[0.07] px-6">
          <div className="rounded-xl bg-cyan-400/10 p-2.5 text-cyan-300">
            <Activity size={25} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wide text-white">
              AIDIRP
            </h1>
            <p className="text-[10px] tracking-[0.2em] text-slate-500">
              DISASTER INTELLIGENCE
            </p>
          </div>
        </div>

        <div className="px-4 pt-7">
          <p className="mb-3 px-3 text-[10px] font-semibold tracking-[0.2em] text-slate-500">
            WORKSPACE
          </p>

          {navItems.map(({ label, icon: Icon }) => (
            <button
              key={label}
              onClick={() => {
                setActiveNav(label);
                setMobileMenu(false);
              }}
              className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
                activeNav === label
                  ? "bg-cyan-400/10 font-medium text-cyan-300"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <Icon size={18} />
              {label}
              {label === "Incidents" && incidents.length > 0 && (
                <span className="ml-auto rounded-md bg-white/[0.06] px-2 py-0.5 text-xs">
                  {incidents.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="mt-auto p-4">
          <div className="rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.05] p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-cyan-300">
              <Radio size={15} />
              SYSTEM STATUS
            </div>
            <p className="mt-3 text-sm text-white">
              {error ? "Connection issue" : loading ? "Connecting..." : "Monitoring active"}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              {error ? "API unavailable" : "Incident data from AIDIRP API"}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${error ? "bg-red-400" : loading ? "bg-amber-400" : "bg-emerald-400"}`} />
              <span className="text-xs text-slate-400">
                {error ? "Disconnected" : loading ? "Loading data" : "API response received"}
              </span>
            </div>
          </div>
          <p className="mt-5 text-center text-[10px] text-slate-600">
            AIDIRP PROTOTYPE · v1.0
          </p>
        </div>
      </aside>

      <main className="min-h-screen lg:pl-64">
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-white/[0.07] bg-[#0a1220]/90 px-4 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenu(true)}
              className="rounded-lg p-2 hover:bg-white/5 lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={21} />
            </button>
            <div>
              <p className="text-xs text-slate-500">Workspace / Overview</p>
              <h2 className="mt-1 text-lg font-semibold text-white">
                {activeNav}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <span className="hidden items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.07] px-3 py-2 text-xs text-emerald-300 sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              {error ? "Offline" : loading ? "Connecting" : "API Connected"}
            </span>
            <button
              onClick={loadData}
              title="Refresh data"
              className="rounded-xl border border-white/10 p-2.5 text-slate-400 hover:bg-white/5 hover:text-white"
            >
              <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              aria-label="Notifications"
              className="relative rounded-xl border border-white/10 p-2.5 text-slate-400 hover:bg-white/5"
            >
              <Bell size={17} />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-orange-400" />
            </button>
            <div className="hidden h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-sm font-bold text-white sm:flex">
              A
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] p-4 sm:p-8">
          <section className="relative overflow-hidden rounded-3xl border border-cyan-400/15 bg-gradient-to-br from-[#102b43] via-[#102238] to-[#10182b] p-6 sm:p-8">
            <div className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full border border-cyan-300/10" />
            <div className="pointer-events-none absolute -right-2 -top-14 h-44 w-44 rounded-full border border-cyan-300/10" />

            <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
              <div className="max-w-xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.08] px-3 py-1.5 text-[10px] font-semibold tracking-[0.16em] text-cyan-200">
                  <Activity size={13} />
                  DISASTER RESPONSE CENTER
                </div>
                <h3 className="text-2xl font-semibold leading-tight text-white sm:text-3xl">
                  Predict Risks.{" "}
                  <span className="text-cyan-300">Detect Disasters.</span>
                  <br className="hidden sm:block" /> Coordinate Response.
                </h3>
                <p className="mt-3 max-w-lg text-sm leading-6 text-slate-400">
                  Monitor reported hazards, review incident severity, and
                  coordinate situational awareness from one dashboard.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-white/10 bg-black/10 p-4">
                <div className="rounded-xl bg-cyan-400/10 p-3 text-cyan-300">
                  <ShieldCheck size={26} />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">AIDIRP Core</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Incident intelligence
                  </p>
                  <p className="mt-2 text-xs text-cyan-300">
                    Prototype environment
                  </p>
                </div>
              </div>
            </div>
          </section>

          {error && (
            <div className="mt-6 flex flex-col gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.06] p-4 text-sm text-red-200 sm:flex-row sm:items-center sm:justify-between">
              <p>{error}</p>
              <button onClick={loadData} className="font-semibold underline">
                Retry connection
              </button>
            </div>
          )}

          <section className="mt-7">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-white">
                  Situation overview
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Summary of currently recorded incidents
                </p>
              </div>
              <span className="text-xs text-slate-500">
                {loading ? "Updating..." : "Data from your local database"}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Total Incidents"
                value={number(stats?.total_incidents)}
                subtitle="Recorded in database"
                icon={Activity}
                color="bg-cyan-400/10 text-cyan-300"
                trend={<ArrowUpRight size={14} />}
              />
              <StatCard
                title="Critical Severity"
                value={number(stats?.by_severity?.critical)}
                subtitle="Require urgent review"
                icon={AlertTriangle}
                color="bg-red-400/10 text-red-300"
                trend={<ShieldAlert size={14} />}
              />
              <StatCard
                title="Under Investigation"
                value={number(stats?.by_status?.Investigating)}
                subtitle="Currently investigating"
                icon={Clock3}
                color="bg-amber-400/10 text-amber-300"
                trend={<ArrowDownRight size={14} />}
              />
              <StatCard
                title="Pending Verification"
                value={number(stats?.pending_verification)}
                subtitle="Awaiting review"
                icon={Users}
                color="bg-violet-400/10 text-violet-300"
                trend={<Activity size={14} />}
              />
            </div>
          </section>

          <section className="mt-7 grid gap-5 xl:grid-cols-[1.5fr_1fr]">
            <div className="rounded-2xl border border-white/[0.07] bg-[#101b2d] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white">Hazard distribution</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Incidents grouped by hazard type
                  </p>
                </div>
                <Activity size={19} className="text-cyan-300" />
              </div>

              <div className="mt-6 space-y-5">
                {Object.entries(stats?.by_hazard || {}).length === 0 && !loading && (
                  <p className="text-sm text-slate-500">No hazard data available yet.</p>
                )}
                {Object.entries(stats?.by_hazard || {}).map(([hazard, count]) => {
                  const Icon = hazardIcons[hazard] || AlertTriangle;
                  const percentage = stats.total_incidents
                    ? Math.round((count / stats.total_incidents) * 100)
                    : 0;

                  return (
                    <div key={hazard}>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm capitalize text-slate-300">
                          <Icon size={16} className="text-cyan-300" />
                          {hazard}
                        </div>
                        <span className="text-xs text-slate-400">
                          {count} · {percentage}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className="h-full rounded-full bg-cyan-400 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-[#101b2d] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white">Response status</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Current incident workflow
                  </p>
                </div>
                <CheckCircle2 size={19} className="text-emerald-300" />
              </div>

              <div className="mt-6 space-y-3">
                {[
                  { label: "Reported", color: "bg-cyan-400", text: "text-cyan-300" },
                  { label: "Investigating", color: "bg-amber-400", text: "text-amber-300" },
                  { label: "Resolved", color: "bg-emerald-400", text: "text-emerald-300" },
                ].map(({ label, color, text }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.02] p-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
                      <span className="text-sm text-slate-300">{label}</span>
                    </div>
                    <span className={`text-lg font-semibold ${text}`}>
                      {number(stats?.by_status?.[label])}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs leading-5 text-slate-500">
                Counts reflect the status values stored in the incident database.
              </p>
            </div>
          </section>

          <section className="mt-7 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#101b2d]">
            <div className="flex flex-col gap-4 border-b border-white/[0.07] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold text-white">Recent incidents</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Search and review submitted hazard reports
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setFormMessage("");
                    setFormError("");
                    setShowReportForm(true);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                >
                  <Plus size={17} />
                  Report Incident
                </button>
                <div className="flex min-w-0 items-center gap-2 rounded-xl border border-white/10 bg-[#0a1220] px-3 py-2">
                  <Search size={15} className="shrink-0 text-slate-500" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search incidents..."
                    className="w-full min-w-0 bg-transparent text-sm text-white outline-none placeholder:text-slate-600 sm:w-44"
                  />
                </div>
                <div className="relative">
                  <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    className="h-full appearance-none rounded-xl border border-white/10 bg-[#0a1220] py-2 pl-3 pr-8 text-sm text-slate-300 outline-none"
                  >
                    <option value="all">All severity</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                  <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead className="bg-white/[0.02] text-[10px] uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-medium">Incident</th>
                    <th className="px-5 py-4 font-medium">Hazard</th>
                    <th className="px-5 py-4 font-medium">Severity</th>
                    <th className="px-5 py-4 font-medium">Status</th>
                    <th className="px-5 py-4 font-medium">Verification</th>
                    <th className="px-5 py-4 font-medium">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {filteredIncidents.map((item) => {
                    const HazardIcon =
                      hazardIcons[item.hazard_type?.toLowerCase()] || AlertTriangle;

                    return (
                      <tr key={item.id} className="transition hover:bg-white/[0.025]">
                        <td className="px-5 py-4">
                          <p className="max-w-52 truncate text-sm font-medium text-white">
                            {item.title}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            ID #{item.id}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="flex items-center gap-2 text-sm capitalize text-slate-300">
                            <HazardIcon size={15} className="text-slate-400" />
                            {item.hazard_type}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`rounded-full px-2.5 py-1 text-xs capitalize ring-1 ring-inset ${severityClass(item.severity)}`}>
                            {item.severity}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-300">
                          {item.status}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-xs ${item.verification_status === "verified" ? "text-emerald-300" : item.verification_status === "rejected" ? "text-red-300" : "text-amber-300"}`}>
                            {item.verification_status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-400">
                          {Number(item.latitude).toFixed(3)},{" "}
                          {Number(item.longitude).toFixed(3)}
                        </td>
                      </tr>
                    );
                  })}
                  {!loading && filteredIncidents.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-5 py-12 text-center text-sm text-slate-500">
                        {error ? "Unable to load incidents." : "No matching incidents found."}
                      </td>
                    </tr>
                  )}
                  {loading && (
                    <tr>
                      <td colSpan="6" className="px-5 py-12 text-center text-sm text-slate-400">
                        Loading incidents...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.07] px-5 py-4 text-xs text-slate-500">
              <span>Showing {filteredIncidents.length} of {incidents.length} incidents</span>
              <span>Refresh to retrieve the latest API data</span>
            </div>
          </section>

          {showReportForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
              <div className="my-auto w-full max-w-xl rounded-2xl border border-white/10 bg-[#101b2d] p-6 shadow-2xl">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-white">Report a Disaster</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      Submit a new hazard report to AIDIRP.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowReportForm(false)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
                    aria-label="Close form"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleReportSubmit} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm text-slate-300">Incident title</label>
                    <input
                      required
                      minLength={3}
                      maxLength={120}
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="e.g. Flooding near residential area"
                      className="w-full rounded-xl border border-white/10 bg-[#0a1220] px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm text-slate-300">Hazard type</label>
                      <select
                        value={form.hazard_type}
                        onChange={(e) => setForm({ ...form, hazard_type: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-[#0a1220] px-3 py-3 text-sm text-white outline-none focus:border-cyan-400"
                      >
                        <option value="flood">Flood</option>
                        <option value="fire">Fire</option>
                        <option value="earthquake">Earthquake</option>
                        <option value="cyclone">Cyclone</option>
                        <option value="landslide">Landslide</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm text-slate-300">Severity</label>
                      <select
                        value={form.severity}
                        onChange={(e) => setForm({ ...form, severity: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-[#0a1220] px-3 py-3 text-sm text-white outline-none focus:border-cyan-400"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm text-slate-300">Latitude</label>
                      <input
                        type="number"
                        required
                        min="-90"
                        max="90"
                        step="any"
                        value={form.latitude}
                        onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                        placeholder="28.6139"
                        className="w-full rounded-xl border border-white/10 bg-[#0a1220] px-3 py-3 text-sm text-white outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm text-slate-300">Longitude</label>
                      <input
                        type="number"
                        required
                        min="-180"
                        max="180"
                        step="any"
                        value={form.longitude}
                        onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                        placeholder="77.2090"
                        className="w-full rounded-xl border border-white/10 bg-[#0a1220] px-3 py-3 text-sm text-white outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-slate-300">Description</label>
                    <textarea
                      maxLength={2000}
                      rows={3}
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Describe the reported situation..."
                      className="w-full resize-y rounded-xl border border-white/10 bg-[#0a1220] px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                    />
                  </div>

                  {formError && <p role="alert" className="text-sm text-red-300">{formError}</p>}
                  {formMessage && <p role="status" className="text-sm text-emerald-300">{formMessage}</p>}

                  <div className="flex flex-wrap justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowReportForm(false)}
                      className="rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-300 hover:bg-white/5"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-50"
                    >
                      <Send size={16} />
                      {saving ? "Submitting..." : "Submit Report"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <footer className="flex flex-col justify-between gap-2 py-7 text-xs text-slate-600 sm:flex-row">
            <span>AIDIRP · AI-Powered Disaster Intelligence and Response Platform</span>
            <span>Academic prototype · Verify reports before real-world decisions</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default App;
