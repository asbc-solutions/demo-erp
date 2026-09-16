import { cn } from "@/src/shared/lib/utils/utils";

type OnboardingShellProps = Readonly<{
  children: React.ReactNode;
  className?: string;
  /** Rotation angle (deg) for the soft radial-gradient backdrop blob. */
  blobRotation?: number;
}>;

export function OnboardingShell({
  children,
  className,
  blobRotation = -64,
}: OnboardingShellProps) {
  return (
    <main className="relative flex min-h-svh w-full items-center justify-center overflow-hidden bg-surface-page">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        {/* The gradient itself lives in the `auth-glow` utility so this element
            carries no color properties for extensions such as Dark Reader to
            rewrite before hydration. Only the per-step rotation is dynamic. */}
        <div
          className="auth-glow absolute top-1/2 left-1/2 h-[1665px] w-[1258px] transition-transform duration-700 ease-out"
          style={{ transform: `translate(-90%, -40%) rotate(${blobRotation}deg)` }}
        />
      </div>

      <div
        className={cn(
          "relative flex w-full max-w-[672px] flex-col items-stretch gap-6 px-6 py-10",
          className,
        )}
      >
        {children}

        <p className="text-content-quaternary text-center text-[11px] leading-[15.4px] font-normal">
          Powered by{" "}
          <span className="bg-gradient-to-br from-indigo-500 to-violet-500 bg-clip-text font-medium text-transparent">
            Nucleus
          </span>
        </p>
      </div>
    </main>
  );
}
