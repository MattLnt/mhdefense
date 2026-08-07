import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/me/profile
 * Body : { name, phone, currentPassword?, newPassword? }
 * Met à jour les infos du membre. Le changement de mot de passe est
 * optionnel et exige le mot de passe actuel.
 */
export async function PATCH(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  try {
    const { name, phone, currentPassword, newPassword } = await request.json();

    if (!name?.trim() || !phone?.trim()) {
      return NextResponse.json(
        { error: "Le nom et le téléphone sont requis." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    if (!user) {
      return NextResponse.json({ error: "Compte introuvable." }, { status: 404 });
    }

    const data = {
      name: name.trim(),
      phone: phone.trim(),
    };

    // Changement de mot de passe (optionnel)
    if (newPassword) {
      if (newPassword.length < 8) {
        return NextResponse.json(
          { error: "Le nouveau mot de passe doit faire au moins 8 caractères." },
          { status: 400 }
        );
      }
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Veuillez saisir votre mot de passe actuel." },
          { status: 400 }
        );
      }
      const valid = user.passwordHash
        ? await bcrypt.compare(currentPassword, user.passwordHash)
        : false;
      if (!valid) {
        return NextResponse.json(
          { error: "Mot de passe actuel incorrect." },
          { status: 403 }
        );
      }
      data.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    await prisma.user.update({
      where: { id: user.id },
      data,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/me/profile]", error);
    return NextResponse.json(
      { error: "Impossible de mettre à jour votre profil." },
      { status: 500 }
    );
  }
}