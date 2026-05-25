const FIREBASE_CONFIG = {
    apiKey: "AIzaSyBz-iVkMIXgH_nQo1hwcG5J5k8OHL6WHjo",
    authDomain: "verdum-f42ee.firebaseapp.com",
    databaseURL: "https://verdum-f42ee-default-rtdb.firebaseio.com",
    projectId: "verdum-f42ee",
    storageBucket: "verdum-f42ee.firebasestorage.app",
    messagingSenderId: "588053654255",
    appId: "1:588053654255:web:47a82d0f1b32b84339491a"
};

firebase.initializeApp(FIREBASE_CONFIG);
const FB_DB = firebase.database();

window.FB = {
    async get(path, fallback) {
        try {
            const snap = await FB_DB.ref(path).once('value');
            const val = snap.val();
            return val !== null && val !== undefined ? val : fallback;
        } catch {
            // Fallback a localStorage si Firebase no está disponible
            const s = localStorage.getItem('fb_' + path);
            return s ? JSON.parse(s) : fallback;
        }
    },
    async set(path, val) {
        try {
            await FB_DB.ref(path).set(val);
            localStorage.setItem('fb_' + path, JSON.stringify(val));
        } catch {
            localStorage.setItem('fb_' + path, JSON.stringify(val));
        }
    }
};
