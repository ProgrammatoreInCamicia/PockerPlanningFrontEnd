import { Component, inject, signal } from '@angular/core';
import { RoomStore } from '../../../../state/room.store';

@Component({
  selector: 'app-voting-panel',
  imports: [],
  templateUrl: './voting-panel.component.html',
  styleUrl: './voting-panel.component.scss',
})
export class VotingPanelComponent {
  readonly roomStore = inject(RoomStore);
  readonly selectedCard = signal<string | null>(null);

  selectCard(card: string): void {
    this.selectedCard.set(card);
    this.roomStore.vote(card);
  }
}
