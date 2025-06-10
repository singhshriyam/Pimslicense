import { NextAuthOptions } from "next-auth";
import Github from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

type UserRole = 'enduser' | 'incident_handler' | 'incident_manager' | 'admin' | 'developer';

export const authoption: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/login",
  },
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          // Call your water pollution control backend API
          const response = await fetch('https://apexwpc.apextechno.co.uk/api/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              email: credentials?.email || '',
              password: credentials?.password || ''
            })
          });

          const data = await response.json();

          console.log('API Response in NextAuth:', data); // Debug log

          if (response.ok && data.message === "User login successfully.") {
            // FIXED: Get team from API response (not role)
            const userTeam = data.team || data.data?.team || 'user'; // Fallback to 'user'
            const userName = data.name || data.data?.name || 'User';

            console.log('User team from API:', userTeam); // Debug log

            return {
              id: data.data?.user?.id || credentials?.email || '',
              email: credentials?.email || '',
              name: userName,
              team: userTeam, // Use team instead of role
              token: data.data?.token
            };
          } else {
            return null;
          }
        } catch (error) {
          console.error('Login error:', error);
          return null;
        }
      },
    }),
    Github({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as any).token;
        token.team = (user as any).team; // Cast user to any to avoid TypeScript error
      }
      return token;
    },
    async session({ session, token }) {
      // Add accessToken to session
      session.accessToken = token.accessToken as string;
      if (session.user) {
        (session.user as any).team = token.team; // Cast to any to avoid TypeScript error
      }
      return session;
    },
  },
};
