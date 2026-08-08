import { NextResponse } from "next/server";
import { resend } from "@/lib/resend";

export const dynamic = "force-dynamic";

// Validation email simple
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

/**
 * POST /api/contact
 * Body : { name, email, phone?, message }
 * Envoie le message à l'instructrice via Resend.
 */
export async function POST(request) {
  try {
    const { name, email, phone, message } = await request.json();

    // Validation
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: "Merci de remplir tous les champs obligatoires." },
        { status: 400 }
      );
    }
    if (!isEmail(email.trim())) {
      return NextResponse.json({ error: "Adresse email invalide." }, { status: 400 });
    }
    if (message.trim().length < 10) {
      return NextResponse.json(
        { error: "Votre message est un peu court." },
        { status: 400 }
      );
    }

    const from = process.env.RESEND_FROM;
    const to = process.env.CONTACT_TO;
    if (!from || !to) {
      console.error("[contact] RESEND_FROM ou CONTACT_TO manquant.");
      return NextResponse.json(
        { error: "Configuration email indisponible." },
        { status: 500 }
      );
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanPhone = phone?.trim() || "Non renseigné";
    const cleanMessage = message.trim();

    // Email HTML simple et lisible
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1414;">
        <div style="background: #170A11; color: #fff; padding: 22px 26px; border-radius: 14px 14px 0 0;">
          <h2 style="margin: 0; font-size: 18px;">Nouveau message — MH Defense</h2>
        </div>
        <div style="border: 1px solid #ece4e3; border-top: none; padding: 26px; border-radius: 0 0 14px 14px;">
          <p style="margin: 0 0 14px;"><strong>Nom :</strong> ${cleanName}</p>
          <p style="margin: 0 0 14px;"><strong>Email :</strong> <a href="mailto:${cleanEmail}">${cleanEmail}</a></p>
          <p style="margin: 0 0 14px;"><strong>Téléphone :</strong> ${cleanPhone}</p>
          <hr style="border: none; border-top: 1px solid #ece4e3; margin: 18px 0;" />
          <p style="margin: 0 0 8px;"><strong>Message :</strong></p>
          <p style="margin: 0; white-space: pre-wrap; line-height: 1.6;">${cleanMessage}</p>
        </div>
      </div>
    `;

    const { error } = await resend.emails.send({
      from: `MH Defense <${from}>`,
      to: [to],
      replyTo: cleanEmail, // l'instructrice répond directement au visiteur
      subject: `Nouveau message de ${cleanName}`,
      html,
    });

    if (error) {
      console.error("[contact] Resend :", error);
      return NextResponse.json(
        { error: "Impossible d'envoyer le message. Réessayez." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[contact]", error);
    return NextResponse.json(
      { error: "Une erreur est survenue. Réessayez." },
      { status: 500 }
    );
  }
}