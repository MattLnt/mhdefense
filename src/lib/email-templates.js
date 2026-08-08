/**
 * Templates d'emails MH Defense — style "sombre néon".
 * Tout est en HTML inline (tables + styles) pour compatibilité
 * Gmail / Outlook / Apple Mail. Aucune variable CSS, couleurs en dur.
 */

const COLORS = {
  bg: "#12070D",
  border: "#D64C7F",
  rose: "#D64C7F",
  rose2: "#F0699A",
  white: "#ffffff",
  w60: "rgba(255,255,255,0.6)",
  w50: "rgba(255,255,255,0.5)",
  w40: "rgba(255,255,255,0.4)",
  cardBg: "rgba(255,255,255,0.04)",
  roseBg: "rgba(214,76,127,0.08)",
  roseBorder: "rgba(214,76,127,0.2)",
};

/**
 * Enveloppe commune : bandeau logo + contenu + pied de page.
 * @param {string} inner  HTML du corps (entre l'en-tête et le pied)
 */
function baseLayout(inner) {
  return `
  <div style="margin:0;padding:30px 16px;background:#0a0407;font-family:'Inter',Arial,sans-serif;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="margin:0 auto;max-width:600px;background:${COLORS.bg};border-radius:18px;overflow:hidden;border:1.5px solid ${COLORS.border};box-shadow:0 0 40px rgba(214,76,127,0.25);">
      <!-- En-tête -->
      <tr>
        <td style="padding:40px 40px 30px;text-align:center;">
          <div style="font-size:22px;font-weight:800;color:${COLORS.white};letter-spacing:0.03em;">MH<span style="color:${COLORS.rose2};">·</span>DEFENSE</div>
          <div style="width:40px;height:3px;background:linear-gradient(90deg,${COLORS.rose},${COLORS.rose2});margin:14px auto 0;border-radius:2px;"></div>
        </td>
      </tr>
      ${inner}
      <!-- Pied de page -->
      <tr>
        <td style="padding:30px 40px;text-align:center;border-top:1px solid rgba(255,255,255,0.08);">
          <div style="font-size:13px;color:${COLORS.w50};">Marie Hervas Diaz · <span style="color:${COLORS.rose2};">MH Defense</span></div>
          <div style="font-size:12px;color:${COLORS.w40};margin-top:6px;">Sarrians (84) · 06 51 00 14 01 · @mh_defense</div>
        </td>
      </tr>
    </table>
  </div>`;
}

/**
 * Email de réinitialisation de mot de passe.
 * @param {string} resetUrl  lien de réinitialisation
 */
export function emailResetPassword(resetUrl) {
  const inner = `
    <tr>
      <td style="padding:10px 44px 0;text-align:center;">
        <h1 style="margin:0 0 12px;font-size:24px;color:${COLORS.white};font-weight:800;">Réinitialisation</h1>
        <p style="margin:0 0 28px;font-size:15px;line-height:1.65;color:${COLORS.w60};">
          Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour en choisir un nouveau. Ce lien est valable <strong style="color:${COLORS.rose2};">1 heure</strong>.
        </p>
        <a href="${resetUrl}" style="display:inline-block;background:${COLORS.rose};color:${COLORS.white};text-decoration:none;font-weight:700;font-size:15px;padding:15px 34px;border-radius:999px;box-shadow:0 12px 28px rgba(214,76,127,0.4);">Réinitialiser mon mot de passe</a>
        <p style="margin:26px 0 0;font-size:13px;line-height:1.6;color:${COLORS.w40};">
          Si vous n'êtes pas à l'origine de cette demande, ignorez cet email. Votre mot de passe restera inchangé.
        </p>
      </td>
    </tr>`;
  return baseLayout(inner);
}

/**
 * Email de confirmation de réservation (envoyé au client).
 * @param {object} data { name, formule, dateHeure, duree, lieu, isEssai }
 */
export function emailConfirmationReservation({ name, formule, dateHeure, duree = "1 heure", lieu = "Sarrians (84)", isEssai = false }) {
  const inner = `
    <tr>
      <td style="padding:10px 44px 0;text-align:center;">
        <h1 style="margin:0 0 12px;font-size:25px;color:${COLORS.white};font-weight:800;">
          Réservation <span style="color:${COLORS.rose2};">confirmée</span>
        </h1>
        <p style="margin:0 0 26px;font-size:15px;line-height:1.6;color:${COLORS.w60};">
          Bonjour ${name}, ${isEssai ? "votre séance d'essai offerte est enregistrée." : "tout est prêt pour votre séance."}
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 40px 8px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:14px 18px;background:${COLORS.roseBg};border:1px solid ${COLORS.roseBorder};border-radius:10px;">
              <span style="font-size:12px;color:${COLORS.w50};text-transform:uppercase;letter-spacing:0.05em;">Date & heure</span><br>
              <span style="font-size:15px;color:${COLORS.white};font-weight:700;">${dateHeure}</span>
            </td>
          </tr>
        </table>
        <div style="height:10px;"></div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="48%" style="padding:14px 18px;background:${COLORS.cardBg};border-radius:10px;">
              <span style="font-size:12px;color:${COLORS.w50};">Formule</span><br>
              <span style="font-size:14px;color:${COLORS.white};font-weight:600;">${formule}</span>
            </td>
            <td width="4%"></td>
            <td width="48%" style="padding:14px 18px;background:${COLORS.cardBg};border-radius:10px;">
              <span style="font-size:12px;color:${COLORS.w50};">Lieu</span><br>
              <span style="font-size:14px;color:${COLORS.rose2};font-weight:600;">${lieu}</span>
            </td>
          </tr>
        </table>
        <div style="height:10px;"></div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:14px 18px;background:${COLORS.cardBg};border-radius:10px;">
              <span style="font-size:12px;color:${COLORS.w50};">Durée</span><br>
              <span style="font-size:14px;color:${COLORS.white};font-weight:600;">${duree}</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:22px 44px 8px;text-align:center;">
        <p style="margin:0;font-size:14px;line-height:1.6;color:${COLORS.w50};">
          L'adresse exacte vous sera communiquée avant la séance. À très vite ! 🥋
        </p>
      </td>
    </tr>`;
  return baseLayout(inner);
}

