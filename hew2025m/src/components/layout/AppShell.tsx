"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";

const HIDE_LAYOUT_PATHS = ["/setup-username"];

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const shouldHideLayout = HIDE_LAYOUT_PATHS.some((path) => pathname.startsWith(path));

  return (
    <>
      {!shouldHideLayout ? <Header /> : null}
      <main>{children}</main>
      {!shouldHideLayout ? <Footer /> : null}
    </>
  );
}
