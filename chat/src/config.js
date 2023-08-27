import { getAuth } from "firebase/auth";
import { FIREBASE_CONFIG } from "./firebase-config";
import * as firebase from "firebase/app";

export const SOCKET_SERVER_URL = "http://localhost:5000";
export const GET_MESSAGES = (user) =>
  `${SOCKET_SERVER_URL}/get_messages/${user}`;
export const APP = firebase.initializeApp(FIREBASE_CONFIG);
export const AUTH = getAuth(APP);
