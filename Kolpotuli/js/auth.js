import app from "./firebase-config.js";

import {

getAuth,
GoogleAuthProvider,
signInWithPopup,
onAuthStateChanged

}

from

"https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";


const auth=
getAuth(app);

const provider=
new GoogleAuthProvider();


const googleButton=

document.getElementById(
"googleBtn"
);


if(googleButton){

googleButton.addEventListener(

"click",

()=>{

signInWithPopup(
auth,
provider
)

.then((result)=>{

const user=
result.user;


localStorage.setItem(

"userName",

user.displayName

);

localStorage.setItem(

"userEmail",

user.email

);


window.location.href=
"profile.html";

})

.catch((error)=>{

console.log(error);

});

});

}


/* Keep user logged in */

onAuthStateChanged(

auth,

(user)=>{

if(user){

localStorage.setItem(

"userName",

user.displayName

);

localStorage.setItem(

"userEmail",

user.email

);

}

}

);