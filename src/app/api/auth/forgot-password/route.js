import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";

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

    // Génère un token brut (envoyé par email) + son hash (stocké en base)
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

    // Invalide les anciens tokens non utilisés de cet utilisateur
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    });

    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    const resetUrl = `${BASE_URL}/reinitialiser-mot-de-passe?token=${rawToken}`;

    // Envoi de l'email
    try {
      await resend.emails.send({
        from: FROM,
        to: normalizedEmail,
        subject: "Réinitialisation de votre mot de passe — MH Defense",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1A1414;">
            <h2 style="color: #D64C7F;">Réinitialisation de mot de passe</h2>
            <p>Bonjour,</p>
            <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour en choisir un nouveau. Ce lien est valable <strong>1 heure</strong>.</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: #D64C7F; color: #fff; padding: 14px 28px; border-radius: 999px; text-decoration: none; font-weight: bold; display: inline-block;">
                Réinitialiser mon mot de passe
              </a>
            </p>
            <p style="color: #8B7E7C; font-size: 0.9em;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email. Votre mot de passe restera inchangé.</p>
            <p style="color: #8B7E7C; font-size: 0.85em; margin-top: 24px;">MH Defense · Sarrians (84)</p>
          </div>
        `,
      });
    } catch (mailErr) {
      console.error("[forgot-password] envoi email échoué :", mailErr);
      // On renvoie ok quand même pour ne pas bloquer l'UX / révéler d'info
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[forgot-password]", error);
    return NextResponse.json({ error: "Une erreur est survenue." }, { status: 500 });
  }
}