import React, { useRef, useState, useEffect, forwardRef } from "react";
import { GET_MESSAGES, AUTH } from "./config";
import { useSocket } from "./socket";

export default function ChatRoom() {
  const socket = useSocket();
  const [connected, setConnected] = useState(socket?.connected);
  const [messages, setMessages] = useState([]);
  const dummy = useRef();

  useEffect(() => {
    if (socket) {
      fetch(GET_MESSAGES)
        .then((response) => response.json())
        .then((data) => setMessages(data));
      socket.on("receive_message", (message) => {
        setMessages((prevMessages) => [...prevMessages, message]);
      });
      socket.on("connect", () => {
        setConnected(true);
      });
      socket.on("disconnect", () => {
        setConnected(false);
      });

      return () => {
        socket.off("receive_message");
        socket.off("connect");
        socket.off("disconnect");
      };
    }
  }, [socket]);

  return (
    <>
      <div class="flex h-full flex-auto flex-shrink-0 flex-col rounded-2xl bg-gray-100 p-4">
        <div class="flex h-full flex-col">
          <div class="grid grid-cols-12 gap-y-2">
            {messages &&
              messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)}
            <div ref={dummy} />
          </div>
        </div>
        <SendMessage ref={dummy} connected={connected} />
        {/* <UploadFile connected={connected}/> */}
      </div>
    </>
  );
}

const SendMessage = forwardRef((props, ref) => {
  const socket = useSocket();
  const [formValue, setFormValue] = useState("");
  const { connected } = props;

  const sendMessage = async (e) => {
    e.preventDefault();
    if (connected) {
      const { uid, photoURL } = AUTH.currentUser;
      socket.emit("send_message", { user: uid, text: formValue });
      ref.current.scrollIntoView({ behavior: "smooth" });
      setFormValue(""); // Clear the input
    }
  };

  return (
    <form
      onSubmit={sendMessage}
      class="flex h-16 w-full flex-row items-center rounded-xl bg-white px-4"
    >
      <div class="ml-4 flex-grow">
        <div class="relative w-full">
          <input
            value={formValue}
            onChange={(e) => setFormValue(e.target.value)}
            class="flex h-10 w-full rounded-xl border pl-4 focus:border-indigo-300 focus:outline-none"
          />
        </div>
      </div>
      <div class="ml-4">
        <button
          class={`flex flex-shrink-0 items-center justify-center rounded-xl px-4 py-1 font-semibold ${
            connected
              ? "bg-indigo-500 text-white transition ease-in-out hover:scale-110 hover:bg-indigo-600"
              : "cursor-not-allowed bg-gray-400 text-gray-300"
          }`}
          type="submit"
          disabled={!connected}
        >
          <span>Send</span>
        </button>
      </div>
    </form>
  );
});

function UploadFile(props) {
  const { connected } = props;
  return (
    <form
      //   onSubmit={sendMessage} TODO write submitFile
      class="flex w-full flex-row items-center rounded-xl bg-white px-4 py-3"
    >
      <div class="ml-4 flex-grow">
        <div class="relative w-full">
          <div class="flex w-full items-center justify-center">
            <label
              for="dropzone-file"
              class="dark:hover:bg-bray-800 mr-4 flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-gray-500 dark:hover:bg-gray-600"
            >
              <div class="flex flex-col items-center justify-center">
                <svg
                  class=" my-2 h-8 w-8 text-gray-500 dark:text-gray-400"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 20 16"
                >
                  <path
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                  />
                </svg>
                <p class="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  <span class="font-semibold">Click to upload</span> or drag and
                  drop
                </p>
              </div>
              <input id="dropzone-file" type="file" class="hidden" />
            </label>
          </div>
        </div>
      </div>

      <button
        class={`flex flex-shrink-0 items-center justify-center rounded-xl px-4 py-1 font-semibold ${
          connected
            ? "bg-indigo-500 text-white transition ease-in-out hover:scale-110 hover:bg-indigo-600"
            : "cursor-not-allowed bg-gray-400 text-gray-300"
        }`}
        type="submit"
        disabled={!connected}
      >
        <span>Send</span>
      </button>
    </form>
  );
}

function ChatMessage(props) {
  const { text, user: uid, photoURL } = props.message;
  const messageClass = uid === AUTH.currentUser.uid ? "sent" : "received";
  if (messageClass === "received") {
    return (
      <div class="col-start-1 col-end-8 rounded-lg p-3">
        <div
          className={`message ${messageClass}`}
          class="flex flex-row items-center"
        >
          <Avatar photoURL={photoURL} />
          <p class="relative ml-3 rounded-xl bg-white px-4 py-2 text-sm outline outline-slate-200">
            {text}
          </p>
        </div>
      </div>
    );
  }
  return (
    <div class="col-start-6 col-end-13 rounded-lg p-3">
      <div
        className={`message ${messageClass}`}
        class="flex flex-row-reverse items-center justify-start"
      >
        <Avatar photoURL={photoURL} />
        <p class="relative mr-3 rounded-xl bg-indigo-200 px-4 py-2 text-sm shadow shadow-indigo-300">
          {text}
        </p>
      </div>
    </div>
  );
}

function Avatar(props) {
  const { photoURL } = props;
  return (
    <img
      src={
        photoURL ??
        "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
      }
      class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500"
    />
  );
}
