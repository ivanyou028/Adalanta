import React, { useRef, useState, useEffect, forwardRef } from "react";
import { GET_MESSAGES, AUTH } from "./config";
import { useSocket } from "./socket";
import { useAuthState } from "react-firebase-hooks/auth";

export default function ChatRoom() {
  const [user] = useAuthState(AUTH);
  const socket = useSocket();
  const [connected, setConnected] = useState(socket?.connected);
  const [messages, setMessages] = useState([]);
  const [threadBusy, setThreadBudy] = useState(false);
  const dummy = useRef();

  const scrollToBottom = () => {
    if (dummy.current) {
      dummy.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (user) {
      fetch(GET_MESSAGES(user.uid))
        .then((response) => response.json())
        .then((data) => setMessages(data));
    }

    if (socket) {
      socket.on("receive_message", (message) => {
        setMessages((prevMessages) => [...prevMessages, message]);
      });
      socket.on("connect", () => {
        setConnected(true);
      });
      socket.on("disconnect", () => {
        setConnected(false);
      });
      socket.on("thread_busy", () => {
        setThreadBudy(true);
      });
      socket.on("thread_free", () => {
        setThreadBudy(false);
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
        <div class="flex h-full flex-col overflow-y-auto">
          <div class="grid grid-cols-12 gap-y-2">
            {messages &&
              messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  photoURL={msg.user === user.uid ? user.photoURL : null}
                />
              ))}
            <div ref={dummy} />
          </div>
        </div>
        <div class="mt-auto">
          <SendMessage ref={dummy} connected={connected} waiting={threadBusy} />
        </div>

        {/* <UploadFile connected={connected}/> */}
      </div>
    </>
  );
}

const SendMessage = forwardRef((props, ref) => {
  const socket = useSocket();
  const [formValue, setFormValue] = useState("");
  const { connected, waiting } = props;

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
            disabled={!connected || waiting}
            class="flex h-10 w-full rounded-xl border pl-4 focus:border-indigo-300 focus:outline-none"
          />
        </div>
      </div>
      <div class="ml-4">
        <button
          class={`flex flex-shrink-0 items-center justify-center rounded-xl px-4 py-1 font-semibold transition ease-in-out ${
            connected && !waiting
              ? "bg-indigo-500 text-white hover:scale-110 hover:bg-indigo-600"
              : "cursor-not-allowed bg-gray-400 text-white"
          }`}
          type="submit"
          disabled={!connected || waiting}
        >
          {(!connected || waiting) && (
            <svg
              aria-hidden="true"
              role="status"
              class="mr-3 inline h-4 w-4 animate-spin text-white"
              viewBox="0 0 100 101"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                fill="#E5E7EB"
              />
              <path
                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                fill="currentColor"
              />
            </svg>
          )}
          {waiting ? "Waiting" : connected ? "Send" : "Connecting"}
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
  const {
    message: { text, user: uid },
    photoURL,
  } = props;
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
        // "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
        "https://img.freepik.com/free-icon/robot_318-843609.jpg"
      }
      class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500"
    />
  );
}
