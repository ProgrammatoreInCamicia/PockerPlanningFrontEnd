import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RoomApiService } from '../../core/http/room-api.service';
import { CurrentUser, RoomStore } from '../../state/room.store';
import { Router } from '@angular/router';
import { saveSession } from '../../core/session/session.store';

@Component({
  selector: 'app-join',
  imports: [FormsModule],
  templateUrl: './join.component.html',
  styleUrl: './join.component.scss',
})
export class JoinComponent {
  private readonly roomApi = inject(RoomApiService);
  private readonly roomStore = inject(RoomStore);
  private readonly router = inject(Router);

  readonly userName = signal('');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  async createRoom(): Promise<void> {
    const name = this.userName().trim();
    if (!name) return;

    this.loading.set(true);
    this.error.set(null);

    try {
      const roomId = await this.roomApi.createRoom();

      const user: CurrentUser = {
        userId: crypto.randomUUID(),
        userName: name,
        role: 'facilitator',
      };

      saveSession(roomId, user);
      await this.roomStore.connectAndJoin(roomId, user);

      this.router.navigate(['/room', roomId]);
    } catch (err) {
      console.error('Errore nella creazione della stanza:', err);
      this.error.set('Impossibile creare la stanza. Riprova.');
    } finally {
      this.loading.set(false);
    }
  }
}
