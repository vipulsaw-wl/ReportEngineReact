import React from 'react';
import worldlineLogoB64 from '../worldlineLogoB64';

/**
 * Worldline logo component.
 *
 * onDark=true  → white logo for teal/dark navy backgrounds
 *               Uses: invert(1) brightness(2) to flip the dark pixels white
 * onDark=false → full-colour logo for white/light backgrounds (default)
 */
export default function WLLogo({ height = 22, onDark = false, style }) {
  const width = Math.round(height * (154 / 34));

  return (
    <img
      src={worldlineLogoB64}
      alt="Worldline"
      style={{
        height,
        width,
        display: 'block',
        objectFit: 'contain',
        flexShrink: 0,
        // Dark background: invert makes red→cyan which looks wrong,
        // so we go fully white by using brightness+invert together
        filter: onDark
          ? ''   // → pure white silhouette
          : 'none',                      // → original red/dark colours
        ...style,
      }}
    />
  );
}