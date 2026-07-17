import { Service, signal } from '@angular/core';
import { IncomingMessage, OutgoingMessage } from './poker-messages';
import { environment } from '../../../environments/environment';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'reconnecting';

@Service()
export class WebsocketService {
    private socket: WebSocket | null = null;
    private currentRoomId: string | null = null;
    private reconnectAttempt = 0;
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private manuallyDisconnected = false;

    private readonly _connectionStatus = signal<ConnectionStatus>('disconnected');
    readonly connectionStatus = this._connectionStatus.asReadonly();

    private onMessageCallback: ((msg: IncomingMessage)  => void) | null = null;
    private onReconnectedCallback: (() => void) | null = null;

    connect(roomId: string): Promise<void>  {
        this.currentRoomId = roomId;
        this.manuallyDisconnected = false;
        this.reconnectAttempt = 0;
        return this.openSocket();
    }

    private openSocket(): Promise<void> {
        if (this.socket) {
            this.socket.onclose = null;
            this.disconnect();
        }

        this._connectionStatus.set(this.reconnectAttempt > 0 ? 'reconnecting' : 'connecting');

        const url = `${environment.wsUrl}/poker/${this.currentRoomId}`;
        this.socket = new WebSocket(url);

        return new Promise<void>((resolve, reject) => {
            if (!this.socket) {
                reject(new Error('Socket non inizializzato'));
                return;
            }

            this.socket.onopen = () => {
                const wasReconnect = this.reconnectAttempt > 0;
                this.reconnectAttempt = 0;
                this._connectionStatus.set('connected');
                resolve();
                if (wasReconnect) {
                    this.onReconnectedCallback?.();
                }
            };

            this.socket.onmessage = (event: MessageEvent) => {
                try {
                    const parsetMessage = JSON.parse(event.data) as IncomingMessage;
                    this.onMessageCallback?.(parsetMessage);
                } catch (err) {
                    console.error('Messaggio WebSocket non parsabile:', event.data, err);
                }
            };
    
            this.socket.onerror = (event: Event) => {
                console.error('Errore WebSocket:', event);
                this._connectionStatus.set('error');
                reject(new Error('Errore di connessione WebSocket'));
            };
    
            this.socket.onclose = () => {
                this.socket = null;
                if (this.manuallyDisconnected) {
                    this._connectionStatus.set('disconnected');
                    return;
                }
                this.scheduleReconnect();
            };
        });
    }

    private scheduleReconnect(): void {
        this._connectionStatus.set('reconnecting');
        this.reconnectAttempt++;

        // backoff esponenziale con tetto: 1s, 2s, 4s, 8s... fino a un massimo di 15s
        const delay = Math.min(1000 * 2 ** (this.reconnectAttempt - 1), 15000);

        this.reconnectTimer = setTimeout(() => {
            this.openSocket().catch(() => {
                // openSocket già pianifica un nuovo tentativo tramite onclose in caso di fallimento
            });
        }, delay);
    }

    /**
     * Registra il gestore per i messaggi in arrivo. Un solo consumatore alla volta
     * (il RoomStore) - per un caso più complesso con più listener servirebbe un Subject.
    */
    onMessage(callback: (msg: IncomingMessage) => void): void {
        this.onMessageCallback = callback;
    }

    /**
     * Chiamato ogni volta che una riconnessione (non la prima connessione) va a buon fine.
     * Il RoomStore lo usa per rimandare il 'join' e riottenere lo stato aggiornato.
     */
    onReconnected(callback: () => void): void {
        this.onReconnectedCallback = callback;
    }

    send(message: OutgoingMessage): void {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            console.warn('Impossibile inviare: WebSocket non connesso', message);
            return;
        }
        this.socket.send(JSON.stringify(message));
    }

    disconnect(): void {
        this.manuallyDisconnected = true;
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        this.socket?.close();
        this.socket = null;
        this._connectionStatus.set('disconnected');
    }
}
