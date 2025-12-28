import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';

@Component({
  selector: 'app-tactiqal',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-container">
      <nav class="navbar">
        <div class="nav-brand">
          <a routerLink="/dashboard" class="back-link">
            <span class="back-arrow">&larr;</span>
          </a>
          <span class="logo-icon">&#9917;</span>
          <span class="logo-text">TactIQal</span>
        </div>
        <div class="nav-actions">
          <button class="btn btn-secondary" (click)="logout()">Logout</button>
        </div>
      </nav>

      <main class="iframe-container">
        <iframe
          src="http://localhost:3005"
          title="TactIQal"
          frameborder="0"
          allowfullscreen>
        </iframe>
      </main>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
    }

    .page-container {
      height: 100%;
      display: flex;
      flex-direction: column;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%);
    }

    .navbar {
      flex-shrink: 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 2rem;
      background: rgba(255, 255, 255, 0.05);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      height: 60px;
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
      position: relative;
      overflow: hidden;
    }

    iframe {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border: none;
    }
  `]
})
export class TactiqalComponent {
  constructor(private auth: AuthService) {}

  logout() {
    this.auth.logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    });
  }
}
