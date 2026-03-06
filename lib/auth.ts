import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Role from "@/models/Role";
import Invitation from "@/models/Invitation";
import Setting from "@/models/Setting";

async function getDefaultRoleId(): Promise<string> {
  const setting = await Setting.findOne({
    category: "app",
    name: "defaultSignupRoleId",
  })
    .lean();
  const configuredId = setting?.value?.trim();
  if (configuredId) {
    const role = await Role.findById(configuredId).lean();
    if (role) return role._id.toString();
  }
  const role =
    (await Role.findOne({ name: "Basic" }).lean()) ??
    (await Role.findOne({ name: "Tech" }).lean()) ??
    (await Role.findOne({ name: "Admin" }).lean()) ??
    (await Role.findOne({ name: "Default" }).lean()) ??
    (await Role.findOne().lean());
  if (!role)
    throw new Error("No roles in database. Run scripts/seed-roles.ts first.");
  return role._id.toString();
}

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
          const roleId = user.role?.toString?.() ?? (user.role as unknown as string);
          token.roleId = roleId;
        } else {
          const emailLower = (email ?? "").trim().toLowerCase();
          const invitation = emailLower
            ? await Invitation.findOne({ email: emailLower })
            : null;
          const roleIdStr = invitation
            ? invitation.role.toString()
            : await getDefaultRoleId();
          const { default: mongoose } = await import("mongoose");
          user = await User.create({
            googleId,
            email: email ?? "",
            name: name ?? "User",
            picture: picture ?? undefined,
            role: new mongoose.Types.ObjectId(roleIdStr),
          });
          token.roleId = user.role.toString();
          if (invitation) {
            await Invitation.findByIdAndDelete(invitation._id);
          }
        }
        token.userId = user._id.toString();
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.userId as string;
        (session.user as { roleId?: string }).roleId = token.roleId as string;
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
      roleId?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    roleId?: string;
  }
}
