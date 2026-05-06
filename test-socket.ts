import { io } from 'socket.io-client';

const socket = io('http://127.0.0.1:3000', { path: '/nexus-calls/socket.io', transports: ['websocket'] });

socket.on('connect', () => {
    console.log('Connected!');
    socket.close();
});

socket.on('connect_error', (err) => {
    console.error('Conn error:', err.message);
    socket.close();
});
