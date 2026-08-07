import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";

// Config NextAuth complète (runtime Node). Reprend authConfig (edge-safe)
// et y ajoute le provider Credentials qui a besoin de Prisma + bcrypt.
//
// On exporte handlers (pour la route /api/auth), et auth/signIn/signOut
// (helpers utilisables dans les Server Components et Server Actions).

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        // Validation basique des entrées.
        const email = credentials?.email?.toString().toLowerCase().trim();
        const password = credentials?.password?.toString();
        if (!email || !password) return null;

        // Recherche de l'utilisateur.
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) return null;

        // Vérification du mot de passe.
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        // Ce qui est retourné ici alimente le callback jwt (token.id/role).
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
});