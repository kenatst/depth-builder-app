import { motion } from "motion/react";
import { CalendarRange, Dumbbell, Sun, User } from "lucide-react";
import type { Tab } from "@/lib/reboot-store";

const TABS: { id: Tab; label: string; Icon: typeof Sun }[] = [
  { id: "today", label: "Today", Icon: Sun },
  { id: "train", label: "Train", Icon: Dumbbell },
  { id: "program", label: "Program", Icon: CalendarRange },
  { id: "profile", label: "Profile", Icon: User },
];

export function BottomNav({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-5 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <nav
        className="pointer-events-auto flex w-full max-w-[24rem] items-center gap-1 rounded-full p-1.5"
        style={{
          background: "color-mix(in oklab, var(--paper-raised) 88%, transparent)",
          backdropFilter: "blur(20px)",
          boxShadow: "var(--shadow-lift)",
        }}
      >
        {TABS.map(({ id, label, Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => onTab(id)}
              aria-current={active ? "page" : undefined}
              className="relative flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-3 transition-transform duration-200 active:scale-[0.96]"
            >
              {active && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-full bg-ink"
                  transition={{ type: "spring", stiffness: 460, damping: 38 }}
                />
              )}
              <span
                className="relative flex items-center gap-1.5"
                style={{ color: active ? "var(--paper)" : "var(--ink-faint)" }}
              >
                <Icon size={17} strokeWidth={2.1} />
                <span className="text-[0.8125rem] font-medium tracking-[-0.01em]">
                  {active ? label : ""}
                </span>
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
