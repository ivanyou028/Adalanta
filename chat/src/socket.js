import io from "socket.io-client";

const SOCKET_SERVER_URL = "http://localhost:5000";
export const GET_MESSAGES = `${SOCKET_SERVER_URL}/get_messages`;
export const socket = io(SOCKET_SERVER_URL);

socket.on("receive_message", (message) => {
  console.log("Received message:", message);
});

socket.on("conect", () => {
  console.log("connected!");
});

socket.on("disconnect", () => {
  console.log("disconnected!");
});
