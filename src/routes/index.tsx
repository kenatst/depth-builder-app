import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { CinematicOnboarding } from "@/components/reboot/CinematicOnboarding";
import { DiagnosisFlow } from "@/components/reboot/DiagnosisFlow";
import { Dissolve } from "@/components/reboot/Dissolve";
import { StartingPoint } from "@/components/reboot/StartingPoint";
import { CINE_SCREENS } from "@/lib/reboot-content";
import { useRebootState } from "@/lib/reboot-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "REBOOT — Rebuild your attention in 90 days" },
      {
        name: "description",
        content:
          "Measure how you focus today, then train sustained attention, recall and deep work with a program that adapts to you.",
      },
      { property: "og:title", content: "REBOOT — Rebuild your attention in 90 days" },
      {
        property: "og:description",
        content: "Less input. More depth. Start with a two-minute attention diagnosis.",
      },
    ],
  }),
  component: RebootApp,
});

function RebootApp() {
  const { state, patch, reset, completeSession, hydrated } = useRebootState();

  if (!hydrated) return <div className="min-h-[100dvh] bg-void" />;

  return (
    <AnimatePresence mode="wait">
      {state.phase === "cinematic" && (
        <motion.div key="cine" exit={{ opacity: 1 }}>
          <CinematicOnboarding
            index={state.screen}
            onAdvance={() =>
              patch({ screen: Math.min(state.screen + 1, CINE_SCREENS.length - 1) })
            }
            onBack={() => patch({ screen: Math.max(0, state.screen - 1) })}
            onSkip={() => patch({ phase: "dissolve" })}
            onBegin={() => patch({ phase: "dissolve" })}
          />
        </motion.div>
      )}

      {state.phase === "dissolve" && (
        <Dissolve key="dissolve" onDone={() => patch({ phase: "diagnosis" })} />
      )}

      {state.phase === "diagnosis" && (
        <motion.div key="diag" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <DiagnosisFlow
            answers={state.answers}
            step={state.step}
            onAnswers={(answers) => patch({ answers })}
            onStep={(step) => patch({ step })}
            onComplete={() => patch({ phase: "report" })}
          />
        </motion.div>
      )}

      {state.phase === "report" && (
        <motion.div key="report" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <StartingPoint answers={state.answers} onRestart={reset} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
