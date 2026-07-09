import { computed, inject, Service, signal } from "@angular/core";
import { WebsocketService } from "../core/websocket/websocket.service";
import { IncomingMessage, ParticipantDto, TaskDto } from "../core/websocket/poker-messages";

export interface CurrentUser {
    userId: string;
    userName: string;
    role: 'voter' | 'facilitator';
}

@Service()
export class RoomStore {
    private readonly ws = inject(WebsocketService);

    // Stato privato scrivibile solo da qui
    private readonly _preset = signal<string>('fibonacci');
    private readonly _revealed = signal<boolean>(false);
    private readonly _activeTaskId= signal<string | null>(null);
    private readonly _tasks = signal<TaskDto[]>([]);
    private readonly _participants = signal<ParticipantDto[]>([]);
    private readonly _currentUser = signal<CurrentUser | null>(null);
    private readonly _lastError = signal<string | null>(null);

    // public
    readonly preset = this._preset.asReadonly();
    readonly revealed = this._revealed.asReadonly();
    readonly activeTaskId = this._activeTaskId.asReadonly();
    readonly tasks = this._tasks.asReadonly();
    readonly participants = this._participants.asReadonly();
    readonly currentUser = this._currentUser.asReadonly();
    readonly lastError = this._lastError.asReadonly();
    readonly connectionStatus = this.ws.connectionStatus;

    // computed
    readonly activeTask = computed<TaskDto | null>(() => {
        const id = this._activeTaskId();
        if (!id) return null;
        return this._tasks().find((t) => t.id === id) ?? null;
    });

    readonly isFacilitator = computed<boolean>(() => {
        return this._currentUser()?.role === 'facilitator';
    })

    readonly allVoted = computed<boolean>(() => {
        const voters = this._participants().filter((p) => p.role === 'voter' && p.connected);
        return voters.length > 0 && voters.every((p) => p.hasVoted);
    });

    constructor() {
        this.ws.onMessage((msg) => this.applyServerMessage(msg));
    }

    // azioni pubbliche 
    async connectAndJoin(roomId: string, user: CurrentUser): Promise<void> {
        this._currentUser.set(user);
        await this.ws.connect(roomId);
        this.ws.send({
            type: 'join',
            userId: user.userId,
            userName: user.userName,
            role: user.role
        });
    }

    vote(value: string): void {
        this.ws.send({ type: 'vote', value });
    }

    reveal(): void {
        this.ws.send({ type: 'reveal' });
    }

    reset(): void {
        this.ws.send({ type: 'reset' });
    }

    changePreset(preset: string): void {
        this.ws.send({ type: 'changePreset', preset });
    }

    selectTask(taskId: string): void {
        this.ws.send({ type: 'selectTask', taskId });
    }

    // Messaggi in arrivo dal server
    private applyServerMessage(msg: IncomingMessage): void {
        switch (msg.type) {
            case 'roomState':
                this._preset.set(msg.preset);
                this._revealed.set(msg.revealed);
                this._activeTaskId.set(msg.activeTaskId);
                this._tasks.set(msg.tasks);
                this._participants.set(msg.participants);
                break;
            case 'voteRevealed':
                // I voti finali sono già dentro activeTask.lastVotes grazie al roomState
                // che arriva subito dopo (il backend manda entrambi in sequenza).
                // Non serve stato separato qui, ma lasciamo il case esplicito per chiarezza
                // e per un futuro highlight "voti appena rivelati".
                break;
            case 'error':
                this._lastError.set(msg.message);
                break;
        };
    }
}