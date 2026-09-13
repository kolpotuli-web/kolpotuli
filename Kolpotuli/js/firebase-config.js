
import { initializeApp }
from
"https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";

import { getAnalytics }
from
"https://www.gstatic.com/firebasejs/11.0.1/firebase-analytics.js";


const firebaseConfig = {

apiKey: "AIzaSyBrHTQJLv5NcHKxMHJv9dwkCzQt9nXiqT4",
  authDomain: "kolpotuli.firebaseapp.com",
  projectId: "kolpotuli",
  storageBucket: "kolpotuli.firebasestorage.app",
  messagingSenderId: "1066024421637",
  appId: "1:1066024421637:web:f4784947fcf6531ac1cf6c",
  measurementId: "G-VNXEHSEE2V"

};


const app =
initializeApp(firebaseConfig);

const analytics =
getAnalytics(app);

export default app;