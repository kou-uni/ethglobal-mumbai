// The services TOMOSHIBI can put a call through to. **Not every API.** A label goes to one service on this list
// and nowhere else, so for a listed service the destination is known and does not have to be typed or chosen.
// `ready` is the honest part: only Stripe is wired today. The others are listed as "not supported yet".
export const APIS = [
  { id: 'stripe', name: 'Stripe', label: 'stripe-live', target: 'api.stripe.com', scope: '* /v1', keyHint: 'sk_test_…', where: 'https://dashboard.stripe.com/test/apikeys', ready: true },
  { id: 'anthropic', name: 'Anthropic', label: 'model-main', target: 'api.anthropic.com', keyHint: 'sk-ant-…', ready: false },
  { id: 'openai', name: 'OpenAI', label: 'openai-main', target: 'api.openai.com', keyHint: 'sk-…', ready: false },
  { id: 'resend', name: 'Resend', label: 'resend-tx', target: 'api.resend.com', keyHint: 're_…', ready: false },
  { id: 'github', name: 'GitHub', label: 'github-bot', target: 'api.github.com', keyHint: 'ghp_…', ready: false },
  { id: 'slack', name: 'Slack', label: 'slack-bot', target: 'slack.com', keyHint: 'xoxb-…', ready: false },
]
