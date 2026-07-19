import { Service, signal } from '@angular/core';

export type ToastType = 'error' | 'success' | 'info';

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

@Service()
export class ToastService {
    private readonly _toasts = signal<Toast[]>([]);
    readonly toasts = this._toasts.asReadonly();

    show(message: string, type: ToastType = 'info', durationMs = 4000): void {
        const id = crypto.randomUUID();
        this._toasts.update((current) => [...current, {id, message, type}]);

        setTimeout(() => this.dismiss(id), durationMs);
    }

    error(message: string): void {
        this.show(message, 'error', 5000);
    }

    success(message: string): void {
        this.show(message, 'success', 3000);
    }

    dismiss(id: string): void {
        this._toasts.update((current) => current.filter((x) => x.id != id));
    }
}
