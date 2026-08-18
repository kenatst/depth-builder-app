import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Answers } from "@/lib/reboot-diagnosis";
import { prescriptionFor, type SessionFeedback } from "@/lib/reboot-program";
import type { Tab } from "@/lib/reboot-store";
import { BottomNav } from "./BottomNav";
import { ComingNext } from "./ComingNext";
import { SessionRunner } from "./SessionRunner";
import { TodayScreen } from "./TodayScreen";

const EASE = [0.22, 0.9, 0.24, 1] as const;

export function AppShell({
  answers,
  tab,
  day,
  sessions,
  onTab,
  onSession,
}: {
  answers: Answers;
  tab: Tab;
  day: number;
  sessions: SessionFeedback[];
  onTab: (t: Tab) => void;
  onSession: (f: SessionFeedback) => void;
}) {
  const [running, setRunning] = useState(false);
  const todaySession = sessions.find((s) => s.day === day);

  return (
    <div className="min-h-[100dvh] bg-paper text-ink">
      <div className="safe-top">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10, scale: 0.995 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.995 }}
            transition={{ duration: 0.24, ease: EASE }}
          >
            {tab === "today" ? (
              <TodayScreen
                answers={answers}
                day={day}
                session={todaySession}
                onStart={() => setRunning(true)}
              />
            ) : (
              <ComingNext tab={tab} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <BottomNav tab={tab} onTab={onTab} />

      <AnimatePresence>
        {running && (
          <SessionRunner
            prescription={prescriptionFor(answers, day)}
            onClose={() => setRunning(false)}
            onComplete={(f) => {
              onSession(f);
              setRunning(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
