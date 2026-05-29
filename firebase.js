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
const FB_STORAGE = firebase.storage();

window.FB = {
    async get(path, fallback) {
        try {
            const snap = await FB_DB.ref(path).once('value');
            const val = snap.val();
            return val !== null && val !== undefined ? val : fallback;
        } catch {
            const s = localStorage.getItem('fb_' + path);
            return s ? JSON.parse(s) : fallback;
        }
    },
    async set(path, val) {
        try {
            await FB_DB.ref(path).set(val);
        } catch {}
        try {
            const json = JSON.stringify(val);
            if (json.length < 1_000_000) localStorage.setItem('fb_' + path, json);
        } catch {}
    },
    async uploadFile(storagePath, file) {
        const ref = FB_STORAGE.ref(storagePath);
        const snapshot = await ref.put(file);
        return await snapshot.ref.getDownloadURL();
    },
    async uploadBase64(storagePath, base64Data) {
        const ref = FB_STORAGE.ref(storagePath);
        const res = await fetch(base64Data);
        const blob = await res.blob();
        const snapshot = await ref.put(blob);
        return await snapshot.ref.getDownloadURL();
    }
};
