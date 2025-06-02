import { withAuth } from "next-auth/middleware";
import { pagesOptions } from "./app/api/auth/[...nextauth]/pages-options";

export default withAuth(
  function middleware(req) {
    // Middleware logic if needed
  },
  {
    pages: {
      ...pagesOptions,
    },
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to register page without authentication
        if (req.nextUrl.pathname === "/auth/register") {
          return true;
        }
        // Allow access to login page without authentication
        if (req.nextUrl.pathname === "/auth/login") {
          return true;
        }
        // For other routes, check if user has a token
        return !!token;
      },
    },
  }
);

export const config = {
  // Exclude public routes and static files
  matcher: [
    // Include all routes except these:
    '/((?!api|_next/static|_next/image|favicon.ico|auth/login|auth/register).*)',
    // Include protected auth routes (but login and register are excluded above)
    '/auth/((?!login|register).*)',
  ],
};
