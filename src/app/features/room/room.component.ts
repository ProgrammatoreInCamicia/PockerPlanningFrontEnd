import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CurrentUser, RoomStore } from '../../state/room.store';
import { loadSession, saveSession } from '../../core/session/session.store';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-room',
  imports: [FormsModule],
  templateUrl: './room.component.html',
  styleUrl: './room.component.scss',
})
export class RoomComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  readonly roomStore = inject(RoomStore);

  readonly roomId = signal('');
  readonly needsName = signal(false);
  readonly voterName = signal('');
  readonly joining = signal(false);
  readonly joinError = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('roomId');
    if (!id) return;

    this.roomId.set(id);

    const existingSession = loadSession(id);
    if (existingSession) {
      this.doJoin(existingSession);
    } else {
      this.needsName.set(true);
    }
  }

  async submitVoterName(): Promise<void> {
    const name = this.voterName().trim();
    if (!name) return;

    const user: CurrentUser = {
      userId: crypto.randomUUID(),
      userName: name,
      role: 'voter',
    };

    saveSession(this.roomId(), user);
    await this.doJoin(user);
  }

  private async doJoin(user: CurrentUser): Promise<void> {
    this.joining.set(true);
    this.joinError.set(null);

    try {
      await this.roomStore.connectAndJoin(this.roomId(), user);
      this.needsName.set(false);
    } catch (err) {
      console.error('Errore di connessione alla stanza:', err);
      this.joinError.set('Impossibile connettersi alla stanza. Il link potrebbe non essere valido.');
      this.needsName.set(true);
    } finally {
      this.joining.set(false);
    }
  }
}
