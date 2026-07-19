import { computed, inject, Service, signal } from "@angular/core";
import { WebsocketService } from "../core/websocket/websocket.service";
import { CardPresets, EmojiThrownMessage, IncomingMessage, ParticipantDto, TaskDto } from "../core/websocket/poker-messages";
import { ToastService } from "../core/toast/toast.service";

export interface CurrentUser {
    userId: string;
    userName: string;
    role: 'voter' | 'facilitator';
}

export interface VoteStats {
  distribution: { value: string; count: number; percentage: number }[];
  numericVotes: number[];
  average: number | null;
  median: number | null;
  min: number | null;
  max: number | null;
  totalVotes: number;
  hasFullConsensus: boolean;
  hasWideSpread: boolean; // min/max distanti, segnale di forte disaccordo
}

@Service()
export class RoomStore {
    private readonly ws = inject(WebsocketService);
    private readonly toast = inject(ToastService);

    // Stato privato scrivibile solo da qui
    private readonly _preset = signal<'fibonacci' | 'tshirt'>('fibonacci');
    private readonly _revealed = signal<boolean>(false);
    private readonly _activeTaskId= signal<string | null>(null);
    private readonly _tasks = signal<TaskDto[]>([]);
    private readonly _participants = signal<ParticipantDto[]>([]);
    private readonly _currentUser = signal<CurrentUser | null>(null);
    private readonly _selectedVote = signal<string | null>(null);
    private readonly _lastEmojiThrow = signal<EmojiThrownMessage | null>(null);
    private readonly _locked = signal<boolean>(false);
    private readonly _kickedOrRejected = signal<'kicked' | 'locked' | null>(null);
    
    
    // public
    readonly preset = this._preset.asReadonly();
    readonly revealed = this._revealed.asReadonly();
    readonly activeTaskId = this._activeTaskId.asReadonly();
    readonly tasks = this._tasks.asReadonly();
    readonly participants = this._participants.asReadonly();
    readonly currentUser = this._currentUser.asReadonly();
    readonly connectionStatus = this.ws.connectionStatus;
    readonly selectedVote = this._selectedVote.asReadonly();
    readonly lastEmojiThrow = this._lastEmojiThrow.asReadonly();
    readonly locked = this._locked.asReadonly();
    readonly kickedOrRejected = this._kickedOrRejected.asReadonly();

    // computed
    readonly activeTask = computed<TaskDto | null>(() => {
        const id = this._activeTaskId();
        if (!id) return null;
        return this._tasks().find((t) => t.id === id) ?? null;
    });

    readonly isFacilitator = computed<boolean>(() => {
        return this._currentUser()?.role === 'facilitator';
    })

    readonly votedCount = computed<number>(() => {
        return this._participants().filter((p) => p.role === 'voter' && p.connected && p.hasVoted).length;
    });

        readonly totalConnectedVoters = computed<number>(() => {
        return this._participants().filter((p) => p.role === 'voter' && p.connected).length;
    });

    readonly canReveal = computed<boolean>(() => {
        return this.votedCount() > 0 && !this._revealed();
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

    readonly voteStats = computed<VoteStats | null>(() => {
        const task = this.activeTask();
        if (!task?.lastVotes || task.lastVotes.length === 0) return null;

        const values = task.lastVotes
            .map((v) => v.value)
            .filter((v): v is string => v !== null);

        if (values.length === 0) return null;

        const counts = new Map<string, number>();
        for (const v of values) {
            counts.set(v, (counts.get(v) ?? 0) + 1);
        }

        const distribution = Array.from(counts.entries())
            .map(([value, count]) => ({
                value,
                count,
                percentage: Math.round((count / values.length) * 100),
            }))
            .sort((a, b) => b.count - a.count);

        const numericVotes = values
            .map((v) => parseFloat(v))
            .filter((n) => !isNaN(n))
            .sort((a, b) => a - b);

        const average = numericVotes.length > 0
            ? numericVotes.reduce((sum, n) => sum + n, 0) / numericVotes.length
            : null;

        const median = numericVotes.length > 0
            ? numericVotes.length % 2 === 0
            ? (numericVotes[numericVotes.length / 2 - 1] + numericVotes[numericVotes.length / 2]) / 2
            : numericVotes[Math.floor(numericVotes.length / 2)]
            : null;

        const min = numericVotes.length > 0 ? numericVotes[0] : null;
        const max = numericVotes.length > 0 ? numericVotes[numericVotes.length - 1] : null;

        return {
            distribution,
            numericVotes,
            average: average !== null ? Math.round(average * 100) / 100 : null,
            median,
            min,
            max,
            totalVotes: values.length,
            hasFullConsensus: distribution.length === 1,
            hasWideSpread: min !== null && max !== null && numericVotes.length > 1 && (max - min) > average! * 0.75,
        };
    });

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

    confirmEstimate(taskId: string, finalEstimate: string): void {
        this.ws.send({ type: 'confirmEstimate', taskId, finalEstimate });
    }

    kickParticipant(targetUserId: string): void {
        this.ws.send({ type: 'kickParticipant', targetUserId });
    }

    setRoomLocked(locked: boolean): void {
        this.ws.send({ type: 'setRoomLocked', locked });
    }

    promoteToFacilitator(targetUserId: string): void {
        this.ws.send({ type: 'promoteToFacilitator', targetUserId });
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
                this._locked.set(msg.locked);
                // sincronizza lo stato locale "carta selezionata" con la verità del server:
                // se il server dice che non ho votato, la mia selezione locale è stantia
                const me = msg.participants.find((p) => p.userId === this._currentUser()?.userId);
                
                if (me) {
                    const current = this._currentUser();
                    if (current && current.role !== me.role) {
                        this._currentUser.set({ ...current, role: me.role }); // <-- ruolo sempre allineato al server
                    }
                    if (!me.hasVoted) {
                        this._selectedVote.set(null);
                    }
                }
                break;
            case 'votesRevealed':
                // I voti finali sono già dentro activeTask.lastVotes grazie al roomState
                // che arriva subito dopo (il backend manda entrambi in sequenza).
                // Non serve stato separato qui, ma lasciamo il case esplicito per chiarezza
                // e per un futuro highlight "voti appena rivelati".
                break;
            case 'error':
                this.toast.error(msg.message);
                break;
            case 'emojiThrown':
                this._lastEmojiThrow.set(msg);
                break;
            case 'kicked':
                this._kickedOrRejected.set('kicked');
                this.ws.disconnect(); // ferma il ciclo di riconnessione automatica
                break;

            case 'joinRejected':
                this._kickedOrRejected.set(msg.reason);
                this.ws.disconnect();
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