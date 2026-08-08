import { Resend } from "resend";

/**
 * Client Resend en lazy-init via Proxy.
 * Évite l'erreur au build Vercel si RESEND_API_KEY n'est pas encore chargée :
 * l'instance n'est créée qu'au premier appel réel (runtime).
 */
let _resend = null;

function getResend() {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      throw new Error("RESEND_API_KEY manquant.");
    }
    _resend = new Resend(key);
  }
  return _resend;
}

export const resend = new Proxy(
  {},
  {
    get(_target, prop) {
      const instance = getResend();
      const value = instance[prop];
      return typeof value === "function" ? value.bind(instance) : value;
    },
  }
);