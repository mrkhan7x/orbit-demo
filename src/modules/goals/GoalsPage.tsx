import { useEffect, useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { useGoalStore } from "@/stores/goalStore";
import { Plus, Target, CheckCircle2, Trash2 } from "lucide-react";
import { ProgressBar } from "@/components/ui/Progress";

export function GoalsPage() {
  const { goals, loadGoals, addGoal, editGoal, removeGoal } = useGoalStore();
  const [newGoalTitle, setNewGoalTitle] = useState("");

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;
    addGoal({ title: newGoalTitle });
    setNewGoalTitle("");
  };

  return (
    <PageShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Goals</h2>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">Define and track your high-level objectives</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <form onSubmit={handleAddGoal} className="flex gap-2">
            <input
              type="text"
              value={newGoalTitle}
              onChange={(e) => setNewGoalTitle(e.target.value)}
              placeholder="What do you want to achieve?"
              className="flex-1 h-10 px-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
            />
            <button
              type="submit"
              className="h-10 px-4 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 flex items-center gap-2"
              style={{ background: "var(--accent)" }}
            >
              <Plus size={16} /> Add Goal
            </button>
          </form>

          {goals.length === 0 ? (
            <div className="card flex flex-col items-center justify-center py-20 text-center">
              <Target size={40} className="text-[var(--text-muted)] mb-3 opacity-50" />
              <p className="text-sm font-medium text-[var(--text-secondary)]">No goals defined</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Start by adding a new goal above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {goals.map((goal) => (
                <div key={goal.id} className="card p-4 flex flex-col gap-3 group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={goal.title}
                        onChange={(e) => editGoal(goal.id, { title: e.target.value })}
                        className="bg-transparent text-base font-bold text-[var(--text-primary)] outline-none w-full mb-1"
                      />
                      <input
                        type="text"
                        value={goal.description || ""}
                        onChange={(e) => editGoal(goal.id, { description: e.target.value })}
                        placeholder="Add description..."
                        className="bg-transparent text-sm text-[var(--text-muted)] outline-none w-full"
                      />
                    </div>
                    <button
                      onClick={() => removeGoal(goal.id)}
                      className="text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-[var(--text-muted)]">Progress</span>
                        <span className="font-medium text-[var(--text-primary)]">{goal.progress}%</span>
                      </div>
                      <ProgressBar value={goal.progress} size="md" color="accent" />
                    </div>
                    <div className="flex gap-1">
                      {[0, 25, 50, 75, 100].map((pct) => (
                        <button
                          key={pct}
                          onClick={() => editGoal(goal.id, { progress: pct, status: pct === 100 ? "completed" : "in_progress" })}
                          className={`w-8 h-6 rounded text-xs font-medium transition-colors ${
                            goal.progress >= pct ? "bg-[var(--accent)] text-white" : "bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                          }`}
                        >
                          {pct}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="card p-5">
            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4">Goal Summary</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-muted)]">Total Goals</span>
                <span className="font-medium text-[var(--text-primary)]">{goals.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-muted)]">Completed</span>
                <span className="font-medium text-[var(--success)]">
                  {goals.filter(g => g.status === "completed").length}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-muted)]">In Progress</span>
                <span className="font-medium text-[var(--accent)]">
                  {goals.filter(g => g.status === "in_progress" || (g.progress > 0 && g.progress < 100)).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
