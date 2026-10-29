"use client";

import Image from "next/image";
import { useState } from "react";
import { asset } from "@/lib/assets";

export default function Gallery({ images, name }: { images: string[]; name: string }) {
  const [index, setIndex] = useState(0);

  return (
    <div className="gallery">
      <div className="gallery__main tilt">
        {/* Blurred copy fills the frame; the real photo sits on top uncropped. */}
        <Image
          key={`bg-${images[index]}`}
          src={asset(images[index])}
          alt=""
          aria-hidden
          fill
          sizes="(max-width: 900px) 92vw, 52vw"
          className="media-backdrop"
        />
        <Image
          key={images[index]}
          src={asset(images[index])}
          alt={`${name} — image ${index + 1} of ${images.length}`}
          fill
          sizes="(max-width: 900px) 92vw, 52vw"
          preload={index === 0}
          className="media-photo"
        />
        <span className="tilt__glare" aria-hidden="true" />
      </div>
      {images.length > 1 && (
        <div className="gallery__thumbs">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              className="gallery__thumb"
              aria-current={i === index}
              aria-label={`Show image ${i + 1}`}
              onClick={() => setIndex(i)}
            >
              <Image src={asset(src)} alt="" fill sizes="84px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
