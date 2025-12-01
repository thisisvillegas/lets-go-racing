import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
Sentry.init({
    dsn: 'https://1f971b8a496ae4e2b41395c2aaa74722@o4510457034768384.ingest.us.sentry.io/4510457206407168',
    environment: process.env.NODE_ENV || 'development',

    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Profiling
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    integrations: [
        nodeProfilingIntegration(),
    ],

    // Release tracking
    release: 'racing-dashboard-backend@1.0.0',

    // Enhanced error context
    beforeSend(event, hint) {
        // Log errors in development
        if (process.env.NODE_ENV !== 'production') {
            console.log('Sentry event (dev mode):', event);
        }
        return event;
    },
});