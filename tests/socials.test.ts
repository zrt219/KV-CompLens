import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SocialLinkButton } from "../components/social/SocialLinkButton";
import { socialLinks, type SocialLink } from "../lib/socials";
import { getSocialLinksForPlacement, isRenderableSocialUrl, validateSocialLinks } from "../lib/socials/validateSocialLinks";

describe("social links", () => {
  it("keeps verified GitHub proof link available", () => {
    const github = socialLinks.find((link) => link.id === "github");

    expect(github?.url).toBe("https://github.com/zrt219");
    expect(github?.showInSidebar).toBe(true);
    expect(github?.employerFacing).toBe(true);
  });

  it("filters invalid and TODO URLs before rendering", () => {
    expect(isRenderableSocialUrl("")).toBe(false);
    expect(isRenderableSocialUrl("TODO add actual handle")).toBe(false);
    expect(isRenderableSocialUrl("http://example.com")).toBe(false);
    expect(isRenderableSocialUrl("https://github.com/zrt219")).toBe(true);

    const footerLinks = getSocialLinksForPlacement(socialLinks, "footer", true);
    expect(footerLinks.map((link) => link.id)).not.toContain("portfolio");
    expect(footerLinks.every((link) => isRenderableSocialUrl(link.url))).toBe(true);
  });

  it("filters non-employer profiles from employer-only placements", () => {
    const aboutEmployerLinks = getSocialLinksForPlacement(socialLinks, "about", true);
    const aboutAllLinks = getSocialLinksForPlacement(socialLinks, "about", false);

    expect(aboutEmployerLinks.every((link) => link.employerFacing)).toBe(true);
    expect(aboutEmployerLinks.map((link) => link.id)).not.toContain("kick");
    expect(aboutAllLinks.map((link) => link.id)).toContain("kick");
  });

  it("rejects duplicate ids and invalid URLs", () => {
    const invalidLinks: SocialLink[] = [
      socialLinks[0],
      { ...socialLinks[0], url: "https://example.com/other" },
      { ...socialLinks[1], id: "bad", url: "ftp://example.com" }
    ];
    const result = validateSocialLinks(invalidLinks);

    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/Duplicate social link id|Invalid social link URL/);
  });

  it("renders safe external attributes and icon-only aria labels", () => {
    const github = socialLinks.find((link) => link.id === "github");
    expect(github).toBeDefined();

    const compactMarkup = renderToStaticMarkup(createElement(SocialLinkButton, { link: github as SocialLink, variant: "compact" }));
    const iconMarkup = renderToStaticMarkup(createElement(SocialLinkButton, { link: github as SocialLink, variant: "icons" }));

    expect(compactMarkup).toContain('target="_blank"');
    expect(compactMarkup).toContain('rel="noopener noreferrer"');
    expect(iconMarkup).toContain('aria-label="Open ZRT GitHub profile."');
  });
});

