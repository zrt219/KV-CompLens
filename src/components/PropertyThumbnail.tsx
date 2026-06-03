"use client";

import Image from "next/image";
import type { PropertyType } from "../../lib/types";

type PropertyThumbnailProps = {
  propertyType: PropertyType;
  seed?: string;
  isSubject?: boolean;
  isNew?: boolean;
  compact?: boolean;
  className?: string;
};

function hashSeed(seed = "kv-complens") {
  return Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

const propertyImages: Record<PropertyType, string[]> = {
  Detached: [
    "/property-placeholders/detached-dusk.png",
    "/property-placeholders/townhome-dusk.png"
  ],
  SemiDetached: [
    "/property-placeholders/semi-detached-dusk.png",
    "/property-placeholders/townhome-dusk.png"
  ],
  Townhouse: [
    "/property-placeholders/townhome-dusk.png",
    "/property-placeholders/semi-detached-dusk.png"
  ],
  Condo: [
    "/property-placeholders/condo-dusk.png",
    "/property-placeholders/townhome-dusk.png"
  ]
};

export function PropertyThumbnail({ propertyType, seed, isSubject, isNew, compact, className }: PropertyThumbnailProps) {
  const hasSeed = Boolean(seed?.trim());
  const hash = hashSeed(seed);
  const imageSet = propertyImages[propertyType];
  const imageSrc = hasSeed ? (isSubject ? imageSet[0] : imageSet[hash % imageSet.length]) : undefined;
  const label = propertyType === "SemiDetached" ? "Semi" : propertyType;
  const classNames = [
    "property-thumbnail",
    !hasSeed && "empty-thumb",
    isSubject && "subject-thumb",
    isNew && "new-thumb",
    compact && "compact-thumb",
    className
  ].filter(Boolean).join(" ");

  return (
    <div className={classNames} aria-hidden="true">
      {imageSrc ? (
        <Image src={imageSrc} alt="" fill sizes={compact ? "220px" : "320px"} priority={Boolean(isSubject)} />
      ) : (
        <div className="property-thumbnail-empty">
          <span>Waiting for property details</span>
        </div>
      )}
      <span>{hasSeed ? (isSubject ? "Subject" : label) : ""}</span>
    </div>
  );
}
