"use client";

import { useEffect } from "react";
import { ensureStaticAPI } from "@/lib/static-api";

export function StaticInit() {
  useEffect(() => {
    ensureStaticAPI();
  }, []);
  return null;
}