"use client";
import { ReactNode } from "react";
import { ProfileProvider } from "@/contexts/ProfileContext";

export default function ClientProviders({ children }: { children: ReactNode }) {
  return <ProfileProvider>{children}</ProfileProvider>;
}
