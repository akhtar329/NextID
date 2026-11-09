import type { ReactNode } from "react";
import InstituteAuthLayout from "./InstituteAuthLayout";

export default function Layout({ children }: { children: ReactNode }) {
  return <InstituteAuthLayout>{children}</InstituteAuthLayout>;
}