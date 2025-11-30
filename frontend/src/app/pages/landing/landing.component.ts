import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '@auth0/auth0-angular';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="landing-container">
      <header class="header">
        <h1>Racing Schedule Dashboard</h1>
        <div class="auth-buttons">
          <button class="btn btn-primary" (click)="login()">Log In</button>
          <button class="btn btn-secondary" (click)="signup()">Sign Up</button>
        </div>
      </header>

      <main class="content">
        <section class="hero">
          <h2>Never Miss a Race</h2>
          <p>Track upcoming MotoGP and F1 races with real-time weather data</p>
        </section>

        <section class="features">
          <div class="feature">
            <h3>📅 Race Calendar</h3>
            <p>View all upcoming races for the next two weeks</p>
          </div>
          <div class="feature">
            <h3>🌤️ Weather Tracking</h3>
            <p>Get current weather conditions at your location</p>
          </div>
          <div class="feature">
            <h3>⚙️ Personalized</h3>
            <p>Save your favorite teams and preferences</p>
          </div>
        </section>
      </main>
    </div>
  `,
  styles: [`
    .landing-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 2rem 4rem;
    }

    .header h1 {
      margin: 0;
      font-size: 1.8rem;
    }

    .auth-buttons {
      display: flex;
      gap: 1rem;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 6px;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-primary {
      background: white;
      color: #667eea;
      font-weight: 600;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }

    .btn-secondary {
      background: transparent;
      color: white;
      border: 2px solid white;
    }

    .btn-secondary:hover {
      background: white;
      color: #667eea;
    }

    .content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 4rem 2rem;
    }

    .hero {
      text-align: center;
      margin-bottom: 4rem;
    }

    .hero h2 {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .hero p {
      font-size: 1.3rem;
      opacity: 0.9;
    }

    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      margin-top: 3rem;
    }

    .feature {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      padding: 2rem;
      border-radius: 12px;
      text-align: center;
    }

    .feature h3 {
      font-size: 1.5rem;
      margin-bottom: 1rem;
    }

    .feature p {
      opacity: 0.9;
      line-height: 1.6;
    }
  `]
})
export class LandingComponent {
  constructor(public auth: AuthService) { }

  login() {
    this.auth.loginWithRedirect();
  }

  signup() {
    this.auth.loginWithRedirect({
      authorizationParams: {
        screen_hint: 'signup'
      }
    });
  }
}