import app from "./firebase-config.js";

import {

getFirestore,
doc,
setDoc

}

from

"https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";


const db=
getFirestore(app);


window.saveReading=

async(

storyTitle

)=>{


const userEmail=

localStorage.getItem(
"userEmail"
);


if(!userEmail){

return;

}


try{


await setDoc(

doc(

db,

"reading",

userEmail+"_"+storyTitle

),

{

user:userEmail,

title:storyTitle

}

);


}

catch(error){

console.log(error);

}

}