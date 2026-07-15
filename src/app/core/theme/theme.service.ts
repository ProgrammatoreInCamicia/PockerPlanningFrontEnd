import { effect, Service, signal } from "@angular/core";

export type ThemePreference = 'light' | 'dark' | 'system';
const STORAGE_KEY = 'poker-theme-preference';

@Service()
export class ThemeService {
    private readonly _preference = signal<ThemePreference>(this.loadStoredPreference());
    readonly preference = this._preference.asReadonly();

    constructor() {
        effect(() => {
            const pref = this._preference();
            const root = document.documentElement;

            if (pref === 'system') {
                root.removeAttribute('data-theme');
            } else {
                root.setAttribute('data-theme', pref);
            }

            localStorage.setItem(STORAGE_KEY, pref);
        });
    }

    setPreference(pref: ThemePreference): void {
        this._preference.set(pref);
    }

    private loadStoredPreference(): ThemePreference {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
            return stored;
        }
        return 'system';
    }
}