/**
 * Email de notification de contact (envoyé à Marie).
 * @param {object} data { fromName, fromEmail, fromPhone, message }
 */
export function emailContact({ fromName, fromEmail, fromPhone, message }) {
  const inner = `
    <tr>
      <td style="padding:10px 44px 0;text-align:center;">
        <h1 style="margin:0 0 12px;font-size:23px;color:${COLORS.white};font-weight:800;">
          Nouveau <span style="color:${COLORS.rose2};">message</span>
        </h1>
        <p style="margin:0 0 26px;font-size:14px;color:${COLORS.w50};">Reçu via le formulaire de contact du site.</p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 40px 8px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.cardBg};border:1px solid rgba(255,255,255,0.1);border-radius:12px;">
          <tr><td style="padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.07);">
            <span style="font-size:13px;color:${COLORS.w50};">De</span>
            <span style="float:right;font-size:14px;color:${COLORS.white};font-weight:600;">${fromName}</span>
          </td></tr>
          <tr><td style="padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.07);">
            <span style="font-size:13px;color:${COLORS.w50};">Email</span>
            <span style="float:right;font-size:14px;color:${COLORS.rose2};font-weight:600;">${fromEmail}</span>
          </td></tr>
          <tr><td style="padding:14px 20px;">
            <span style="font-size:13px;color:${COLORS.w50};">Téléphone</span>
            <span style="float:right;font-size:14px;color:${COLORS.white};font-weight:600;">${fromPhone || "—"}</span>
          </td></tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:18px 40px 8px;">
        <div style="font-size:13px;color:${COLORS.w50};margin-bottom:8px;">Message</div>
        <div style="background:rgba(255,255,255,0.03);border-left:3px solid ${COLORS.rose};border-radius:8px;padding:16px 18px;font-size:14px;line-height:1.65;color:rgba(255,255,255,0.85);">
          ${message.replace(/\n/g, "<br>")}
        </div>
      </td>
    </tr>`;
  return baseLayout(inner);
}

/**
 * Email de bienvenue (envoyé au client après création de l'abonnement).
 * @param {object} data { name, formule, engagement, espaceUrl }
 */
export function emailBienvenueAbonnement({ name, formule, engagement, espaceUrl }) {
  const inner = `
    <tr>
      <td style="padding:10px 44px 0;text-align:center;">
        <div style="width:66px;height:66px;border-radius:50%;background:linear-gradient(150deg,${COLORS.rose2},${COLORS.rose});display:inline-block;line-height:66px;box-shadow:0 12px 30px rgba(214,76,127,0.4);margin-bottom:22px;">
          <span style="color:${COLORS.white};font-size:30px;">🥋</span>
        </div>
        <h1 style="margin:0 0 12px;font-size:25px;color:${COLORS.white};font-weight:800;">
          Bienvenue, <span style="color:${COLORS.rose2};">${name}</span>
        </h1>
        <p style="margin:0 0 26px;font-size:15px;line-height:1.65;color:${COLORS.w60};">
          Votre abonnement est activé. Vous faites désormais partie des femmes qui reprennent confiance avec MH Defense. On a hâte de vous voir sur le tatami !
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 40px 8px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="48%" style="padding:14px 18px;background:${COLORS.roseBg};border:1px solid ${COLORS.roseBorder};border-radius:10px;">
              <span style="font-size:12px;color:${COLORS.w50};">Formule</span><br>
              <span style="font-size:14px;color:${COLORS.white};font-weight:700;">${formule}</span>
            </td>
            <td width="4%"></td>
            <td width="48%" style="padding:14px 18px;background:${COLORS.roseBg};border:1px solid ${COLORS.roseBorder};border-radius:10px;">
              <span style="font-size:12px;color:${COLORS.w50};">Engagement</span><br>
              <span style="font-size:14px;color:${COLORS.rose2};font-weight:700;">${engagement}</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:26px 44px 8px;text-align:center;">
        <a href="${espaceUrl}" style="display:inline-block;background:${COLORS.rose};color:${COLORS.white};text-decoration:none;font-weight:700;font-size:15px;padding:15px 34px;border-radius:999px;box-shadow:0 12px 28px rgba(214,76,127,0.4);">Accéder à mon espace</a>
        <p style="margin:22px 0 0;font-size:14px;line-height:1.6;color:${COLORS.w50};">
          Depuis votre espace, réservez vos séances et gérez votre abonnement à tout moment.
        </p>
      </td>
    </tr>`;
  return baseLayout(inner);
}