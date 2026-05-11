import { PageShell } from "@/components/layout/PageShell";
import { Database } from "lucide-react";

export function DatabasesPage() {
  return (
    <PageShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Databases</h2>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">Custom spreadsheet-style databases</p>
        </div>
        <button className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
          style={{ background: "var(--accent)" }}>
          + New Database
        </button>
      </div>
      <div className="card flex flex-col items-center justify-center py-20 text-center">
        <Database size={40} className="text-[var(--text-muted)] mb-3" />
        <p className="text-sm font-medium text-[var(--text-secondary)]">Custom Database Builder coming in Phase 7</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">Reading Tracker · Finance · CRM · Gym · Any custom data</p>
      </div>
    </PageShell>
  );
}
