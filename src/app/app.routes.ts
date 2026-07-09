import { Routes } from '@angular/router';
import { JoinComponent } from './features/join/join.component';
import { RoomComponent } from './features/room/room.component';

export const routes: Routes = [
    { path: '', component: JoinComponent },
    { path: 'room/:roomId', component: RoomComponent },
    { path: '**', redirectTo: '' },
];
