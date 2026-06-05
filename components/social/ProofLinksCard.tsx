"use client";

import { BuilderAttribution } from "./BuilderAttribution";
import { SocialLinks } from "./SocialLinks";

export function ProofLinksCard() {
  return (
    <aside className="proof-links-card" aria-label="Builder links">
      <BuilderAttribution placement="about" />
      <details>
        <summary>More public builder profiles</summary>
        <SocialLinks placement="about" variant="compact" employerOnly={false} />
      </details>
    </aside>
  );
}

