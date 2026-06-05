export type SocialLink = {
  id: string;
  label: string;
  shortLabel: string;
  url: string;
  kind:
    | "github"
    | "portfolio"
    | "demo"
    | "linkedin"
    | "x"
    | "youtube"
    | "instagram"
    | "kick"
    | "email";
  showInFooter: boolean;
  showInSidebar: boolean;
  showInAbout: boolean;
  employerFacing: boolean;
};

export const socialLinks: SocialLink[] = [
  {
    id: "github",
    label: "GitHub profile",
    shortLabel: "GitHub",
    url: "https://github.com/zrt219",
    kind: "github",
    showInFooter: true,
    showInSidebar: true,
    showInAbout: true,
    employerFacing: true
  },
  {
    id: "demo",
    label: "KV CompLens live demo",
    shortLabel: "Live demo",
    url: "https://kv-complens.vercel.app",
    kind: "demo",
    showInFooter: true,
    showInSidebar: true,
    showInAbout: true,
    employerFacing: true
  },
  {
    id: "linkedin",
    label: "LinkedIn profile",
    shortLabel: "LinkedIn",
    url: "https://www.linkedin.com/in/zhane-grey-987258395",
    kind: "linkedin",
    showInFooter: true,
    showInSidebar: false,
    showInAbout: true,
    employerFacing: true
  },
  {
    id: "kick",
    label: "Kick profile",
    shortLabel: "Kick",
    url: "https://kick.com/zrt-219",
    kind: "kick",
    showInFooter: false,
    showInSidebar: false,
    showInAbout: true,
    employerFacing: false
  },
  {
    id: "portfolio",
    label: "Portfolio",
    shortLabel: "Portfolio",
    url: "",
    kind: "portfolio",
    showInFooter: true,
    showInSidebar: false,
    showInAbout: true,
    employerFacing: true
  },
  {
    id: "x",
    label: "X profile",
    shortLabel: "X",
    url: "",
    kind: "x",
    showInFooter: false,
    showInSidebar: false,
    showInAbout: true,
    employerFacing: false
  },
  {
    id: "youtube",
    label: "YouTube channel",
    shortLabel: "YouTube",
    url: "",
    kind: "youtube",
    showInFooter: false,
    showInSidebar: false,
    showInAbout: true,
    employerFacing: false
  },
  {
    id: "instagram",
    label: "Instagram profile",
    shortLabel: "Instagram",
    url: "",
    kind: "instagram",
    showInFooter: false,
    showInSidebar: false,
    showInAbout: true,
    employerFacing: false
  }
];

