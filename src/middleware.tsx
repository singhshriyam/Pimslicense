import { withAuth } from "next-auth/middleware";
import { pagesOptions } from "./app/api/auth/[...nextauth]/pages-options";

export default withAuth(
  function middleware(req) {
    // Middleware logic if needed - only runs for protected routes now
    console.log("Middleware running for protected route:", req.nextUrl.pathname);
  },
  {
    pages: {
      ...pagesOptions,
    },
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Log for debugging
        console.log("Authorized callback for:", pathname, "Token exists:", !!token);

        // For protected routes (dashboard, etc.), require token
        return !!token;
      },
    },
  }
);

export const config = {
  // ONLY apply middleware to protected routes - completely exclude auth pages
  matcher: [
    // Only protect dashboard and other admin routes
    '/dashboard/:path*',
    '/admin/:path*',
    '/profile/:path*',
    '/settings/:path*',
    // Add other protected routes as needed
    '/((?!api|_next/static|_next/image|favicon.ico|auth).*)',
  ],
};
