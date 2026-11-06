// The services TOMOSHIBI can put a call through to. **Not every API.** A label goes to one service on this list
// and nowhere else, so for a listed service the destination is known and does not have to be typed or chosen.
// `ready` is the honest part: only Stripe is wired today. The others are named so the list reads as a list.
export const APIS = [
  { id: 'stripe', name: 'Stripe', label: 'stripe-live', target: 'api.stripe.com', scope: '* /v1', keyHint: 'sk_live_…', where: 'https://dashboard.stripe.com/apikeys', ready: true },
  { id: 'model', name: 'Model API', label: 'model-main', ready: false },
  { id: 'mail', name: 'Mail', ready: false },
]
