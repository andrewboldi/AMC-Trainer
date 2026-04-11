import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, type User } from 'firebase/auth';

const firebaseConfig = {
	apiKey: 'AIzaSyBL-xxrruYGybnRswmF5GydhwaLmGYuwj0',
	authDomain: 'amc-trainer-firebase.firebaseapp.com',
	projectId: 'amc-trainer-firebase',
	storageBucket: 'amc-trainer-firebase.firebasestorage.app',
	messagingSenderId: '809896898209',
	appId: '1:809896898209:web:7218a074139678f4528ae0'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export async function signInWithGoogle(): Promise<User> {
	const result = await signInWithPopup(auth, provider);
	return result.user;
}

export async function signOutUser(): Promise<void> {
	await signOut(auth);
}

export async function getIdToken(): Promise<string | null> {
	const user = auth.currentUser;
	if (!user) return null;
	return user.getIdToken();
}

export function onAuthChange(callback: (user: User | null) => void): () => void {
	return onAuthStateChanged(auth, callback);
}
