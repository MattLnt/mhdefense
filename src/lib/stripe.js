import Stripe from "stripe";

// Instance Stripe créée à la demande (lazy), jamais au moment du build.
//
// Next.js « collecte » les routes au build : si on instanciait Stripe au
// niveau module, l'absence de clé pendant cette phase ferait planter le
// build entier. On diffère donc la création au premier appel réel.

let _stripe = null;

function getStripe() {
  if (_stripe) return _stripe;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY manquant.");
  }

  _stripe = new Stripe(key, {
    appInfo: { name: "MH Defense" },
  });
  return _stripe;
}

// Proxy : `stripe.paymentIntents.create(...)` fonctionne comme avant,
// mais l'instance n'est réellement créée qu'à ce moment-là.
export const stripe = new Proxy(
  {},
  {
    get(_target, prop) {
      const client = getStripe();
      const value = client[prop];
      return typeof value === "function" ? value.bind(client) : value;
    },
  }
);