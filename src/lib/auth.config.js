// Config NextAuth "légère", compatible runtime edge (middleware).
// ⚠️ Ne JAMAIS importer Prisma, bcrypt ou quoi que ce soit de Node ici :
// ce fichier est chargé par le middleware qui tourne sur l'edge.
//
// Le provider credentials (qui a besoin de Prisma) est ajouté séparément
// dans auth.js. Ici on ne met que ce qui est safe partout : les pages
// custom et le callback "authorized" qui protège les routes.

export const authConfig = {
  pages: {
    signIn: "/connexion",
  },
  // Le provider réel (Credentials) est injecté dans auth.js.
  providers: [],
  callbacks: {
    // Propage le rôle et l'id dans le token JWT puis dans la session,
    // pour pouvoir les lire côté serveur et client sans requête DB.
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
};