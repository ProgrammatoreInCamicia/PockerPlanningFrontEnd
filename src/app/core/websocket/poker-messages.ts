export type OutgoingMessage = 
    | { type: 'join'; userId: string; userName: string; role: 'voter' | 'facilitator' }
    | { type: 'vote'; value: string }
    | { type: 'reveal' }
    | { type: 'reset' }
    | { type: 'changePreset'; preset: string }
    | { type: 'selectTask'; taskId: string };

export interface ParticipantDto {
    userName: string;
    role: 'voter' | 'facilitator';
    hasVoted: boolean;
    connected: boolean;
}

export interface VoteResultDto {
    userName: string;
    value: string | null;
}

export type TaskStatus = "Pending" | "Voting" | "Voted";

export interface TaskDto {
    id: string;
    title: string;
    status: TaskStatus;
    lastVotes: VoteResultDto[] | null;
}

export interface RoomStateMessage {
    type: 'roomState',
    preset: string;
    revealed: boolean;
    activeTaskId: string | null;
    tasks: TaskDto[];
    participants: ParticipantDto[];
}

export interface VotesRevealedMessage {
    type: 'voteRevealed',
    votes: VoteResultDto[];
}

export interface ErrorMessage {
  type: 'error';
  message: string;
}

export type IncomingMessage = RoomStateMessage | VotesRevealedMessage | ErrorMessage;
