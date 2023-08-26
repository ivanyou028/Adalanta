import logo from "./logo.svg";
import "./App.css";
import React, { useRef, useState } from "react";
import * as firebase from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { collection, serverTimestamp } from "firebase/firestore";
import {
  useAuthState,
  useSignOut,
  useSignInWithGoogle,
} from "react-firebase-hooks/auth";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { getAuth } from "firebase/auth";
import { query, orderBy, limit } from "firebase/firestore";
import { FIREBASE_CONFIG } from "./firebase-config";

// Initialize Firebase
const app = firebase.initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);
const firestore = getFirestore();

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
        class="rounded-xl border border-gray-400 bg-white px-2 py-1 text-gray-800 shadow hover:bg-gray-100"
      >
        Sign Out
      </button>
    )
  );
}

function ChatRoom() {
  const messagesRef = collection(firestore, "messages");
  const q = query(messagesRef, orderBy("createdAt"), limit(25));
  const [messages] = useCollectionData(q);
  const [formValue, setFormValue] = useState("");
  const dummy = useRef();

  const sendMessage = async (e) => {
    e.preventDefault();
    const { uid, photoURL } = auth.currentUser;
    await setDoc(doc(messagesRef), {
      text: formValue,
      createdAt: serverTimestamp(),
      uid,
      photoURL,
    });
    setFormValue("");
    dummy.current.scrollIntoView({ behavior: "smooth" });
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
              class="flex flex-shrink-0 items-center justify-center rounded-xl bg-indigo-500 px-4 py-1 font-semibold text-white hover:bg-indigo-600"
              type="submit"
            >
              <span>Send</span>
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

function ChatMessage(props) {
  const { text, uid, photoURL } = props.message;
  const messageClass = uid === auth.currentUser.uid ? "sent" : "received";
  if (messageClass === "received") {
    return (
      <div class="col-start-1 col-end-8 rounded-lg p-3">
        <div
          className={`message ${messageClass}`}
          class="flex flex-row items-center"
        >
          <img
            src={photoURL}
            class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500"
          />
          <p class="relative ml-3 rounded-xl bg-white px-4 py-2 text-sm shadow">
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
        <img
          src={photoURL}
          class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500"
        />
        <p class="relative mr-3 rounded-xl bg-indigo-100 px-4 py-2 text-sm shadow">
          {text}
        </p>
      </div>
    </div>
  );
}

export default App;
