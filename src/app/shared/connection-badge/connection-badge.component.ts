import { Component, computed, inject } from '@angular/core';
import { RoomStore } from '../../state/room.store';

@Component({
  selector: 'app-connection-badge',
  imports: [],
  templateUrl: './connection-badge.component.html',
  styleUrl: './connection-badge.component.scss',
})
export class ConnectionBadgeComponent {
  readonly roomStore = inject(RoomStore);

  readonly label = computed(() => {
    switch (this.roomStore.connectionStatus()) {
      case 'connected': return 'Connesso';
      case 'connecting': return 'Connessione...';
      case 'reconnecting': return 'Riconnessione...';
      case 'error': return 'Errore di connessione';
      case 'disconnected': return 'Disconnesso';
    }
  });
}
