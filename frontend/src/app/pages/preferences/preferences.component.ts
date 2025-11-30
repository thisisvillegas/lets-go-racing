import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface UserPreferences {
  favoriteTeams: string[];
  notifications: boolean;
  theme: string;
}

@Component({
  selector: 'app-preferences',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="preferences-container">
      <nav class="navbar">
        <h1>User Preferences</h1>
        <div class="nav-actions">
          <a routerLink="/dashboard" class="nav-link">← Back to Dashboard</a>
        </div>
      </nav>

      <main class="content">
        <div class="card">
          <h2>Customize Your Experience</h2>
          
          <form (ngSubmit)="savePreferences()" *ngIf="preferences">
            <div class="form-group">
              <label>Favorite Teams</label>
              <input 
                type="text" 
                [(ngModel)]="teamInput" 
                name="teamInput"
                placeholder="Enter a team name"
                (keyup.enter)="addTeam()"
                class="form-control"
              />
              <button type="button" (click)="addTeam()" class="btn-add">Add Team</button>
              
              <div class="teams-list">
                <div class="team-tag" *ngFor="let team of preferences.favoriteTeams">
                  {{ team }}
                  <button type="button" (click)="removeTeam(team)" class="btn-remove">×</button>
                </div>
                <div *ngIf="preferences.favoriteTeams.length === 0" class="empty-state">
                  No favorite teams added yet
                </div>
              </div>
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  [(ngModel)]="preferences.notifications"
                  name="notifications"
                />
                <span>Enable race notifications</span>
              </label>
            </div>

            <div class="form-group">
              <label>Theme</label>
              <select [(ngModel)]="preferences.theme" name="theme" class="form-control">
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn-save" [disabled]="saving">
                {{ saving ? 'Saving...' : 'Save Preferences' }}
              </button>
            </div>

            <div class="message success" *ngIf="saveSuccess">
              ✓ Preferences saved successfully!
            </div>
            <div class="message error" *ngIf="saveError">
              ✗ Failed to save preferences. Please try again.
            </div>
          </form>

          <div *ngIf="!preferences" class="loading">
            Loading preferences...
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .preferences-container {
      min-height: 100vh;
      background: #f5f7fa;
    }

    .navbar {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 1.5rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .navbar h1 {
      margin: 0;
      font-size: 1.5rem;
    }

    .nav-link {
      color: white;
      text-decoration: none;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      transition: background 0.3s;
    }

    .nav-link:hover {
      background: rgba(255,255,255,0.2);
    }

    .content {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }

    .card {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    h2 {
      color: #2d3748;
      margin-bottom: 2rem;
    }

    .form-group {
      margin-bottom: 2rem;
    }

    label {
      display: block;
      color: #4a5568;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    .form-control {
      width: 100%;
      padding: 0.75rem;
      border: 2px solid #e2e8f0;
      border-radius: 6px;
      font-size: 1rem;
      transition: border-color 0.3s;
    }

    .form-control:focus {
      outline: none;
      border-color: #667eea;
    }

    .btn-add {
      margin-top: 0.5rem;
      background: #667eea;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
    }

    .btn-add:hover {
      background: #5568d3;
    }

    .teams-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 1rem;
      min-height: 50px;
      padding: 1rem;
      background: #f7fafc;
      border-radius: 6px;
    }

    .team-tag {
      background: #667eea;
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-remove {
      background: transparent;
      border: none;
      color: white;
      font-size: 1.5rem;
      cursor: pointer;
      line-height: 1;
      padding: 0;
      width: 20px;
      height: 20px;
    }

    .btn-remove:hover {
      opacity: 0.8;
    }

    .empty-state {
      color: #a0aec0;
      font-style: italic;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
    }

    .checkbox-label input[type="checkbox"] {
      width: 20px;
      height: 20px;
      cursor: pointer;
    }

    .form-actions {
      margin-top: 2rem;
    }

    .btn-save {
      background: #48bb78;
      color: white;
      border: none;
      padding: 0.75rem 2rem;
      border-radius: 6px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    }

    .btn-save:hover:not(:disabled) {
      background: #38a169;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(72,187,120,0.4);
    }

    .btn-save:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .message {
      margin-top: 1rem;
      padding: 1rem;
      border-radius: 6px;
      font-weight: 600;
    }

    .message.success {
      background: #c6f6d5;
      color: #22543d;
    }

    .message.error {
      background: #fed7d7;
      color: #c53030;
    }

    .loading {
      text-align: center;
      color: #718096;
      padding: 2rem;
    }
  `]
})
export class PreferencesComponent implements OnInit {
  preferences: UserPreferences | null = null;
  teamInput = '';
  saving = false;
  saveSuccess = false;
  saveError = false;

  private apiUrl = 'http://localhost:3000/api';

  constructor(
    private http: HttpClient,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadPreferences();
  }

  loadPreferences() {
    this.http.get<UserPreferences>(`${this.apiUrl}/preferences`)
      .subscribe({
        next: (data) => {
          this.preferences = data;
        },
        error: (err) => {
          console.error('Failed to load preferences', err);
          // Set defaults if load fails
          this.preferences = {
            favoriteTeams: [],
            notifications: true,
            theme: 'dark'
          };
        }
      });
  }

  addTeam() {
    if (this.teamInput.trim() && this.preferences) {
      if (!this.preferences.favoriteTeams.includes(this.teamInput.trim())) {
        this.preferences.favoriteTeams.push(this.teamInput.trim());
        this.teamInput = '';
      }
    }
  }

  removeTeam(team: string) {
    if (this.preferences) {
      this.preferences.favoriteTeams = this.preferences.favoriteTeams.filter(t => t !== team);
    }
  }

  savePreferences() {
    if (!this.preferences) return;

    this.saving = true;
    this.saveSuccess = false;
    this.saveError = false;

    this.http.put(`${this.apiUrl}/preferences`, this.preferences)
      .subscribe({
        next: () => {
          this.saving = false;
          this.saveSuccess = true;
          setTimeout(() => this.saveSuccess = false, 3000);
        },
        error: (err) => {
          console.error('Failed to save preferences', err);
          this.saving = false;
          this.saveError = true;
          setTimeout(() => this.saveError = false, 3000);
        }
      });
  }
}