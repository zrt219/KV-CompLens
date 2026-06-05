"use client";

import {
  AtSign,
  ExternalLink,
  Globe2,
  Link,
  Mail,
  MonitorPlay,
  Radio,
  UserRound
} from "lucide-react";
import type { ComponentType } from "react";
import type { SocialLink } from "../../lib/socials";

type SocialLinkButtonProps = {
  link: SocialLink;
  variant?: "icons" | "compact" | "full";
};

const socialIcons: Record<SocialLink["kind"], ComponentType<{ size?: number; "aria-hidden"?: boolean }>> = {
  github: UserRound,
  portfolio: Globe2,
  demo: MonitorPlay,
  linkedin: Link,
  x: ExternalLink,
  youtube: MonitorPlay,
  instagram: AtSign,
  kick: Radio,
  email: Mail
};

export function SocialLinkButton({ link, variant = "compact" }: SocialLinkButtonProps) {
  const Icon = socialIcons[link.kind] ?? ExternalLink;
  const iconOnly = variant === "icons";
  const accessibleLabel = `Open ZRT ${link.label}.`;

  return (
    <a
      className={`social-link-button ${variant}`}
      href={link.url}
      target={link.url.startsWith("mailto:") ? undefined : "_blank"}
      rel={link.url.startsWith("mailto:") ? undefined : "noopener noreferrer"}
      aria-label={iconOnly ? accessibleLabel : undefined}
      title={accessibleLabel}
    >
      <Icon size={15} aria-hidden />
      {!iconOnly && <span>{variant === "full" ? link.label : link.shortLabel}</span>}
      {variant === "full" && <ExternalLink size={13} aria-hidden className="social-link-external" />}
    </a>
  );
}
