import { AuthConfig } from '@auth0/auth0-angular';

export const authConfig: AuthConfig = {
    domain: 'dev-6sfjxompkc4vz884.us.auth0.com',  // e.g., 'dev-xxxxx.us.auth0.com'
    clientId: 'hbh4yFBax7RFG5jyeQBdiFAJucSSwJMH',
    authorizationParams: {
        redirect_uri: window.location.origin + '/callback',
        audience: 'https://api.racing-dashboard.com',
    },
    httpInterceptor: {
        allowedList: [
            {
                uri: 'http://localhost:3000/api/*',
                tokenOptions: {
                    authorizationParams: {
                        audience: 'https://api.racing-dashboard.com',
                    }
                }
            },
            {
                uri: 'http://racing-dashboard-alb-332277837.us-east-1.elb.amazonaws.com/api/*',
                tokenOptions: {
                    authorizationParams: {
                        audience: 'https://api.racing-dashboard.com',
                    }
                }
            }
        ]
    }
};