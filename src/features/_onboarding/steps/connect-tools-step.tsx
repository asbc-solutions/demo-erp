"use client";

import * as React from "react";

import { cn } from "@/src/shared/lib/utils/utils";

import { TOOLS, type ToolId } from "../options";
import { OnboardingButton } from "../onboarding-button";
import { StepBackButton } from "./step-back-button";

type ConnectToolsStepProps = Readonly<{
  defaultValue?: ToolId[];
  onBack: () => void;
  onSubmit: (tools: ToolId[]) => void;
}>;

export function ConnectToolsStep({
  defaultValue = [],
  onBack,
  onSubmit,
}: ConnectToolsStepProps) {
  const [selected, setSelected] = React.useState<Set<ToolId>>(
    () => new Set(defaultValue),
  );

  const toggle = (id: ToolId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(Array.from(selected));
      }}
    >
      <StepBackButton onClick={onBack} />

      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-content-primary text-[31px] leading-[37.2px] font-bold">
          Connect your tools.
        </h2>
        <p className="text-content-tertiary text-base leading-6 font-normal">
          You can always add more later.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((tool) => {
          const isSelected = selected.has(tool.id);
          return (
            <button
              key={tool.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => toggle(tool.id)}
              className={cn(
                "bg-surface-white flex flex-col items-start gap-1 rounded-2xl border p-4 text-left transition-all",
                "hover:border-brand-primary/40 hover:bg-brand-primary/5",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary",
                isSelected
                  ? "border-brand-primary bg-brand-primary/5 shadow-[0_0_0_1px_var(--color-brand-primary)]"
                  : "border-stroke-default",
              )}
            >
              <span className="text-[38px] leading-[47px]" aria-hidden>
                {tool.emoji}
              </span>
              <span className="text-content-primary text-base leading-[18px] font-medium">
                {tool.name}
              </span>
              <span className="text-content-tertiary text-xs leading-4 font-normal">
                {tool.description}
              </span>
            </button>
          );
        })}
      </div>

      <OnboardingButton type="submit">Launch Nucleus</OnboardingButton>
    </form>
  );
}
