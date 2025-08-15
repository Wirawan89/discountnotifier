import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { sendWelcomeEmail } from "../../../../lib/email";
import type { NextAuthOptions } from "next-auth";

const prisma = new PrismaClient();

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
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.unshift(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

// Add Apple provider if configured
if (process.env.APPLE_ID && process.env.APPLE_SECRET) {
  providers.unshift(
    AppleProvider({
      clientId: process.env.APPLE_ID,
      clientSecret: process.env.APPLE_SECRET,
    })
  );
}

const handler = NextAuth({
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
});

export const authOptions = handler;

export { handler as GET, handler as POST };
