import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import connectDB from "@/lib/db";
import User from "@/models/User";

export const authOptions = {
  trustHost: true,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  session: { strategy: "jwt", maxAge: 24 * 60 * 60 },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.provider === "google" && profile) {
        await connectDB();
        const email = (profile as { email?: string }).email ?? token.email;
        const name = (profile as { name?: string }).name ?? token.name;
        const picture = (profile as { picture?: string }).picture ?? token.picture;
        const googleId = (profile as { sub?: string }).sub;

        if (!googleId) return token;

        let user = await User.findOne({ googleId });
        if (user) {
          user.lastLogin = new Date();
          await user.save();
        } else {
          user = await User.create({
            googleId,
            email: email ?? "",
            name: name ?? "User",
            picture: picture ?? undefined,
            role: "technician",
          });
        }
        token.userId = user._id.toString();
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.userId as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
} as NextAuthOptions;

export async function getAuthSession() {
  return getServerSession(authOptions);
}

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    role?: string;
  }
}
