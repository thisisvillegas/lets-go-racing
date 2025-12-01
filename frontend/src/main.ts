import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import * as Sentry from '@sentry/angular';
import { environment } from './environments/environment';

// Initialize Sentry BEFORE bootstrapping the app
Sentry.init({
  dsn: 'https://75ce3521952d4e89026613c193825aa4@o4510457034768384.ingest.us.sentry.io/4510457201164288',
  environment: environment.production ? 'production' : 'development',
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],

  // Performance Monitoring
  tracesSampleRate: environment.production ? 0.1 : 1.0, // 10% in prod, 100% in dev

  // Session Replay
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

  // Release tracking
  release: 'racing-dashboard-frontend@1.0.0',

  // Filter out sensitive data
  beforeSend(event, hint) {
    // Don't send events in development (optional)
    if (!environment.production) {
      console.log('Sentry event (dev mode):', event);
      // Uncomment to prevent sending in dev:
      // return null;
    }
    return event;
  },
});

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
