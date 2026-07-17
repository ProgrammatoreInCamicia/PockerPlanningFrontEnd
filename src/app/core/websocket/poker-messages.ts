export type OutgoingMessage = 
    | { type: 'join'; userId: string; userName: string; role: 'voter' | 'facilitator' }
    | { type: 'vote'; value: string }
    | { type: 'reveal' }
    | { type: 'reset' }
    | { type: 'resetTasks' }
    | { type: 'changePreset'; preset: string }
    | { type: 'selectTask'; taskId: string }
    | { type: 'throwEmoji'; targetUserId: string; emoji: string }
    | { type: 'confirmEstimate'; taskId: string; finalEstimate: string }
    | { type: 'kickParticipant'; targetUserId: string }
    | { type: 'setRoomLocked'; locked: boolean }
    | { type: 'promoteToFacilitator'; targetUserId: string };

export interface ParticipantDto {
    userId: string;
    userName: string;
    role: 'voter' | 'facilitator';
    hasVoted: boolean;
    connected: boolean;
}

export interface VoteResultDto {
    userId: string;
    userName: string;
    value: string | null;
}

export type TaskStatus = "Pending" | "Voting" | "Voted";

export interface TaskDto {
    id: string;
    title: string;
    status: TaskStatus;
    lastVotes: VoteResultDto[] | null;
    metadata: Record<string, string>;
    finalEstimate: string | null;
}

export interface RoomStateMessage {
    type: 'roomState',
    preset: 'fibonacci' | 'tshirt';
    revealed: boolean;
    activeTaskId: string | null;
    locked: boolean;
    tasks: TaskDto[];
    participants: ParticipantDto[];
}

export interface VotesRevealedMessage {
    type: 'votesRevealed',
    votes: VoteResultDto[];
}

export interface ErrorMessage {
  type: 'error';
  message: string;
}

export interface EmojiThrownMessage {
  type: 'emojiThrown';
  id: string;
  fromUserId: string;
  targetUserId: string;
  emoji: string;
}

export interface KickedMessage {
  type: 'kicked';
}

export interface JoinRejectedMessage {
  type: 'joinRejected';
  reason: 'locked' | 'kicked';
}

export type IncomingMessage = RoomStateMessage | VotesRevealedMessage | ErrorMessage 
    | EmojiThrownMessage | KickedMessage | JoinRejectedMessage;

export const CardPresets = {
    "fibonacci": ["0", "1", "2", "3", "5", "8", "13", "21", "?", "☕"],
    "tshirt": ["XS", "S", "M", "L", "XL", "XXL", "?", "☕"],
} as const;