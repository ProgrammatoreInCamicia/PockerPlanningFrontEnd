import { HttpClient } from "@angular/common/http";
import { inject, Service } from "@angular/core";
import { firstValueFrom, Observable } from "rxjs";

interface CreateRoomResponse {
  roomId: string;
}

@Service()
export class RoomApiService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = 'https://localhost:7188/api/rooms';

    async createRoom(): Promise<string> {
        const response = await firstValueFrom(
            this.http.post<CreateRoomResponse>(this.baseUrl, {})
        );
        return response.roomId;
    }

    importTasks(
        roomId: string, 
        file: File,
        mapping: { titleColumn: string; priorityColumn: string | null; linkColumn: string | null }
    ): Observable<void> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('titleColumn', mapping.titleColumn);
        if (mapping.priorityColumn) formData.append('priorityColumn', mapping.priorityColumn);
        if (mapping.linkColumn) formData.append('linkColumn', mapping.linkColumn);

        return this.http.post<void>(`${this.baseUrl}/${roomId}/importTasks`, formData)
    }
}