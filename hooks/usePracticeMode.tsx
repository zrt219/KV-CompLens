"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from "react";

interface PracticeModeContextType {
  isActive: boolean;
  isOverlayVisible: boolean;
  toggleOverlay: () => void;
  hidePracticeMode: () => void;
}

const PracticeModeContext = createContext<PracticeModeContextType | undefined>(undefined);

function hasPracticeParam() {
  if (typeof window === "undefined") {
    return false;
  }
  return new URLSearchParams(window.location.search).get("practice") === "1";
}

export function PracticeModeProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(() => hasPracticeParam());
  const [isOverlayVisible, setIsOverlayVisible] = useState(() => hasPracticeParam());

  useEffect(() => {
    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+P to toggle practice mode overlay
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setIsActive(true);
        setIsOverlayVisible((v) => !v);
      }

      // Ctrl+Shift+H to hide everything practice related
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "h") {
        e.preventDefault();
        setIsActive(false);
        setIsOverlayVisible(false);
      }

      // Escape to close overlay only
      if (e.key === "Escape" && isOverlayVisible) {
        setIsOverlayVisible(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOverlayVisible]);

  return (
    <PracticeModeContext.Provider
      value={{
        isActive,
        isOverlayVisible,
        toggleOverlay: () => setIsOverlayVisible(v => !v),
        hidePracticeMode: () => {
          setIsActive(false);
          setIsOverlayVisible(false);
        }
      }}
    >
      {children}
    </PracticeModeContext.Provider>
  );
}

export function usePracticeMode() {
  const context = useContext(PracticeModeContext);
  if (context === undefined) {
    throw new Error("usePracticeMode must be used within a PracticeModeProvider");
  }
  return context;
}
