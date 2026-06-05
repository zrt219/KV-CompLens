import type { SocialLink } from "../socials";

export type SocialPlacement = "sidebar" | "footer" | "about" | "export";

export function isRenderableSocialUrl(url: string) {
  const normalized = url.trim();
  if (!normalized || /todo|placeholder/i.test(normalized)) return false;
  return normalized.startsWith("https://") || normalized.startsWith("mailto:");
}

export function validateSocialLinks(links: SocialLink[]) {
  const seenIds = new Set<string>();
  const seenUrls = new Set<string>();
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const link of links) {
    if (seenIds.has(link.id)) {
      errors.push(`Duplicate social link id: ${link.id}`);
    }
    seenIds.add(link.id);

    if (link.url && !isRenderableSocialUrl(link.url)) {
      errors.push(`Invalid social link URL for ${link.id}: ${link.url}`);
    }

    if (link.url && seenUrls.has(link.url)) {
      warnings.push(`Duplicate social link URL: ${link.url}`);
    }
    if (link.url) {
      seenUrls.add(link.url);
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}

export function getSocialLinksForPlacement(
  links: SocialLink[],
  placement: SocialPlacement,
  employerOnly = false
) {
  return links.filter((link) => {
    if (!isRenderableSocialUrl(link.url)) return false;
    if (employerOnly && !link.employerFacing) return false;
    if (placement === "sidebar") return link.showInSidebar;
    if (placement === "footer") return link.showInFooter;
    if (placement === "about") return link.showInAbout;
    return link.employerFacing;
  });
}

