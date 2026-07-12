import { Component, computed, inject } from '@angular/core';
import { RoomStore } from '../../../../state/room.store';
import { ParticipantDto } from '../../../../core/websocket/poker-messages';

interface PositionedParticipant {
  participant: ParticipantDto;
  xPercent: number;
  yPercent: number;
}

@Component({
  selector: 'app-participants-table',
  imports: [],
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
}
