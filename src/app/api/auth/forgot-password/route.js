import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import { emailResetPassword } from "@/lib/email-templates";

export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.mh-defense.com";
const FROM = "MH Defense <contact@mh-defense.com>";

/**
 * POST /api/auth/forgot-password
 * Body : { email }
 * Génère un token de réinitialisation (valable 1h) et envoie un email.
 * Réponse volontairement identique que l'email existe ou non (anti-énumération).
 */
export async function POST(request) {
  try {
    const { email } = await request.json();
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json({ error: "Adresse email invalide." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    // On répond toujours "ok" pour ne pas révéler si l'email existe.
    if (!user || !user.passwordHash) {
      return NextResponse.json({ ok: true });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    });

    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    const resetUrl = `${BASE_URL}/reinitialiser-mot-de-passe?token=${rawToken}`;

    try {
      await resend.emails.send({
        from: FROM,
        to: normalizedEmail,
        subject: "Réinitialisation de votre mot de passe — MH Defense",
        html: emailResetPassword(resetUrl),
      });
    } catch (mailErr) {
      console.error("[forgot-password] envoi email échoué :", mailErr);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[forgot-password]", error);
    return NextResponse.json({ error: "Une erreur est survenue." }, { status: 500 });
  }
}