"use client";

import { socialLinks } from "../../lib/socials";
import { getSocialLinksForPlacement, type SocialPlacement } from "../../lib/socials/validateSocialLinks";
import { SocialLinkButton } from "./SocialLinkButton";

export type SocialLinksProps = {
  placement: SocialPlacement;
  variant?: "icons" | "compact" | "full";
  employerOnly?: boolean;
};

export function SocialLinks({ placement, variant = "compact", employerOnly = false }: SocialLinksProps) {
  const links = getSocialLinksForPlacement(socialLinks, placement, employerOnly);

  if (!links.length) return null;

  return (
    <nav className={`social-links ${placement} ${variant}`} aria-label="Builder proof links">
      {links.map((link) => (
        <SocialLinkButton key={link.id} link={link} variant={variant} />
      ))}
    </nav>
  );
}

