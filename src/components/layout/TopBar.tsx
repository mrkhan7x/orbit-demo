import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Search, Bell, Command, User, Settings, LogOut, CheckCircle2 } from "lucide-react";
import { useGlobalStore } from "@/stores/globalStore";
import { cn } from "@/utils/cn";
import { motion, AnimatePresence } from "framer-motion";

const PAGE_TITLES: Record<string, string> = {
  "/":           "Dashboard",
  "/tasks":      "Tasks",
  "/habits":     "Habits",
  "/goals":      "Goals",
  "/notes":      "Notes",
  "/calendar":   "Calendar",
  "/databases":  "Databases",
  "/analytics":  "Analytics",
  "/settings":   "Settings",
};

export function TopBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { setCommandPaletteOpen } = useGlobalStore();
  const title = PAGE_TITLES[pathname] ?? "Orbit";

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header
      className="flex items-center justify-between h-14 px-5 shrink-0"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "var(--bg-app)" }}
    >
      {/* Page title */}
      <h1 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h1>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Search / Command palette trigger */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className={cn(
            "flex items-center gap-2 h-8 px-3 rounded-lg text-xs text-[var(--text-muted)]",
            "bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10",
            "transition-all duration-150"
          )}
          title="Open command palette (Ctrl+K)"
        >
          <Search size={13} />
          <span className="hidden sm:inline">Search or jump to…</span>
          <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-white/10 font-mono">
            <Command size={9} />K
          </kbd>
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={cn(
              "relative w-8 h-8 rounded-lg flex items-center justify-center transition-all",
              showNotifications ? "bg-white/10 text-[var(--text-primary)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5"
            )}
            title="Notifications"
          >
            <Bell size={15} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          </button>
          
          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-72 rounded-xl shadow-2xl overflow-hidden z-50 border border-white/10 glass"
              >
                <div className="px-4 py-3 border-b border-white/5 bg-[var(--bg-card)] flex items-center justify-between">
                  <span className="text-sm font-medium">Notifications</span>
                  <button className="text-[10px] text-[var(--accent)] hover:underline">Mark all read</button>
                </div>
                <div className="p-2 max-h-64 overflow-y-auto bg-[var(--bg-panel)]">
                  <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                      <Bell size={14} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">Overdue Task</p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-2">"Finish Project Proposal" is 2 days overdue.</p>
                      <span className="text-[10px] text-[var(--text-muted)] mt-1 block">Just now</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={14} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">Goal Achieved</p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-2">You hit your reading goal for the week!</p>
                      <span className="text-[10px] text-[var(--text-muted)] mt-1 block">2 hours ago</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User avatar */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0 cursor-pointer border border-transparent hover:border-white/20 transition-all"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-secondary))" }}
            title="Account"
          >
            R
          </button>
          
          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-56 rounded-xl shadow-2xl overflow-hidden z-50 border border-white/10 glass bg-[var(--bg-panel)]"
              >
                <div className="px-4 py-3 border-b border-white/5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white shrink-0"
                       style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-secondary))" }}>
                    R
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-[var(--text-primary)]">Romeo</span>
                    <span className="text-xs text-[var(--text-muted)]">romeo@orbit.app</span>
                  </div>
                </div>
                <div className="p-1.5">
                  <button 
                    onClick={() => { navigate("/settings"); setShowProfile(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 rounded-lg transition-colors text-left"
                  >
                    <Settings size={15} /> Account Settings
                  </button>
                  <button 
                    onClick={() => { setShowProfile(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 rounded-lg transition-colors text-left"
                  >
                    <User size={15} /> Upgrade to Pro
                  </button>
                  <div className="h-px bg-white/5 my-1 mx-2" />
                  <button 
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-left"
                  >
                    <LogOut size={15} /> Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
