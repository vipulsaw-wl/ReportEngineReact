import React from 'react';
import worldlineLogoB64 from '../worldlineLogoB64';

/**
 * Worldline logo.
 * onDark=true  → white version (teal / dark nav backgrounds)
 * onDark=false → colour version (white / light backgrounds)
 *
 * The source file is a JPEG with white background + red/dark Worldline mark.
 * For dark backgrounds we use:
 *   brightness(0) → all pixels → black
 *   invert(1)     → black → white
 * This produces a clean white silhouette regardless of original colours.
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
        filter: onDark ? '' : 'none',
        ...style,
      }}
    />
  );
}
