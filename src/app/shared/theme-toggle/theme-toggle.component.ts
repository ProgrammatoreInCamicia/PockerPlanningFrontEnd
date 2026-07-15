import { Component, inject } from '@angular/core';
import { ThemePreference, ThemeService } from '../../core/theme/theme.service';

@Component({
  selector: 'app-theme-toggle',
  imports: [],
  templateUrl: './theme-toggle.component.html',
  styleUrl: './theme-toggle.component.scss',
})
export class ThemeToggleComponent {
  readonly themeService = inject(ThemeService);

  cycle(): void {
    const order: ThemePreference[] = ['system', 'light', 'dark'];
    const current = this.themeService.preference();
    const next = order[(order.indexOf(current) + 1) % order.length];
    this.themeService.setPreference(next);
  }

  icon(): string {
    switch (this.themeService.preference()) {
      case 'light': return '☀️';
      case 'dark': return '🌙';
      case 'system': return '💻';
    }
  }
}
