import Stripe from "stripe";

// Client Stripe côté serveur (jamais importé côté client).
//
// On ne fixe PAS "apiVersion" volontairement : les versions récentes du
// SDK stripe-node épinglent déjà leur propre version d'API à la release.
// Hardcoder une date la ferait périmer et créerait des désaccords types.
//
// La clé est lue à l'appel, pas au build : si STRIPE_SECRET_KEY manque
// pendant un build (ex. page statique), on ne veut pas planter le build
// entier — l'erreur ne doit tomber qu'à l'usage réel.

if (!process.env.STRIPE_SECRET_KEY) {
  // Avertissement non bloquant : utile en dev si le .env n'est pas rempli.
  console.warn(
    "[stripe] STRIPE_SECRET_KEY manquant — les appels Stripe échoueront."
  );
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  appInfo: {
    name: "MH Defense",
  },
});