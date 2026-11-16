import { getServerSession } from "next-auth";
import { getLocale } from "next-intl/server";

import { authOptions } from "@/src/auth";
import { redirect } from "@/src/i18n/navigation";
import { PagesShell } from "./pages-shell";

export default async function PagesLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getServerSession(authOptions);
  if (!session) redirect({ href: "/", locale: await getLocale() });

  return <PagesShell>{children}</PagesShell>;
}
