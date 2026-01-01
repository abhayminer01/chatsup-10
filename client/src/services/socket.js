import { io } from "socket.io-client";

const SOCKET_URL = "https://chatsup-10.onrender.com";

export const socket = io(SOCKET_URL, {
    withCredentials: true,
    autoConnect: true,
});
