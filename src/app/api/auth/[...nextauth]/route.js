// Route handler NextAuth : capte toutes les requêtes /api/auth/*
// (connexion, déconnexion, session, callback). On réexporte simplement
// les handlers GET/POST générés dans lib/auth.js.

import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;