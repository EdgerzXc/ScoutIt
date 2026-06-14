"use client";

import useDescentProgress from "@/hooks/useDescentProgress";

export default function DescentSection({ children, className = "", style = {}, ...props }) {
  const layerRef = useDescentProgress();

  return (
    <section 
      ref={layerRef} 
      className={`relative ${className}`} 
      style={{ ...style, position: "relative" }}
      {...props}
    >
      {children}
    </section>
  );
}
