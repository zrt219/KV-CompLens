"use client";

import { usePracticeMode } from "../../../hooks/usePracticeMode";
import { IconButton } from "../ui/IconButton";
import { X } from "lucide-react";
import { tutorialIntro, tutorialSteps } from "../../../lib/tutorial";

export function PracticeCoachOverlay() {
  const { isOverlayVisible, toggleOverlay } = usePracticeMode();

  if (!isOverlayVisible) return null;

  return (
    <div className="fixed bottom-6 left-6 w-96 bg-white border border-[var(--border-color)] rounded-xl shadow-2xl z-50 flex flex-col max-h-[80vh] overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b border-[var(--border-color)] bg-slate-50">
        <h3 className="font-semibold text-[var(--text-color)]">Practice Coach</h3>
        <IconButton
          icon={<X size={18} />}
          aria-label="Close Practice Coach"
          variant="ghost"
          size="sm"
          onClick={toggleOverlay}
        />
      </div>

      <div className="p-4 overflow-y-auto">
        <div className="mb-4">
          <p className="text-sm text-[var(--text-muted)]">{tutorialIntro}</p>
        </div>

        <div className="space-y-4">
          {tutorialSteps.map((step, idx) => (
            <div key={idx} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                  {idx + 1}
                </div>
                {idx < tutorialSteps.length - 1 && <div className="w-px h-full bg-[var(--border-color)] mt-1" />}
              </div>
              <div className="pb-4">
                <h4 className="text-sm font-semibold text-[var(--text-color)]">{step.title}</h4>
                <p className="text-sm text-[var(--text-muted)] mt-1">{step.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-[var(--border-color)] bg-slate-50 flex justify-between items-center text-xs text-[var(--text-muted)]">
        <span>Press <kbd className="px-1 py-0.5 bg-white border rounded shadow-sm">Esc</kbd> to minimize</span>
        <span><kbd className="px-1 py-0.5 bg-white border rounded shadow-sm">Ctrl+Shift+H</kbd> to hide</span>
      </div>
    </div>
  );
}
