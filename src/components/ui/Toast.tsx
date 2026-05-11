import { useToastStore } from "@/stores/toastStore";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`flex items-start gap-3 p-4 rounded-xl shadow-lg border w-80 backdrop-blur-md`}
            style={{
              background: "var(--bg-card)",
              borderColor:
                toast.type === "error"
                  ? "var(--danger)"
                  : toast.type === "success"
                  ? "var(--success)"
                  : "var(--info)",
            }}
          >
            <div className="mt-0.5">
              {toast.type === "error" && <AlertCircle size={18} style={{ color: "var(--danger)" }} />}
              {toast.type === "success" && <CheckCircle2 size={18} style={{ color: "var(--success)" }} />}
              {toast.type === "info" && <Info size={18} style={{ color: "var(--info)" }} />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-[var(--text-primary)]">{toast.title}</p>
              {toast.message && <p className="text-xs text-[var(--text-muted)] mt-0.5">{toast.message}</p>}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
