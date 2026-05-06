import { io } from 'socket.io-client';

const socket = io('http://54.233.121.231:4000', { transports: ['websocket'] });

socket.on('connect', () => {
    console.log('Connected directly!');
    socket.close();
});

socket.on('connect_error', (err) => {
    console.error('Conn error directly:', err.message);
    socket.close();
});
