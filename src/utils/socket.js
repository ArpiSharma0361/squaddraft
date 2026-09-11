import { io } from 'socket.io-client';

const socketUrl =
  typeof window !== 'undefined' && window.location.port === '5173'
    ? window.location.protocol + '//' + window.location.hostname + ':3000'
    : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

export const socket = io(socketUrl, {
  transports: ['websocket', 'polling'],
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 20,
  reconnectionDelay: 1000,
});
