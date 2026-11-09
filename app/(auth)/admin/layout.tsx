
import { ReactNode } from "react";
import AuthLayout from "./AuthPageTransition";

export default function AuthGroupLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AuthLayout>{children}</AuthLayout>;
}
