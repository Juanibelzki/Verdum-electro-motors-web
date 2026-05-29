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
    TIMEOUT: 5000,

    async get(path, fallback) {
        try {
            const result = await Promise.race([
                FB_DB.ref(path).once('value'),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Firebase timeout')), this.TIMEOUT)
                )
            ]);
            const val = result.val();
            if (val !== null && val !== undefined) {
                try { localStorage.setItem('fb_cache_' + path, JSON.stringify(val)); } catch {}
                return val;
            }
            return this._fromCache(path, fallback);
        } catch {
            return this._fromCache(path, fallback);
        }
    },

    async set(path, val) {
        try { localStorage.setItem('fb_cache_' + path, JSON.stringify(val)); } catch {}
        try {
            await Promise.race([
                FB_DB.ref(path).set(val),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Firebase timeout')), this.TIMEOUT)
                )
            ]);
        } catch {}
    },

    _fromCache(path, fallback) {
        try {
            const cached = localStorage.getItem('fb_cache_' + path);
            if (cached) return JSON.parse(cached);
        } catch {}
        return fallback;
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
