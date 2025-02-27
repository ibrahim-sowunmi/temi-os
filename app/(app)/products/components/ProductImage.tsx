"use client";

import { useState, CSSProperties } from 'react';

interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderText?: string;
  style?: CSSProperties;
}

export default function ProductImage({ src, alt, className, placeholderText = "No Image", style }: ProductImageProps) {
  const [imgError, setImgError] = useState(false);

  if (!src || imgError) {
    return (
      <div className={`bg-gray-200 rounded-md flex items-center justify-center ${className}`} style={style}>
        <span className="text-xs text-gray-500">{placeholderText}</span>
      </div>
    );
  }

  return (
    <img
      className={className}
      src={src}
      alt={alt}
      style={style}
      onError={() => setImgError(true)}
    />
  );
} 