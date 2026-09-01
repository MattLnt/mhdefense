/**
 * Formatage des dates en heure française (Europe/Paris),
 * quel que soit le fuseau horaire du serveur (Vercel tourne en UTC).
 * À utiliser partout où une date/heure est affichée à un client (emails…).
 */

/**
 * Ex : "lundi 3 octobre à 11:00"
 * @param {Date|string} date
 */
export function formatDateHeure(date) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  }).format(new Date(date));
}