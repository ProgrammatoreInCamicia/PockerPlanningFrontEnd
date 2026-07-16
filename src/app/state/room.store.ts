import { computed, inject, Service, signal } from "@angular/core";
import { WebsocketService } from "../core/websocket/websocket.service";
import { CardPresets, EmojiThrownMessage, IncomingMessage, ParticipantDto, TaskDto } from "../core/websocket/poker-messages";

export interface CurrentUser {
    userId: string;
    userName: string;
    role: 'voter' | 'facilitator';
}

@Service()
export class RoomStore {
    private readonly ws = inject(WebsocketService);

    // Stato privato scrivibile solo da qui
    private readonly _preset = signal<'fibonacci' | 'tshirt'>('fibonacci');
    private readonly _revealed = signal<boolean>(false);
    private readonly _activeTaskId= signal<string | null>(null);
    private readonly _tasks = signal<TaskDto[]>([]);
    private readonly _participants = signal<ParticipantDto[]>([]);
    private readonly _currentUser = signal<CurrentUser | null>(null);
    private readonly _lastError = signal<string | null>(null);
    private readonly _selectedVote = signal<string | null>(null);
    private readonly _lastEmojiThrow = signal<EmojiThrownMessage | null>(null);

    // public
    readonly preset = this._preset.asReadonly();
    readonly revealed = this._revealed.asReadonly();
    readonly activeTaskId = this._activeTaskId.asReadonly();
    readonly tasks = this._tasks.asReadonly();
    readonly participants = this._participants.asReadonly();
    readonly currentUser = this._currentUser.asReadonly();
    readonly lastError = this._lastError.asReadonly();
    readonly connectionStatus = this.ws.connectionStatus;
    readonly selectedVote = this._selectedVote.asReadonly();
    readonly lastEmojiThrow = this._lastEmojiThrow.asReadonly();

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

    readonly cards = computed(() => {
        return CardPresets[this._preset()] || [];
    });

    readonly userVotes = computed(() => {
        const activeTask = this.activeTask();
        const userVotes = new Map<string, string | null>();
        activeTask?.lastVotes?.forEach(v => userVotes.set(v.userId, v.value)); 
        return userVotes;
    });

    readonly groupedVotes = computed(() => {
        const activeTask = this.activeTask();
        const groupedVotes = new Map<string | null, number>();
        activeTask?.lastVotes?.forEach(vote => {
            if (groupedVotes.has(vote.value))
            {
                groupedVotes.set(vote.value, groupedVotes.get(vote.value)! + 1);
            } else {
                groupedVotes.set(vote.value, 1);
            }
        });
        return groupedVotes;
    })

    constructor() {
        this.ws.onMessage((msg) => this.applyServerMessage(msg));
        this.ws.onReconnected(() => this.rejoinAfterReconnect());
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
        this._selectedVote.set(value);
        this.ws.send({ type: 'vote', value });
    }

    reveal(): void {
        this.ws.send({ type: 'reveal' });
    }

    reset(): void {
        this.ws.send({ type: 'reset' });
    }

    resetTasks(): void {
        this.ws.send({ type: 'resetTasks' });
    }

    changePreset(preset: string): void {
        this.ws.send({ type: 'changePreset', preset });
    }

    selectTask(taskId: string): void {
        this.ws.send({ type: 'selectTask', taskId });
    }

    throwEmoji(targetUserId: string, emoji: string): void {
        this.ws.send({ type: 'throwEmoji', targetUserId, emoji });
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
                // sincronizza lo stato locale "carta selezionata" con la verità del server:
                // se il server dice che non ho votato, la mia selezione locale è stantia
                const me = msg.participants.find((p) => p.userId === this._currentUser()?.userId);
                if (me && !me.hasVoted) {
                    this._selectedVote.set(null);
                }
                break;
            case 'votesRevealed':
                // I voti finali sono già dentro activeTask.lastVotes grazie al roomState
                // che arriva subito dopo (il backend manda entrambi in sequenza).
                // Non serve stato separato qui, ma lasciamo il case esplicito per chiarezza
                // e per un futuro highlight "voti appena rivelati".
                break;
            case 'error':
                this._lastError.set(msg.message);
                break;
            case 'emojiThrown':
                this._lastEmojiThrow.set(msg);
                break;
        };
    }

    private rejoinAfterReconnect(): void {
        const user = this._currentUser();
        if (!user) return;

        this.ws.send({
            type: 'join',
            userId: user.userId,
            userName: user.userName,
            role: user.role,
        });
    }
}