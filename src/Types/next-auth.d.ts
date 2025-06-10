import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role?: 'enduser' | 'incident_handler' | 'incident_manager' | 'admin' | 'developer'
    }
    accessToken?: string
  }

  interface User {
    role?: 'enduser' | 'incident_handler' | 'incident_manager' | 'admin' | 'developer'
    token?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: 'enduser' | 'incident_handler' | 'incident_manager' | 'admin' | 'developer'
    accessToken?: string
  }
}
