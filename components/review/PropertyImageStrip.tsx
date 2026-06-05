"use client";

import Image from "next/image";
import { Home } from "lucide-react";
import { useState } from "react";

type PropertyImageStripProps = {
  imageUrl?: string;
  propertyType: string;
  rank?: number;
  isSubject?: boolean;
  isActive?: boolean;
  isNewCandidate?: boolean;
};

export function PropertyImageStrip({
  imageUrl,
  propertyType,
  rank,
  isSubject,
  isActive,
  isNewCandidate
}: PropertyImageStripProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(imageUrl) && !imageFailed;

  return (
    <div className="review-property-image-strip">
      {showImage ? (
        <Image
          src={imageUrl as string}
          alt=""
          fill
          sizes="240px"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="review-property-image-fallback" aria-hidden="true">
          <Home size={22} />
          <span>{isSubject ? "Subject" : "Comparable"}</span>
        </div>
      )}
      <div className="review-image-shade" aria-hidden="true" />
      {rank && <span className="review-rank-badge">#{rank}</span>}
      <span className="review-property-type-badge">{isNewCandidate ? "New candidate" : propertyType}</span>
      {isActive && <span className="review-active-badge">Active</span>}
    </div>
  );
}

