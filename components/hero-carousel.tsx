"use client";

import React from "react";
import Image from "next/image";

type BrandLogo = {
  src: string;
  label: string;
};

const allLogos: BrandLogo[] = [
  {
    src: "/brands/342045552_264830236025844_6486536419961059087_n.jpg",
    label: "Brand 1",
  },
  { src: "/brands/548b64086f65eda8216ec65d3bb4fa44.jpg", label: "Brand 2" },
  { src: "/brands/attachment_68653513.jpg", label: "Brand 3" },
  { src: "/brands/Boat_Logo.webp", label: "Boat" },
  {
    src: "/brands/BrandEmporio-Logos-04.webp",
    label: "Bose",
  },
  { src: "/brands/cbca1848a4eb31e0cd5e5978c6e959ae.jpg", label: "Brand 6" },
  { src: "/brands/images%20(7).png", label: "Brand 7" },
  { src: "/brands/image4_480x480.webp", label: "Brand 8" },
  { src: "/brands/images%20(2).png", label: "Brand 9" },
  { src: "/brands/images%20(3).png", label: "Brand 10" },
  { src: "/brands/images%20(5).png", label: "Brand 11" },
  { src: "/brands/images%20(6).png", label: "Brand 12" },
  { src: "/brands/Layer_20.avif", label: "JBL" },
  {
    src: "/brands/Angrakhaa_3.webp",
    label: "Philips",
  },
  { src: "/brands/unnamed.png", label: "Brand 15" },
];

const topRow = allLogos.slice(0, 5);
const middleRow = allLogos.slice(5, 10);
const bottomRow = allLogos.slice(10, 15);

function BrandLogoTile({ logo }: { logo: BrandLogo }) {
  return (
    <div className="hero-brand-logo-item">
      <Image
        src={logo.src}
        alt={`${logo.label} logo`}
        width={210}
        height={108}
        className="hero-brand-logo-img"
      />
    </div>
  );
}

function BrandRow({
  brands,
  reverse = false,
}: {
  brands: BrandLogo[];
  reverse?: boolean;
}) {
  return (
    <div className="hero-logo-row">
      <div
        className={`hero-logo-track ${reverse ? "hero-logo-track-reverse" : "hero-logo-track-forward"}`}
      >
        {[...brands, ...brands].map((logo, index) => (
          <BrandLogoTile key={`${logo.src}-${index}`} logo={logo} />
        ))}
      </div>
    </div>
  );
}

export function HeroCarousel() {
  return (
    <div
      className="hero-logo-marquee"
      aria-label="Top companies selling on Amazon"
    >
      <BrandRow brands={topRow} />
      <BrandRow brands={middleRow} reverse />
      <BrandRow brands={bottomRow} />
    </div>
  );
}
