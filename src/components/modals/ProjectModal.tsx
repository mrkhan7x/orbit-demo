import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FolderPlus } from "lucide-react";
import { useProjectStore } from "@/stores/projectStore";

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultStatus?: "active" | "planned" | "completed";
}

const COLORS = [
  "#f87171", "#fb923c", "#fbbf24", "#4ade80", 
  "#38bdf8", "#818cf8", "#a78bfa", "#f472b6"
];

const ICONS = ["📁", "🚀", "📱", "💻", "📈", "🎨", "✍️", "💰", "🎓", "🏡"];

export function ProjectModal({ isOpen, onClose, defaultStatus = "planned" }: ProjectModalProps) {
  const { createProject } = useProjectStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"active" | "planned" | "completed">(defaultStatus);
  const [color, setColor] = useState(COLORS[0]);
  const [icon, setIcon] = useState(ICONS[0]);

  useEffect(() => {
    if (isOpen) {
      setName("");
      setDescription("");
      setStatus(defaultStatus);
      setColor(COLORS[0]);
      setIcon(ICONS[0]);
    }
  }, [isOpen, defaultStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    await createProject({ name, description, status, color, icon });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md bg-[var(--bg-card)] rounded-2xl shadow-2xl overflow-hidden border border-white/10"
      >
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[var(--bg-secondary)]">
          <div className="flex items-center gap-2">
            <FolderPlus size={18} className="text-[var(--accent)]" />
            <h3 className="font-bold text-[var(--text-primary)]">New Project</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-[var(--text-muted)] hover:text-white hover:bg-white/10 transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase mb-1.5">Project Name</label>
            <input 
              type="text" autoFocus required
              value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Website Redesign"
              className="w-full h-10 px-3 bg-[var(--bg-app)] border border-white/10 rounded-lg text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase mb-1.5">Description (Optional)</label>
            <textarea 
              value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief details about this project..."
              className="w-full h-20 p-3 bg-[var(--bg-app)] border border-white/10 rounded-lg text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase mb-1.5">Status</label>
              <select 
                value={status} onChange={(e) => setStatus(e.target.value as any)}
                className="w-full h-10 px-3 bg-[var(--bg-app)] border border-white/10 rounded-lg text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-colors cursor-pointer"
              >
                <option value="planned">Planned (Backlog)</option>
                <option value="active">Doing (Active)</option>
                <option value="completed">Done (Completed)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase mb-1.5">Color</label>
              <div className="flex flex-wrap gap-2">
                {COLORS.slice(0, 8).map(c => (
                  <button 
                    key={c} type="button"
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${color === c ? "border-white scale-110" : "border-transparent"}`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase mb-1.5">Icon</label>
            <div className="flex gap-2">
              {ICONS.map(i => (
                <button 
                  key={i} type="button"
                  onClick={() => setIcon(i)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all ${icon === i ? "bg-[var(--accent)]" : "bg-[var(--bg-app)] hover:bg-white/10"}`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-white transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={!name.trim()} className="px-5 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50" style={{ background: "var(--accent)" }}>
              Create Project
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
