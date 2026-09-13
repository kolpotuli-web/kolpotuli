import app from "./firebase-config.js";

import {

getFirestore,
doc,
setDoc,
deleteDoc

}

from

"https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";


const db =
getFirestore(app);


window.toggleFavorite = async(

button,
type,
title

)=>{

const userEmail=

localStorage.getItem(
"userEmail"
);


if(!userEmail){

window.location.href=
"login.html";

return;

}


const documentID=

userEmail+"_"+title;


try{


if(

button.classList.contains(
"active"
)

){

button.classList.remove(
"active"
);

button.innerHTML="♡";


await deleteDoc(

doc(

db,
"favorites",
documentID

)

);

}


else{


button.classList.add(
"active"
);

button.innerHTML="❤";


await setDoc(

doc(

db,

"favorites",

documentID

),

{

user:userEmail,

type:type,

title:title

}

);

}


}

catch(error){

console.log(error);

}

}