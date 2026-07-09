import { Service, signal } from '@angular/core';
import { IncomingMessage, OutgoingMessage } from './poker-messages';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

@Service()
export class WebsocketService {
    private socket: WebSocket | null = null;

    private readonly _connectionStatus = signal<ConnectionStatus>('disconnected');
    readonly connectionStatus = this._connectionStatus.asReadonly();

    private onMessageCallback: ((msg: IncomingMessage)  => void) | null = null;

    connect(roomId: string): Promise<void>  {
        if (this.socket) {
            console.warn('WebSocket già connesso, chiudo la connessione precedente prima di riconnettere');
            this.disconnect();
        }

        this._connectionStatus.set('connecting');

        const host = 'localhost:7188'; // TODO: spostare in environment quando avremo ambienti diversi
        const url = `wss://${host}/ws/poker/${roomId}`;

        this.socket = new WebSocket(url);

        return new Promise<void>((resolve, reject) => {
            if (!this.socket) {
                reject(new Error('Socket non inizializzato'));
                return;
            }

            this.socket.onopen = () => {
                this._connectionStatus.set('connected');
                resolve();
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
                this._connectionStatus.set('disconnected');
                this.socket = null;
            };
        });
    }

    /**
     * Registra il gestore per i messaggi in arrivo. Un solo consumatore alla volta
     * (il RoomStore) - per un caso più complesso con più listener servirebbe un Subject.
    */
    onMessage(callback: (msg: IncomingMessage) => void): void {
        this.onMessageCallback = callback;
    }

    send(message: OutgoingMessage): void {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            console.warn('Impossibile inviare: WebSocket non connesso', message);
            return;
        }
        this.socket.send(JSON.stringify(message));
    }

    disconnect(): void {
        this.socket?.close();
        this.socket = null;
        this._connectionStatus.set('disconnected');
    }
}
