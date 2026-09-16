import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import axios from "axios";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret:
    process.env.NEXTAUTH_SECRET ,
  pages: {
    signIn: "/",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        try {
          const { data } = await axios.post(
            `${process.env.NEXT_PUBLIC_ERP_API_URL}/auth/login`,
            { email: credentials.email, password: credentials.password },
            { headers: { "Content-Type": "application/json" } }
          );
          const { token, user } = data.data;
          return { id: user.id, name: user.name, email: user.email, accessToken: token, role: user.role ?? null };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as { accessToken?: string; role?: string | null }
        token.accessToken = u.accessToken
        token.id = user.id
        token.role = u.role ?? null
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role
      }
      return session;
    },
  },
};
