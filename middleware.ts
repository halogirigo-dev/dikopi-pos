import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token: any = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const isAdminRoute = ["/dashboard","/products","/categories","/users","/expenses","/cashflow","/reports","/settings","/finance","/more"].some(p=> path.startsWith(p));
    // Admin can access all
    if (token?.role === "ADMIN") return NextResponse.next();
    // Cashier blocked from admin routes
    if (token?.role === "CASHIER" && isAdminRoute) {
      return NextResponse.redirect(new URL("/pos", req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: { signIn: "/login" },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/pos/:path*", "/products/:path*", "/categories/:path*", "/users/:path*", "/transactions/:path*", "/expenses/:path*", "/cashflow/:path*", "/reports/:path*", "/finance/:path*", "/settings/:path*", "/more/:path*"],
};
