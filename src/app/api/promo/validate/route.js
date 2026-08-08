import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * POST /api/promo/validate
 * Body : { code, scope: "PONCTUEL"|"ABONNEMENT", amount (centimes) }
 * Vérifie la validité d'un code promo et calcule la réduction.
 * Ne consomme PAS le code (l'incrément se fait au paiement confirmé).
 */
export async function POST(request) {
  try {
    const { code, scope, amount } = await request.json();

    if (!code?.trim()) {
      return NextResponse.json({ error: "Code manquant." }, { status: 400 });
    }
    const normalized = code.trim().toUpperCase();

    const promo = await prisma.promoCode.findUnique({
      where: { code: normalized },
    });

    if (!promo) {
      return NextResponse.json({ valid: false, error: "Code promo introuvable." }, { status: 404 });
    }

    // Actif ?
    if (!promo.active) {
      return NextResponse.json({ valid: false, error: "Ce code n'est plus actif." }, { status: 409 });
    }

    // Fenêtre de validité
    const now = new Date();
    if (promo.startsAt && now < promo.startsAt) {
      return NextResponse.json({ valid: false, error: "Ce code n'est pas encore valable." }, { status: 409 });
    }
    if (promo.endsAt && now > promo.endsAt) {
      return NextResponse.json({ valid: false, error: "Ce code a expiré." }, { status: 409 });
    }

    // Limite d'utilisations
    if (promo.maxRedemptions != null && promo.timesRedeemed >= promo.maxRedemptions) {
      return NextResponse.json({ valid: false, error: "Ce code a atteint sa limite d'utilisation." }, { status: 409 });
    }

    // Périmètre
    if (promo.scope !== "ALL" && promo.scope !== scope) {
      const cible = promo.scope === "PONCTUEL" ? "les séances ponctuelles" : "les abonnements";
      return NextResponse.json(
        { valid: false, error: `Ce code n'est valable que pour ${cible}.` },
        { status: 409 }
      );
    }

    // Calcul de la réduction (sur le montant fourni, en centimes)
    const base = Number(amount) || 0;
    let discount = 0;
    if (promo.discountType === "PERCENT") {
      discount = Math.round((base * promo.discountValue) / 100);
    } else {
      // FIXED : discountValue est déjà en centimes
      discount = promo.discountValue;
    }
    // La réduction ne dépasse pas le montant
    discount = Math.min(discount, base);
    const newAmount = Math.max(0, base - discount);

    return NextResponse.json({
      valid: true,
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      discount, // montant réduit en centimes
      originalAmount: base,
      newAmount, // montant après réduction
      label:
        promo.discountType === "PERCENT"
          ? `-${promo.discountValue}%`
          : `-${Math.round(promo.discountValue / 100)}€`,
    });
  } catch (error) {
    console.error("[api/promo/validate]", error);
    return NextResponse.json({ error: "Erreur de validation." }, { status: 500 });
  }
}