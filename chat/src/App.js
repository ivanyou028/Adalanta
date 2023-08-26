import "./App.css";
import React, { useRef, useState, useEffect } from "react";
import * as firebase from "firebase/app";
import {
  useAuthState,
  useSignOut,
  useSignInWithGoogle,
} from "react-firebase-hooks/auth";
import { getAuth } from "firebase/auth";
import { FIREBASE_CONFIG } from "./firebase-config";
import { socket, GET_MESSAGES } from "./socket";

const app = firebase.initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);

function App() {
  const [user] = useAuthState(auth);

  return (
    <div className="App">
      <div class="flex h-screen  text-gray-800 antialiased">
        <div class="flex h-full w-full flex-row overflow-x-hidden">
          <div class="flex flex-auto flex-col p-6">
            <div class="flex h-10 w-full flex-row-reverse items-center justify-start bg-white pb-6">
              <SignOut />
            </div>
            <div class="h-full">{user ? <ChatRoom /> : <SignIn />}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatRoom() {
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(socket.connected);
  const [formValue, setFormValue] = useState("");
  const dummy = useRef();

  useEffect(() => {
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
  }, []);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (connected) {
      const { uid, photoURL } = auth.currentUser;
      socket.emit("send_message", { user: uid, text: formValue });
      dummy.current.scrollIntoView({ behavior: "smooth" });
      setFormValue(""); // Clear the input
    }
  };

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
      </div>
    </>
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

function ChatMessage(props) {
  const { text, user: uid, photoURL } = props.message;
  const messageClass = uid === auth.currentUser.uid ? "sent" : "received";
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

function SignIn() {
  const [signInWithGoogle, user, loading, error] = useSignInWithGoogle(auth);
  return (
    <button
      onClick={() => signInWithGoogle()}
      class="rounded-xl border border-gray-400 bg-white px-2 py-1 text-gray-800 shadow hover:bg-gray-100"
    >
      {" "}
      Sign in with Google{" "}
    </button>
  );
}

function SignOut() {
  const [signOut, loading, error] = useSignOut(auth);
  return (
    auth.currentUser && (
      <button
        onClick={signOut}
        class="rounded-xl border bg-white px-2 py-1 text-gray-500 shadow hover:bg-gray-100"
      >
        Sign Out
      </button>
    )
  );
}

export default App;
