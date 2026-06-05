"use client";

import { BadgeCheck } from "lucide-react";
import { SocialLinks } from "./SocialLinks";

type BuilderAttributionProps = {
  placement?: "sidebar" | "about";
};

export function BuilderAttribution({ placement = "sidebar" }: BuilderAttributionProps) {
  return (
    <section className={`builder-attribution ${placement}`} aria-label="Builder attribution">
      <div className="builder-attribution-head">
        <BadgeCheck size={15} aria-hidden />
        <span>Proof of work</span>
      </div>
      <strong>Built by ZRT</strong>
      <p>Deterministic AI product review system by Zhane Grey.</p>
      <SocialLinks placement={placement} variant={placement === "sidebar" ? "compact" : "full"} employerOnly />
    </section>
  );
}

