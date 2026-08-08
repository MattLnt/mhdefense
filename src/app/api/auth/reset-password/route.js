import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Mêmes règles que le composant PasswordField (9 car., chiffre, majuscule, symbole)
function motDePasseValide(v) {
  return (
    typeof v === "string" &&
    v.length >= 9 &&
    /\d/.test(v) &&
    /[A-Z]/.test(v) &&
    /[^A-Za-z0-9]/.test(v)
  );
}

/**
 * POST /api/auth/reset-password
 * Body : { token, password }
 * Vérifie le token (hash + non expiré + non utilisé), change le mot de passe.
 */
export async function POST(request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
    }
    if (!motDePasseValide(password)) {
      return NextResponse.json(
        { error: "Le mot de passe ne respecte pas les critères de sécurité." },
        { status: 400 }
      );
    }

    // On hashe le token reçu pour le comparer à celui stocké
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    // Token inexistant, déjà utilisé, ou expiré
    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Ce lien est invalide ou a expiré. Veuillez refaire une demande." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Transaction : maj du mot de passe + marque le token utilisé
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      // Invalide tous les autres tokens éventuels de cet utilisateur
      prisma.passwordResetToken.deleteMany({
        where: { userId: resetToken.userId, usedAt: null },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[reset-password]", error);
    return NextResponse.json({ error: "Une erreur est survenue." }, { status: 500 });
  }
}