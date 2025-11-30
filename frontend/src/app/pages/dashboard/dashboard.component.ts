import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '@auth0/auth0-angular';
import { environment } from '../../../environments/environment';

interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
}

interface RaceData {
  motogp: any[];
  f1: any[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  // templateUrl: './dashboard.component.html',
  template: `
  <div class="dashboard-container">
    <nav class="navbar">
        <h1>Racing Dashboard</h1>
        <div class="nav-actions">
            <a routerLink="/preferences" class="nav-link">Preferences</a>
            <button class="btn-logout" (click)="logout()">Logout</button>
        </div>
    </nav>

    <main class="content">
        <section class="weather-section">
            <h2>Current Weather</h2>
            <div class="card" *ngIf="weather; else loadingWeather">
                <div class="weather-info">
                    <div class="temp">{{ weather.temperature }}°F</div>
                    <div class="location">{{ weather.location }}</div>
                    <div class="condition">{{ weather.condition }}</div>
                </div>
                <div class="weather-details">
                    <div>💧 Humidity: {{ weather.humidity }}%</div>
                    <div>💨 Wind: {{ weather.windSpeed }} mph</div>
                </div>
            </div>
            <ng-template #loadingWeather>
                <div class="card loading">Loading weather data...</div>
            </ng-template>
            <div class="card error" *ngIf="weatherError">
                {{ weatherError }}
            </div>
        </section>

        <section class="races-section">
            <h2>Upcoming Races (Next 2 Weeks)</h2>

            <div class="race-category">
                <h3>🏍️ MotoGP</h3>
                <div *ngIf="races && races.motogp && races.motogp.length > 0; else noMotogp">
                    <div class="card race-card" *ngFor="let race of races.motogp">
                        <div class="race-name">{{ race.name }}</div>
                        <div class="race-details">
                            📍 {{ race.location }}, {{ race.country }}
                        </div>
                        <div class="race-date">📅 {{ race.date }}</div>
                    </div>
                </div>
                <ng-template #noMotogp>
                    <div class="card">No MotoGP races scheduled</div>
                </ng-template>
            </div>

            <div class="race-category">
                <h3>🏎️ Formula 1</h3>
                <div *ngIf="races && races.f1 && races.f1.length > 0; else noF1">
                    <div class="card race-card" *ngFor="let race of races.f1">
                        <div class="race-name">{{ race.name }}</div>
                        <div class="race-details">
                            📍 {{ race.location }}, {{ race.country }}
                        </div>
                        <div class="race-date">📅 {{ race.date }}</div>
                    </div>
                </div>
                <ng-template #noF1>
                    <div class="card">No F1 races scheduled</div>
                </ng-template>
            </div>
        </section>
    </main>
</div>
  `,
  styles: [`
    .dashboard-container {
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

    .nav-actions {
      display: flex;
      gap: 1rem;
      align-items: center;
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

    .btn-logout {
      background: white;
      color: #667eea;
      border: none;
      padding: 0.5rem 1.5rem;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s;
    }

    .btn-logout:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }

    .content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    section {
      margin-bottom: 3rem;
    }

    h2 {
      color: #2d3748;
      margin-bottom: 1.5rem;
      font-size: 1.8rem;
    }

    h3 {
      color: #4a5568;
      margin-bottom: 1rem;
      font-size: 1.3rem;
    }

    .card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      margin-bottom: 1rem;
    }

    .card.loading {
      text-align: center;
      color: #718096;
    }

    .card.error {
      background: #fed7d7;
      color: #c53030;
    }

    .weather-info {
      display: flex;
      align-items: center;
      gap: 2rem;
      margin-bottom: 1rem;
    }

    .temp {
      font-size: 3rem;
      font-weight: bold;
      color: #667eea;
    }

    .location {
      font-size: 1.3rem;
      font-weight: 600;
      color: #2d3748;
    }

    .condition {
      color: #718096;
    }

    .weather-details {
      display: flex;
      gap: 2rem;
      color: #4a5568;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
    }

    .race-category {
      margin-bottom: 2rem;
    }

    .race-card {
      transition: transform 0.3s;
    }

    .race-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    }

    .race-name {
      font-size: 1.2rem;
      font-weight: 600;
      color: #2d3748;
      margin-bottom: 0.5rem;
    }

    .race-details, .race-date {
      color: #718096;
      margin-top: 0.25rem;
    }
  `]
})
export class DashboardComponent implements OnInit {
  weather: WeatherData | null = null;
  weatherError: string | null = null;
  races: RaceData | null = null;

  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) { }

  ngOnInit() {
    this.loadWeather();
    this.loadRaces();
  }

  loadWeather() {
    // Get user's location and fetch weather
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          this.http.get<WeatherData>(`${this.apiUrl}/weather?lat=${lat}&lon=${lon}`)
            .subscribe({
              next: (data) => this.weather = data,
              error: (err) => this.weatherError = 'Failed to load weather data'
            });
        },
        () => {
          // Fallback to a default city if geolocation fails
          this.http.get<WeatherData>(`${this.apiUrl}/weather?city=London`)
            .subscribe({
              next: (data) => this.weather = data,
              error: (err) => this.weatherError = 'Failed to load weather data'
            });
        }
      );
    }
  }

  loadRaces() {
    this.http.get<RaceData>(`${this.apiUrl}/races/upcoming`)
      .subscribe({
        next: (data) => this.races = data,
        error: (err) => console.error('Failed to load races', err)
      });
  }

  logout() {
    this.auth.logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    });
  }
}