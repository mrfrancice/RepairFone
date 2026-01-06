import { Routes } from '@angular/router';

export const CHAT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/chat-list/chat-list.component').then((m) => m.ChatListComponent),
    title: 'Messages - RepairFone',
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/chat-room/chat-room.component').then((m) => m.ChatRoomComponent),
    title: 'Conversation - RepairFone',
  },
];
