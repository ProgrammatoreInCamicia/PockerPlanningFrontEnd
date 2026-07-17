import { Component, computed, effect, inject, signal } from '@angular/core';
import { RoomStore } from '../../../../state/room.store';
import { ParticipantDto } from '../../../../core/websocket/poker-messages';
import { EmojiPopoverComponent } from '../../../../shared/emoji-popover/emoji-popover.component';

interface PositionedParticipant {
  participant: ParticipantDto;
  xPercent: number;
  yPercent: number;
}

@Component({
  selector: 'app-participants-table',
  imports: [EmojiPopoverComponent],
  templateUrl: './participants-table.component.html',
  styleUrl: './participants-table.component.scss',
})
export class ParticipantsTableComponent {
  readonly roomStore = inject(RoomStore);

  readonly facilitator = computed<ParticipantDto | null>(() => {
    return this.roomStore.participants().find((p) => p.role === 'facilitator') ?? null;
  });

  private readonly ASPECT_W = 7; // deve combaciare con aspect-ratio: 7/4 nel CSS
  private readonly ASPECT_H = 4;

  readonly openPickerFor = signal<string | null>(null);
  readonly popoverPosition = signal<{ x: number; y: number } | null>(null);

  private readonly onDocumentClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;

    // se il click è dentro il popover stesso o su una card partecipante, non chiudere qui
    // (il toggle della card è già gestito dal suo stesso (click), evitiamo doppio-tap)
    if (target.closest('.floating-popover') || target.closest('[data-participant-id]')) {
      return;
    }

    this.closePicker();
  };

  constructor() {
    effect((onCleanup) => {
      if (this.openPickerFor() !== null) {
        document.addEventListener('click', this.onDocumentClick);
        onCleanup(() => document.removeEventListener('click', this.onDocumentClick));
      }
    });
  }

  private stadiumPoint(s: number, W: number, H: number): { x: number; y: number } {
    const r = H / 2;
    const a = (W - H) / 2;
    const straight = 2 * a;
    const capArc = Math.PI * r;
    const P = 2 * straight + 2 * capArc;

    s = ((s % P) + P) % P; // normalizza in [0, P)

    if (s < a) {
      return { x: s, y: -r }; // metà destra del bordo superiore
    }
    s -= a;

    if (s < capArc) {
      const theta = s / r;
      return { x: a + r * Math.sin(theta), y: -r * Math.cos(theta) }; // semicerchio destro
    }
    s -= capArc;

    if (s < straight) {
      return { x: a - s, y: r }; // bordo inferiore, da destra a sinistra
    }
    s -= straight;

    if (s < capArc) {
      const theta = s / r;
      return { x: -a - r * Math.sin(theta), y: r * Math.cos(theta) }; // semicerchio sinistro
    }
    s -= capArc;

    return { x: -a + s, y: -r }; // metà sinistra del bordo superiore
  }

  readonly positionedVoters = computed<PositionedParticipant[]>(() => {
    const voters = this.roomStore.participants().filter((p) => p.role === 'voter');
    const n = voters.length;
    if (n === 0) return [];

    const W = 100;
    const H = 100 * (this.ASPECT_H / this.ASPECT_W);
    const r = H / 2;
    const a = (W - H) / 2;
    const P = 4 * a + 2 * Math.PI * r;

    const gapLength = P * 0.14; // arco riservato al facilitator in cima

    // const radiusX = 50; // % rispetto al centro, asse orizzontale
    // const radiusY = 48; // % rispetto al centro, asse verticale

    // const topGapDegrees = 50; // fascia esclusa in cima, riservata al facilitator
    // const startAngle = (Math.PI / 2) + ((topGapDegrees / 2) * Math.PI / 180);
    // const totalAngle = (2 * Math.PI) - (topGapDegrees * Math.PI / 180);

    return voters.map((participant, i) => {
      const slot = (P - gapLength) / n;
      const s = gapLength / 2 + slot * i + slot / 2;
      const { x, y } = this.stadiumPoint(s, W, H);

      return {
        participant,
        xPercent: 50 + x,
        yPercent: 50 + (y / H) * 100,
      };
      // const angle = startAngle + (totalAngle * i) / n;
      // const xPercent = 50 + radiusX * Math.cos(angle);
      // const yPercent = 50 + radiusY * Math.sin(angle);
      // return { participant, xPercent, yPercent };
    });
  });

  hasVoteToShow(participant: ParticipantDto): boolean {
    return this.roomStore.revealed() && participant.hasVoted;
  }

  voteValueFor(participant: ParticipantDto): string | null {
    const activeTask = this.roomStore.activeTask();
    if (!activeTask?.lastVotes) return null;
    const vote = activeTask.lastVotes.find((v) => v.userId === participant.userId);
    return vote?.value ?? null;
  }

  togglePicker(userId: string): void {
    if (this.openPickerFor() === userId) {
      this.openPickerFor.set(null);
      this.popoverPosition.set(null);
      return;
    }

    this.openPickerFor.set(userId);

    const cardEl = document.querySelector<HTMLElement>(`[data-participant-id="${userId}"]`);
    if (cardEl) {
      const rect = cardEl.getBoundingClientRect();
      const popoverWidth = 220;
      const popoverHeight = 260;

      let x = rect.left + rect.width / 2 - popoverWidth / 2;
      let y = rect.bottom + 8;

      // se sfora sotto, aprilo sopra la card
      if (y + popoverHeight > window.innerHeight) {
        y = rect.top - popoverHeight - 8;
      }
      // clamp orizzontale ai bordi
      x = Math.max(8, Math.min(x, window.innerWidth - popoverWidth - 8));

      this.popoverPosition.set({ x, y });
    }
    // this.openPickerFor.set(this.openPickerFor() === userId ? null : userId);
  }

  onEmojiSelected(targetUserId: string, emoji: string): void {
    this.roomStore.throwEmoji(targetUserId, emoji);
  }

  private closePicker(): void {
    this.openPickerFor.set(null);
    this.popoverPosition.set(null);
  }

  onKickClick(event: MouseEvent, userId: string, userName: string): void {
    event.stopPropagation();
    if (confirm(`Rimuovere ${userName} dalla stanza?`)) {
      this.roomStore.kickParticipant(userId);
    }
  }
}
