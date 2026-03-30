import { NextAuthOptions, getServerSession } from "next-auth"
import type { OAuthConfig } from "next-auth/providers/oauth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "./db"

const oidcProvider: OAuthConfig<Record<string, unknown>> = {
  id: "oidc",
  name: process.env.OAUTH_PROVIDER_NAME || "SSO",
  type: "oauth",
  wellKnown: `${process.env.OAUTH_ISSUER}/.well-known/openid-configuration`,
  clientId: process.env.OAUTH_CLIENT_ID!,
  clientSecret: process.env.OAUTH_CLIENT_SECRET!,
  idToken: true,
  checks: ["state"],
  profile(profile) {
    return {
      id: profile.sub as string,
      name: (profile.name ?? profile.preferred_username ?? profile.email) as string,
      email: profile.email as string,
      image: (profile.picture as string) ?? null,
    }
  },
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [oidcProvider],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export function auth() {
  return getServerSession(authOptions)
}
