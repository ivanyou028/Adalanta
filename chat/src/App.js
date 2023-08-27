import "./App.css";
import React, { useState, createContext, useContext } from "react";
import {
  useAuthState,
  useSignOut,
  useSignInWithGoogle,
} from "react-firebase-hooks/auth";
import ChatRoom from "./ChatRoom";
import { AUTH, SOCKET_SERVER_URL } from "./config";
import { SocketProvider } from "./socket";

function App() {
  const [user] = useAuthState(AUTH);
  return (
    <div className="App">
      <SocketProvider>
        <div class="flex h-screen text-gray-800 antialiased">
          <div class="flex h-full w-full flex-row overflow-x-hidden">
            <div class="flex flex-auto flex-col p-6">
              {/* header */}
              <div class="flex h-10 w-full flex-row-reverse items-center justify-start bg-white pb-6">
                <SignOut />
              </div>

              {/* main content */}
              <div class="flex flex-1 flex-col overflow-hidden">
                {user ? <ChatRoom /> : <SignIn />}
              </div>
            </div>
          </div>
        </div>
      </SocketProvider>
    </div>
  );
}

function SignIn() {
  const [signInWithGoogle, user, loading, error] = useSignInWithGoogle(AUTH);
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
  const [signOut, loading, error] = useSignOut(AUTH);
  return (
    AUTH.currentUser && (
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
