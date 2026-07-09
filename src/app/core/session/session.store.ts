import { CurrentUser } from "../../state/room.store";

const KEY_PREFIX = 'poker-session:';

export function saveSession(roomId: string, user: CurrentUser): void {
    sessionStorage.setItem(KEY_PREFIX + roomId, JSON.stringify(user));
}

export function loadSession(roomId: string): CurrentUser | null {
    const data = sessionStorage.getItem(KEY_PREFIX + roomId);
    if (!data) return null;

    try {
        return JSON.parse(data) as CurrentUser;
    } catch {
        return null;
    }
}