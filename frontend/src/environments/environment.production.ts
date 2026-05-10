export const environment = {
  production: true,
  apiUrl: '/api/v1',
  wsUrl: '',
  api: {
    maxLimit: 100,
    defaultPageSize: 10,
  },
  sentry: {
    dsn: '',                  // À remplir avec le DSN de production
    environment: 'production',
    tracesSampleRate: 0.05,
  },
};
