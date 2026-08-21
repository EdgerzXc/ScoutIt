"use client";

import dynamic from "next/dynamic";

const FloatingToolbox = dynamic(() => import("@/components/ui/FloatingToolbox"), { ssr: false });
const WaitlistModal = dynamic(() => import("@/components/waitlist/WaitlistModal"), { ssr: false });
const MasterCascadeMap = dynamic(() => import("@/components/layout/MasterCascadeMap"), { ssr: false });

export default function DynamicOverlays() {
  return (
    <>
      <FloatingToolbox showTrigger={false} />
      <MasterCascadeMap />
      <WaitlistModal />
    </>
  );
}
