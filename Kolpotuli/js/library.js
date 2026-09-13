import app from "./firebase-config.js";

import {

getFirestore,
collection,
query,
where,
getDocs,
doc,
deleteDoc

}

from

"https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";


const db=
getFirestore(app);



/* REMOVE FROM LIBRARY */

window.removeFavorite=

async(

button,
type,
title

)=>{

const userEmail=

localStorage.getItem(
"userEmail"
);

const documentID=

userEmail+"_"+title;


try{

await deleteDoc(

doc(

db,
"favorites",
documentID

)

);


/* remove instantly */

const cardContainer =

button
.closest(
".story-card"
)
.parentElement;


button
.closest(
".story-card"
)
.remove();



/* if nothing remains, show text immediately */

if(
cardContainer.children.length===0
){

if(type==="story"){

cardContainer.innerHTML=
"<p>No saved stories yet</p>";

}

if(type==="art"){

cardContainer.innerHTML=
"<p>No saved artwork yet</p>";

}

if(type==="blog"){

cardContainer.innerHTML=
"<p>No saved blogs yet</p>";

}

}

}

catch(error){

console.log(error);

}

};





async function loadData(){

const userEmail=

localStorage.getItem(
"userEmail"
);


if(!userEmail){

return;

}


let storyHTML="";
let artHTML="";
let blogHTML="";
let readingHTML="";



/* FAVORITES */

const favQuery=

query(

collection(
db,
"favorites"
),

where(
"user",
"==",
userEmail
)

);


const favSnapshot=

await getDocs(
favQuery
);


favSnapshot.forEach((doc)=>{

const data=
doc.data();


const card=`

<div class="story-card">

<button

class="favorite-btn active"

onclick=

"removeFavorite(
this,
'${data.type}',
'${data.title}'
)"

>

❤

</button>

<h2>

${data.title}

</h2>

<p>

${data.type}

</p>

</div>

`;


if(data.type==="story")
storyHTML+=card;

if(data.type==="art")
artHTML+=card;

if(data.type==="blog")
blogHTML+=card;

});




/* CONTINUE READING */

const readingQuery=

query(

collection(
db,
"reading"
),

where(
"user",
"==",
userEmail
)

);


const readingSnapshot=

await getDocs(
readingQuery
);


readingSnapshot.forEach((doc)=>{

const data=
doc.data();


readingHTML+=`

<div class="story-card">

<h2>

${data.title}

</h2>

</div>

`;

});




document
.getElementById(
"favoriteStories"
)

.innerHTML=

storyHTML ||

"<p>No saved stories yet</p>";




document
.getElementById(
"favoriteArt"
)

.innerHTML=

artHTML ||

"<p>No saved artwork yet</p>";




document
.getElementById(
"savedBlogs"
)

.innerHTML=

blogHTML ||

"<p>No saved blogs yet</p>";




document
.getElementById(
"continueReading"
)

.innerHTML=

readingHTML ||

"<p>Nothing opened yet</p>";

}


loadData();