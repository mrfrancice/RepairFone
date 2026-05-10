export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api/v1',
  wsUrl: 'http://localhost:3000',
  // Limites API (alignées sur les ValidationPipe backend)
  api: {
    maxLimit: 100,            // limit max accepté par les endpoints paginés
    defaultPageSize: 10,      // page size par défaut côté UI
  },
  // Monitoring (Sentry) — activé seulement si dsn défini
  sentry: {
    dsn: '',                  // ex: 'https://xxx@xxx.ingest.sentry.io/yyy'
    environment: 'development',
    tracesSampleRate: 0.1,
  },
  firebase: {
    apiKey: 'YOUR_FIREBASE_API_KEY',
    authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
    projectId: 'YOUR_PROJECT_ID',
    storageBucket: 'YOUR_PROJECT_ID.appspot.com',
    messagingSenderId: 'YOUR_SENDER_ID',
    appId: 'YOUR_APP_ID',
  },
};
