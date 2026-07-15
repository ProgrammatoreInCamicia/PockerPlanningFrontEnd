export function formatRoomName(roomId: string): string {
    return roomId
        .split('-')
        .map((word) => {
            // se il segmento è puramente numerico (es. suffisso "42"), lascialo invariato
            if (/^\d+$/.test(word)) return word;
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(' ');
}