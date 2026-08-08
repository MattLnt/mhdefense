import { NextResponse } from "next/server";
import { resend } from "@/lib/resend";
import { emailContact } from "@/lib/email-templates";

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

    const html = emailContact({
      fromName: cleanName,
      fromEmail: cleanEmail,
      fromPhone: cleanPhone,
      message: cleanMessage,
    });

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