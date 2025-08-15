import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Only redirect if user needs to complete profile and is not already on the profile completion page
    if (token?.needsProfileCompletion && path !== "/profile/complete" && path !== "/auth/signin") {
      return NextResponse.redirect(new URL("/profile/complete", req.url));
    }

    // If user has completed profile and is on the profile completion page, redirect to home
    if (!token?.needsProfileCompletion && path === "/profile/complete") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to auth pages without authentication
        if (req.nextUrl.pathname.startsWith('/auth/')) {
          return true;
        }
        // Require authentication for other pages
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}; 