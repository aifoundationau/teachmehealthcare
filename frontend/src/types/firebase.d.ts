declare module 'firebase/app' {
  export function initializeApp(config: any): any;
  export function getApps(): any[];
  export function getApp(): any;
  export interface FirebaseApp {
    name: string;
    options: Record<string, any>;
  }
}

declare module 'firebase/auth' {
  export function getAuth(app?: any): any;
  export const GoogleAuthProvider: any;
  export function signInWithPopup(auth: any, provider: any): Promise<any>;
  export function signInWithEmailAndPassword(auth: any, email: string, pass: string): Promise<any>;
  export function createUserWithEmailAndPassword(auth: any, email: string, pass: string): Promise<any>;
  export const EmailAuthProvider: any;
  export function linkWithCredential(user: any, cred: any): Promise<any>;
  export function updateProfile(user: any, profile: any): Promise<any>;
  export function signOut(auth: any): Promise<void>;
  export function onAuthStateChanged(auth: any, nextOrObserver: (user: any) => void): () => void;
  export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    phoneNumber: string | null;
    photoURL: string | null;
  }
}

declare module 'firebase/firestore' {
  export function getFirestore(app?: any): any;
  export function doc(db: any, path: string, ...pathSegments: string[]): any;
  export function setDoc(reference: any, data: any, options?: any): Promise<void>;
  export function getDoc(reference: any): Promise<any>;
  export function serverTimestamp(): any;
}
