import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
import FacebookProvider from "next-auth/providers/facebook";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { sendWelcomeEmail } from "../../../../lib/email";
import type { NextAuthOptions } from "next-auth";

const prisma = new PrismaClient();

function hasRealOAuthCredential(value?: string) {
  if (!value) return false;

  const normalized = value.trim().toLowerCase();
  return (
    normalized.length > 0 &&
    !normalized.startsWith("test_") &&
    !normalized.includes("replace") &&
    !normalized.includes("placeholder") &&
    !normalized.includes("your-") &&
    normalized !== "changeme"
  );
}

function hasOAuthCredentials(clientId?: string, clientSecret?: string) {
  return hasRealOAuthCredential(clientId) && hasRealOAuthCredential(clientSecret);
}

// Build providers array conditionally
const providers: NextAuthOptions["providers"] = [
  // Credentials Provider (always available)
  CredentialsProvider({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" }
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        return null;
      }

      const user = await prisma.user.findUnique({
        where: {
          email: credentials.email
        }
      });

      if (!user) {
        return null;
      }

      const isPasswordValid = await bcrypt.compare(
        credentials.password,
        user.password
      );

      if (!isPasswordValid) {
        return null;
      }

      return {
        id: user.id.toString(),
        email: user.email,
        name: user.name ?? '',
        suburb: user.suburb,
      };
    }
  })
];

// Add Google provider if configured
if (hasOAuthCredentials(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET)) {
  const googleClientId = process.env.GOOGLE_CLIENT_ID as string;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET as string;
  providers.unshift(
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    })
  );
}

// Add Apple provider if configured
if (hasOAuthCredentials(process.env.APPLE_ID, process.env.APPLE_SECRET)) {
  const appleId = process.env.APPLE_ID as string;
  const appleSecret = process.env.APPLE_SECRET as string;
  providers.unshift(
    AppleProvider({
      clientId: appleId,
      clientSecret: appleSecret,
    })
  );
}

// Add Facebook provider if configured
if (hasOAuthCredentials(process.env.FACEBOOK_CLIENT_ID, process.env.FACEBOOK_CLIENT_SECRET)) {
  const facebookClientId = process.env.FACEBOOK_CLIENT_ID as string;
  const facebookClientSecret = process.env.FACEBOOK_CLIENT_SECRET as string;
  providers.unshift(
    FacebookProvider({
      clientId: facebookClientId,
      clientSecret: facebookClientSecret,
    })
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers,
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.suburb = user.suburb;
      }
      
      // Handle first-time social login
      if (account && user) {
        // Check if user needs to complete profile
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! }
        });
        
        if (dbUser && !dbUser.suburb) {
          // User exists but needs to complete profile
          token.needsProfileCompletion = true;
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub?.toString() ?? '';
        session.user.suburb = token.suburb;
        session.needsProfileCompletion = token.needsProfileCompletion;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      // Handle first-time social login
      if (account?.provider !== "credentials") {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! }
        });

        if (!existingUser) {
          // Create new user from social login
          const newUser = await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name || profile?.name || user.email?.split('@')[0],
              suburb: '', // Will be set during profile completion
              password: '', // Social users don't need password
            }
          });

          // Create default preferences
          await prisma.userPreference.create({
            data: {
              userId: newUser.id,
              emailNotifications: true,
              pushNotifications: true,
              notificationFrequency: "daily"
            }
          });

          // Create welcome notification
          await prisma.notification.create({
            data: {
              userId: newUser.id,
              title: "Welcome to DiscountNotifier!",
              message: "Thank you for joining us. Please complete your profile to get started!",
              type: "system"
            }
          });

          // Send welcome email
          try {
            await sendWelcomeEmail(newUser.email, newUser.name || newUser.email.split('@')[0]);
          } catch (emailError) {
            console.error('Failed to send welcome email:', emailError);
            // Don't fail the signin if email fails
          }
        }
      }
      return true;
    }
  },
  pages: {
    signIn: "/auth/signin",
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
