const translations={
 en:{
  File:'File',Explore:'Explore',Create:'Create',View:'View',Window:'Window',Help:'Help',
  Stories:'Stories',Library:'Library',Art:'Art',Blogs:'Blogs',Notes:'Notes',Search:'Search',Profile:'Profile',Settings:'Settings',Trash:'Trash',
  'LOCAL TIME':'LOCAL TIME',WEATHER:'WEATHER','NOW PLAYING':'NOW PLAYING','RECENTLY OPENED':'RECENTLY OPENED',
  'All Stories':'All Stories',Bengali:'Bengali',English:'English',Featured:'Featured',New:'New','Most Read':'Most Read',Poetry:'Poetry',
  'All Art':'All Art',Pattachitra:'Pattachitra',Illustration:'Illustration',Photography:'Photography',Posters:'Posters',
  Saved:'Saved',Reading:'Reading',Collections:'Collections','Recently Opened':'Recently Opened',
  'Kolpotuli Settings':'Kolpotuli Settings','Choose the atmosphere for your desktop.':'Choose the atmosphere for your desktop.',Wallpaper:'Wallpaper','Ganga Ghat':'Ganga Ghat','Original Kolpotuli':'Original Kolpotuli',Dusk:'Dusk','Blue hour':'Blue hour',Paper:'Paper','Quiet morning':'Quiet morning',
  'Saving Grace':'Saving Grace','Add to playlist':'Add to playlist','Notes from the edges of the page.':'Notes from the edges of the page.','Culture, literature, people and places.':'Culture, literature, people and places.',FEATURED:'FEATURED','Stories live in the spaces between us.':'Stories live in the spaces between us.',
  'Search stories…':'Search stories…','Search art…':'Search art…','Untitled Note':'Untitled Note','Start writing…':'Start writing…','New note':'New note',Save:'Save',
  'No published content yet.':'No published content yet.','Sign in to keep your history.':'Sign in to keep your history.','Nothing opened yet.':'Nothing opened yet.'
 },
 bn:{
  File:'ফাইল',Explore:'অন্বেষণ',Create:'তৈরি',View:'দেখুন',Window:'উইন্ডো',Help:'সহায়তা',
  Stories:'গল্প',Library:'লাইব্রেরি',Art:'শিল্প',Blogs:'ব্লগ',Notes:'নোট',Search:'খোঁজ',Profile:'প্রোফাইল',Settings:'সেটিংস',Trash:'ট্র্যাশ',
  'LOCAL TIME':'স্থানীয় সময়',WEATHER:'আবহাওয়া','NOW PLAYING':'এখন বাজছে','RECENTLY OPENED':'সম্প্রতি খোলা',
  'All Stories':'সব গল্প',Bengali:'বাংলা',English:'ইংরেজি',Featured:'নির্বাচিত',New:'নতুন','Most Read':'সর্বাধিক পঠিত',Poetry:'কবিতা',
  'All Art':'সব শিল্প',Pattachitra:'পটচিত্র',Illustration:'ইলাস্ট্রেশন',Photography:'ফটোগ্রাফি',Posters:'পোস্টার',
  Saved:'সংরক্ষিত',Reading:'পড়ছি',Collections:'সংগ্রহ','Recently Opened':'সম্প্রতি খোলা',
  'Kolpotuli Settings':'কল্পতুলি সেটিংস','Choose the atmosphere for your desktop.':'আপনার ডেস্কটপের আবহ বেছে নিন।',Wallpaper:'ওয়ালপেপার','Ganga Ghat':'গঙ্গার ঘাট','Original Kolpotuli':'কল্পতুলির মূল নকশা',Dusk:'সন্ধ্যা','Blue hour':'নীল সন্ধ্যা',Paper:'কাগজ','Quiet morning':'নিরিবিলি সকাল',
  'Saving Grace':'Saving Grace','Add to playlist':'প্লেলিস্টে যোগ করুন','Notes from the edges of the page.':'পাতার প্রান্ত থেকে কিছু নোট।','Culture, literature, people and places.':'সংস্কৃতি, সাহিত্য, মানুষ ও স্থান।',FEATURED:'নির্বাচিত','Stories live in the spaces between us.':'আমাদের মাঝের ফাঁকে গল্পেরা বেঁচে থাকে।',
  'Search stories…':'গল্প খুঁজুন…','Search art…':'শিল্প খুঁজুন…','Untitled Note':'শিরোনামহীন নোট','Start writing…':'লেখা শুরু করুন…','New note':'নতুন নোট',Save:'সংরক্ষণ',
  'No published content yet.':'এখনও কোনো প্রকাশিত লেখা নেই।','Sign in to keep your history.':'ইতিহাস রাখতে সাইন ইন করুন।','Nothing opened yet.':'এখনও কিছু খোলা হয়নি।'
 }
};
export function t(key,lang=document.documentElement.lang||'en'){return translations[lang]?.[key]??translations.en[key]??key}
export function setLanguage(lang){document.documentElement.lang=lang;document.documentElement.dataset.lang=lang;localStorage.setItem('kolpotuli-language',lang);document.querySelectorAll('[data-i18n]').forEach(el=>{const key=el.dataset.i18n;el.textContent=t(key,lang)});document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{el.placeholder=t(el.dataset.i18nPlaceholder,lang)});window.dispatchEvent(new CustomEvent('kolpotuli-language-changed',{detail:{lang}}))}
export function initLanguage(){const saved=localStorage.getItem('kolpotuli-language')||'en';setLanguage(saved);return saved}
