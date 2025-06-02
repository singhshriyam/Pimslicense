import { NextAuthOptions } from "next-auth";
import Github from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

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
      async authorize(credentials: any) {
        try {
          // Call your backend API
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

          if (response.ok && data.success) {
            // Return user object with token
            return {
              id: credentials?.email,
              email: credentials?.email,
              token: data.data.token
            };
          } else {
            // Return null if login failed
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
  // callbacks: {
  //   async jwt({ token, user }) {
  //     // Persist the token from your API
  //     if (user?.token) {
  //       token.accessToken = user.token;
  //     }
  //     if (user?.email) {
  //       token.email = user.email;
  //     }
  //     return token;
  //   },
  //   async session({ session, token }) {
  //     // Send properties to the client
  //     session.accessToken = token.accessToken;
  //     return session;
  //   },
  //   async redirect({ url, baseUrl }) {
  //     return url.startsWith(baseUrl) ? url : baseUrl;
  //   }
  // },
  // debug: true
};
