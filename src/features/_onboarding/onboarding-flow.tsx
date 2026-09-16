"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { flush, now, track } from "@/src/features/marketing-tracking/lib/tracker";

import type { IndustryId, StageId, TeamSizeId, ToolId } from "./options";
import { OnboardingShell } from "./onboarding-shell";
import { OnboardingProgress } from "./onboarding-progress";
import { CompanyStep } from "./steps/company-step";
import { IndustryStep } from "./steps/industry-step";
import { TeamSizeStep } from "./steps/team-size-step";
import { ConnectToolsStep } from "./steps/connect-tools-step";
import { LoginStep } from "./steps/login-step";

const ONBOARDED_FLAG = "erp_onboarded";

type Phase = "company" | "industry" | "team-size" | "connect-tools" | "login";

type OnboardingState = {
  companyName: string;
  industry?: IndustryId;
  stage?: StageId;
  teamSize?: TeamSizeId;
  tools: ToolId[];
};

const TOTAL_STEPS = 4;

const STEP_INDEX: Record<Phase, number> = {
  company: 1,
  industry: 2,
  "team-size": 3,
  "connect-tools": 4,
  login: 0,
};

const BLOB_ROTATION: Record<Phase, number> = {
  company: -64,
  industry: 108.2,
  "team-size": 125.7,
  "connect-tools": -58.6,
  login: -58.6,
};

function subscribeToOnboardedFlag(onStoreChange: () => void): () => void {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === ONBOARDED_FLAG || event.key === null) {
      onStoreChange();
    }
  };

  window.addEventListener("storage", handleStorage);
  return () => window.removeEventListener("storage", handleStorage);
}

function getOnboardedFlagSnapshot(): boolean {
  try {
    return localStorage.getItem(ONBOARDED_FLAG) === "1";
  } catch {
    return false;
  }
}

/**
 * The server cannot know whether this browser has onboarded, so it always
 * renders the first step and lets the client correct itself after hydration.
 */
function getServerOnboardedFlagSnapshot(): boolean {
  return false;
}

export function OnboardingFlow() {
  const router = useRouter();
  const hasOnboardedFlag = React.useSyncExternalStore(
    subscribeToOnboardedFlag,
    getOnboardedFlagSnapshot,
    getServerOnboardedFlagSnapshot,
  );
  const [selectedPhase, setPhase] = React.useState<Phase | null>(null);
  const phase = selectedPhase ?? (hasOnboardedFlag ? "login" : "company");
  const [state, setState] = React.useState<OnboardingState>({
    companyName: "",
    tools: [],
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  function finishOnboarding(s: OnboardingState): void {
    setIsSubmitting(true);

    track({
      type: "onboarding-complete",
      at: now(),
      answers: {
        companyName: s.companyName || null,
        industry: s.industry ?? null,
        stage: s.stage ?? null,
        teamSize: s.teamSize ?? null,
        tools: s.tools,
      },
    });
    // The navigation below tears down this tree, so push the buffer out now
    // rather than waiting for the interval.
    flush(false);

    try {
      localStorage.setItem(ONBOARDED_FLAG, "1");
    } catch {
      // Blocked storage only costs the returning-visitor shortcut.
    }

    router.push("/command-center");
    router.refresh();
  }

  return (
    <OnboardingShell blobRotation={BLOB_ROTATION[phase]}>
      {phase !== "login" && (
        <OnboardingProgress current={STEP_INDEX[phase]} total={TOTAL_STEPS} />
      )}

      {phase === "company" && (
        <CompanyStep
          defaultValue={state.companyName}
          onSubmit={(companyName) => {
            setState((prev) => ({ ...prev, companyName }));
            track({
              type: "onboarding-step",
              at: now(),
              step: "company",
              answers: { companyName },
            });
            setPhase("industry");
          }}
        />
      )}

      {phase === "industry" && (
        <IndustryStep
          defaultIndustry={state.industry}
          defaultStage={state.stage}
          onBack={() => setPhase("company")}
          onSubmit={({ industry, stage }) => {
            setState((prev) => ({ ...prev, industry, stage }));
            track({
              type: "onboarding-step",
              at: now(),
              step: "industry",
              answers: { industry, stage },
            });
            setPhase("team-size");
          }}
        />
      )}

      {phase === "team-size" && (
        <TeamSizeStep
          defaultValue={state.teamSize}
          onBack={() => setPhase("industry")}
          onSubmit={(teamSize) => {
            setState((prev) => ({ ...prev, teamSize }));
            track({
              type: "onboarding-step",
              at: now(),
              step: "team-size",
              answers: { teamSize },
            });
            setPhase("connect-tools");
          }}
        />
      )}

      {phase === "connect-tools" && (
        <ConnectToolsStep
          defaultValue={state.tools}
          onBack={() => setPhase("team-size")}
          onSubmit={(tools) => {
            setState((prev) => ({ ...prev, tools }));
            track({
              type: "onboarding-step",
              at: now(),
              step: "connect-tools",
              answers: { tools },
            });
            setPhase("login");
          }}
        />
      )}

      {phase === "login" && (
        <LoginStep
          isSubmitting={isSubmitting}
          onSuccess={() => finishOnboarding(state)}
        />
      )}
    </OnboardingShell>
  );
}
