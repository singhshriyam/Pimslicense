import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"

const handler = NextAuth({
  providers: [
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

        try {
          console.log('🔐 Attempting login for:', credentials.email);

          const response = await fetch(`${process.env.API_BASE_URL || 'https://apexwpc.apextechno.co.uk/api'}/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          const data = await response.json();
          console.log('🔐 Full API Response:', JSON.stringify(data, null, 2));

          if (response.ok && data.message === "User login successfully.") {
            // Extract team from the response - check multiple possible locations
            let userTeam = data.team || data.data?.team || data.user?.team || 'user';

            console.log('🔐 Extracted team:', userTeam);

            const user = {
              id: data.user_id?.toString() || data.data?.user_id?.toString() || credentials.email,
              name: data.name || data.data?.name || credentials.email.split('@')[0],
              email: credentials.email,
              team: userTeam,
              accessToken: data.data?.token || data.token
            };

            console.log('✅ Returning user object:', user);
            return user;
          }

          console.log('❌ Login failed:', data.message);
          return null;
        } catch (error) {
          console.error('❌ Auth error:', error);
          return null;
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.team = user.team;
        token.accessToken = user.accessToken;
        console.log('🔐 JWT token updated:', { userId: token.userId, team: token.team });
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.userId as string;
        session.user.team = token.team as string;
        session.accessToken = token.accessToken as string;
        console.log('🔐 Session created:', { email: session.user.email, team: session.user.team });
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
