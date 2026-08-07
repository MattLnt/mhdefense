import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Middleware d'auth basé sur la config edge-safe (sans Prisma/bcrypt).
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const isLoggedIn = !!session;
  const role = session?.user?.role;

  const path = nextUrl.pathname;

  // Zones protégées
  const isCompte = path.startsWith("/compte");
  const isDashboard = path.startsWith("/dashboard");

  // Pas connecté → redirection vers la connexion, avec retour prévu
  if ((isCompte || isDashboard) && !isLoggedIn) {
    const url = new URL("/connexion", nextUrl);
    url.searchParams.set("callbackUrl", path);
    return Response.redirect(url);
  }

  // Le dashboard est réservé aux admins
  if (isDashboard && role !== "ADMIN") {
    return Response.redirect(new URL("/compte", nextUrl));
  }

  // Un admin qui va sur /compte est renvoyé vers son dashboard
  if (isCompte && role === "ADMIN") {
    return Response.redirect(new URL("/dashboard", nextUrl));
  }
});

// N'exécute le middleware que sur les routes concernées
export const config = {
  matcher: ["/compte/:path*", "/dashboard/:path*"],
};