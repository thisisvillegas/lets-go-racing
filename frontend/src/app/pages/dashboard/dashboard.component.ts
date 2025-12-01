import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '@auth0/auth0-angular';
import { environment } from '../../../environments/environment';
import * as Sentry from '@sentry/angular';


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
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
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
    this.auth.user$.subscribe(user => {
      if (user) {
        // Set user context in Sentry
        Sentry.setUser({
          id: user.sub,
          email: user.email,
          username: user.name,
        });
      }
    });

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

  testSentryError() {
    throw new Error('Test Sentry Error - Frontend');
  }

  logout() {
    this.auth.logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    });
  }
}