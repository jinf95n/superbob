"use client";

import { useState } from "react";

export function HeroImageSlot() {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className="relative mx-auto mt-12 h-72 w-72 overflow-hidden rounded-[20px] bg-white/10">
      {!imageFailed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/images/hero-professional.png"
          alt=""
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      )}
    </div>
  );
}
