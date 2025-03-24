import React from "react";

export const MeshGradientBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 w-screen h-screen">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        id="mesh-gradient"
        className="absolute w-screen h-screen"
        viewBox="0 0 1000 500"
        preserveAspectRatio="none"
      >
        <defs>
          <filter
            id="blur"
            filterUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="1000"
            height="500"
          >
            <feGaussianBlur stdDeviation="100" />
          </filter>
          <filter id="noise" x="0" y="0" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="1"
              octaves="3"
              result="turbulence"
              stitchTiles="stitch"
            />
            <feBlend in="SourceGraphic" in2="turbulence" mode="overlay" />
          </filter>
        </defs>
        <rect id="background" width="100%" height="100%" fill="#FFFFFF" />
        <g id="swatches" width="1000" height="500" filter="url(#blur)">
          <rect
            x="396.1936566558326"
            y="43.13407314793835"
            width="556.3113642467323"
            height="816.2099921232223"
            fill="#D68FD6"
          />
          <rect
            x="256.28660486681616"
            y="-236.23647466716508"
            width="522.3218306832101"
            height="530.4200312990731"
            fill="#C5A2F6"
          />
          <rect
            x="260.0679322665963"
            y="-179.91168407409498"
            width="758.6197233299484"
            height="437.63141107034386"
            fill="#6564DB"
          />
          <rect
            x="6.104287563712944"
            y="-107.74832606122871"
            width="522.6157292358629"
            height="530.6045045394022"
            fill="#17BEBB"
          />
        </g>
        <rect
          x="0"
          y="0"
          width="1000"
          height="500"
          style={{
            mixBlendMode: "soft-light",
            filter: "url(#noise)",
            opacity: 0.2,
          }}
        />
      </svg>
    </div>
  );
};
