"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { pingDeviceTelemetry } from "@/lib/deviceTracker";

export default function DeviceTracker() {
  const pathname = usePathname();

  useEffect(() => {
    pingDeviceTelemetry();
  }, [pathname]);

  return null;
}
