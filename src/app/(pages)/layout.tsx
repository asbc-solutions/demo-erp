import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/src/auth";
import { PagesShell } from "@/src/app/(pages)/pages-shell";

export default async function PagesLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/");

  return <PagesShell>{children}</PagesShell>;
}
