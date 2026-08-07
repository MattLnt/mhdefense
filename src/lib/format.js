// Helpers d'affichage centralisés.
// Règle du projet : on STOCKE en centimes (Int) et en UTC (DateTime),
// mais on AFFICHE en euros et en heure de Paris (Europe/Paris).

const TZ = "Europe/Paris";

// 16000 (centimes) -> "160 €"   |   2550 -> "25,50 €"
// Les décimales ne s'affichent que s'il y a des centimes (prix ronds nets).
export function formatEuro(cents) {
  const value = (cents ?? 0) / 100;
  const hasCents = (cents ?? 0) % 100 !== 0;
  return (
    new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: hasCents ? 2 : 0,
      maximumFractionDigits: 2,
    }).format(value) + " €"
  );
}

// "Mercredi 18 juin 2026"
export function formatDateFr(date) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TZ,
  }).format(new Date(date));
}

// "18:00"
export function formatTimeFr(date) {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  }).format(new Date(date));
}

// "mer. 18 juin 2026 à 18:00"  (format compact pour listes/dashboard)
export function formatDateTimeFr(date) {
  const d = new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TZ,
  }).format(new Date(date));
  return `${d} à ${formatTimeFr(date)}`;
}

// Capitalise la première lettre (ex: "mercredi" -> "Mercredi").
// Utile car Intl renvoie les jours/mois en minuscule.
export function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}