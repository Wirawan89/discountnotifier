import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const isPublicPath =
      path.startsWith("/auth/") ||
      path === "/business/signin" ||
      path === "/business/signup";

    // Only redirect if user needs to complete profile and is not already on the profile completion page
    if (token?.needsProfileCompletion && path !== "/profile/complete" && !isPublicPath) {
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
        const path = req.nextUrl.pathname;

        // Allow access to auth pages without authentication
        if (
          path.startsWith('/auth/') ||
          path === '/business/signin' ||
          path === '/business/signup'
        ) {
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
