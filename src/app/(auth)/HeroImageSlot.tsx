"use client";

import { useState } from "react";
import Image from "next/image";

export function HeroImageSlot() {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className="relative mx-auto mt-12 h-72 w-72">
      {!imageFailed && (
        <Image
          src="/images/hero-professional.png"
          alt="Profesional de oficios argentino"
          fill
          sizes="(max-width: 1024px) 0px, 288px"
          className="object-contain drop-shadow-2xl"
          priority
          onError={() => setImageFailed(true)}
        />
      )}
    </div>
  );
}
