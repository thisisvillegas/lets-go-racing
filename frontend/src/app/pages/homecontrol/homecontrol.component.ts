import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';

@Component({
  selector: 'app-homecontrol',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-container">
      <nav class="navbar">
        <div class="nav-brand">
          <a routerLink="/dashboard" class="back-link">
            <span class="back-arrow">&larr;</span>
          </a>
          <span class="logo-icon">&#127968;</span>
          <span class="logo-text">Homecontrol</span>
        </div>
        <div class="nav-actions">
          <button class="btn btn-secondary" (click)="logout()">Logout</button>
        </div>
      </nav>

      <main class="iframe-container">
        <iframe
          src="http://localhost:3003"
          title="Homecontrol"
          frameborder="0"
          allowfullscreen>
        </iframe>
      </main>
    </div>
  `,
  styles: [`
    .page-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%);
    }

    .navbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 2rem;
      background: rgba(255, 255, 255, 0.05);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .nav-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .back-link {
      color: rgba(255, 255, 255, 0.7);
      text-decoration: none;
      font-size: 1.25rem;
      transition: color 0.2s;
    }

    .back-link:hover {
      color: #fff;
    }

    .back-arrow {
      display: inline-block;
    }

    .logo-icon {
      font-size: 1.5rem;
    }

    .logo-text {
      font-size: 1.25rem;
      font-weight: 600;
      color: #fff;
    }

    .nav-actions {
      display: flex;
      gap: 1rem;
    }

    .btn {
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
    }

    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .iframe-container {
      flex: 1;
      display: flex;
      min-height: 0;
    }

    iframe {
      flex: 1;
      width: 100%;
      height: 100%;
      min-height: calc(100vh - 60px);
      border: none;
    }
  `]
})
export class HomecontrolComponent {
  constructor(private auth: AuthService) {}

  logout() {
    this.auth.logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    });
  }
}
