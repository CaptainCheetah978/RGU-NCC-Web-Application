export interface LoadingQuote {
    text: string;
    author?: string;
    source: string;
}

export interface LoadingFact {
    text: string;
    source: string;
}

export const MOTIVATIONAL_QUOTES: LoadingQuote[] = [
    { text: "Some goals are so worthy, it's glorious even to fail.", author: "Capt. Manoj Kumar Pandey, PVC", source: "1/11 Gorkha Rifles" },
    { text: "Either I will come back after hoisting the Tricolor, or I will come back wrapped in it.", author: "Capt. Vikram Batra, PVC", source: "13 JAK RIF" },
    { text: "If death strikes before I prove my blood, I swear I'll kill death.", author: "Capt. Manoj Kumar Pandey, PVC", source: "1/11 Gorkha Rifles" },
    { text: "Quartered in snow, silent to remain. When the bugle calls, they shall rise and march again.", author: "Scroll of Honour", source: "Siachen Base Camp" },
    { text: "We live by chance, we love by choice, we kill by profession.", author: "Signboard", source: "Officers Training Academy, Chennai" },
    { text: "A soldier is above politics and should not believe in caste or creed.", author: "Field Marshal K.M. Cariappa", source: "First Indian Commander-in-Chief" },
    { text: "Only the best of friends and the worst of enemies visit us.", author: "Signboard", source: "Indian Army, Kashmir Border" },
    { text: "Yeh Dil Maange More!", author: "Capt. Vikram Batra, PVC", source: "13 JAK RIF" },
    { text: "May God have mercy on our enemies, because we won't.", author: "Signboard", source: "Indian Armed Forces" },
    { text: "If a man says he is not afraid of dying, he is either lying or is a Gurkha.", author: "Field Marshal Sam Manekshaw", source: "Indian Army" },
    { text: "There will be no withdrawal without written orders and these orders shall never be issued.", author: "Field Marshal Sam Manekshaw", source: "Indian Army" },
    { text: "What is a lifetime adventure for you is a daily routine for us.", author: "Highway Signboard", source: "Border Roads Organisation" },
    { text: "Our flag does not fly because the wind moves it, it flies with the last breath of each soldier who died protecting it.", author: "Unknown", source: "Indian Armed Forces Ethos" },
    { text: "You have never lived until you have almost died, and for those who chose to fight, life has a special flavor, the protected will never know.", author: "Capt. R Subramanium, Kirti Chakra", source: "Indian Army" },
    { text: "Sleep peacefully at your homes. Indian Army is guarding the frontiers.", author: "Signboard", source: "Indian Army" },
    { text: "The enemies are only 50 yards from us. We are heavily outnumbered... I shall not withdraw an inch...", author: "Maj. Somnath Sharma, PVC", source: "4th Kumaon" },
    { text: "We fight to win and win with a knock out, because there are no runners up in war.", author: "General J.J. Singh", source: "Indian Army" },
    { text: "Forgiveness is the attribute of the strong.", author: "Often associated with valor", source: "Indian Armed Forces Ethos" },
    { text: "Do not lament the death of a warrior killed in the battle field. As those who sacrifice their lives in the war are honoured in heaven.", author: "Inscription", source: "Indian War Memorials" },
    { text: "It is fatal to enter any war without the will to win it.", author: "General D.R. Thapar", source: "Indian Army Medical Corps" }
];

export const INTRIGUING_FACTS: LoadingFact[] = [
    { text: "The historical concept of organized cadet training is widely attributed to Germany all the way back in 1666.", source: "Military History" },
    { text: "The National Cadet Corps in India was established under the NCC Act and officially formed on July 15, 1948.", source: "NCC Directorate" },
    { text: "Before the modern NCC, military cadet organizations in India included the University Corps (1917) and the University Training Corps (UTC).", source: "NCC History" },
    { text: "During WWII, cadet training in India was restructured into the University Officers Training Corps (UOTC) in 1942.", source: "NCC History" },
    { text: "The creation of the modern NCC was based heavily on the recommendations of a committee led by Pandit H.N. Kunzru.", source: "NCC History" },
    { text: "Prime Minister Narendra Modi was an active NCC cadet during his school days in Vadnagar.", source: "Public Records" },
    { text: "Legendary cricketer M.S. Dhoni is an honorary Lieutenant Colonel in the Territorial Army and was also an NCC cadet.", source: "Public Records" },
    { text: "Subhas Chandra Bose was a member of the University Officers Training Corps (UOTC), the historical precursor to the modern NCC.", source: "Historical Archives" },
    { text: "Interestingly, the Singapore National Cadet Corps (NCC) was actually formed to establish leadership much earlier than India's, founded in 1901.", source: "NCC History" },
    { text: "The highest and most prestigious camp for an Indian NCC cadet is the Republic Day Camp (RDC) held annually in Delhi.", source: "NCC Directorate" },
    { text: "The Youth Exchange Programme (YEP) allows elite NCC cadets to visit friendly foreign countries to act as cultural ambassadors.", source: "NCC Directorate" },
    { text: "The NCC flag's three colors represent the tri-services: Red for the Army, Deep Blue for the Navy, and Light Blue for the Air Force.", source: "NCC Directorate" },
    { text: "The NCC motto, \"Unity and Discipline\" (Ekta aur Anushasan), was officially deliberated and adopted on December 23, 1957.", source: "NCC History" },
    { text: "The NCC Girls Division was successfully raised in July 1949 to provide equal, empowered opportunities for female students.", source: "NCC Directorate" },
    { text: "During the 1965 and 1971 wars, NCC cadets formed a crucial \"second line of defense,\" actively helping ordnance factories and civil defense.", source: "Military Archives" },
    { text: "Over 1.5 million cadets are currently enrolled in the Indian NCC, making it undeniably the world's largest uniformed youth organization.", source: "NCC Directorate" },
    { text: "The prestigious Prime Minister's Rally is held on January 28 every year to mark the grand culmination of the Republic Day Camp.", source: "NCC Directorate" },
    { text: "NCC cadets under the Naval wing learn ship modeling, sailing, and rigorous boat pulling as part of their specialized training.", source: "NCC Directorate" },
    { text: "Air wing NCC cadets undergo specialized aeronautical training including micro-light flying and aero-modeling.", source: "NCC Directorate" },
    { text: "Marshal of the Indian Air Force Arjan Singh was a cadet of the University Training Corps before undertaking his legendary military career.", source: "IAF Records" },
    { text: "The NCC's official anthem \"Hum Sab Bharatiya Hain\" was beautifully written by renowned poet Sudarshan Faakir.", source: "NCC Directorate" },
    { text: "During the COVID-19 pandemic, thousands of NCC cadets volunteered under 'Exercise NCC Yogdan' to bravely assist civilian authorities.", source: "Ministry of Defence" },
    { text: "Operation Rhino and Operation Bajrang in Assam saw NCC cadets physically assisting the armed forces with critical logistics and communication.", source: "Military Records" },
    { text: "NCC 'C' Certificate holders are granted highly coveted direct entry opportunities into the Armed Forces without taking the written CDS exam.", source: "Ministry of Defence" },
    { text: "Former External Affairs Minister Sushma Swaraj was an active NCC cadet and was famously declared the best cadet of her college.", source: "Public Records" },
    { text: "The Indian Army's 61st Cavalry Regiment is one of the very last remaining unmechanized, operational horse-mounted cavalry units in the world.", source: "Indian Army Records" },
    { text: "India's Border Security Force (BSF) maintains a unique camel contingent, the \"Ganga Risala,\" which patrols the unforgiving sand dunes of the Thar Desert.", source: "BSF Operations" },
    { text: "The Indian Army's High Altitude Warfare School (HAWS) in Gulmarg is so elite that special forces teams from the US, UK, and Russia regularly travel there to train.", source: "Defence Reports" },
    { text: "India jointly developed and possesses the BrahMos—the fastest supersonic anti-ship cruise missile in operation in the world today.", source: "DRDO" },
    { text: "The Indian Army controls the Siachen Glacier, which sits at an altitude of 21,000 feet, making it the highest battlefield on Earth.", source: "Ministry of Defence" },
    { text: "In the legendary 1971 Battle of Longewala, just 120 Indian soldiers defended their post against over 2,000 enemy troops and 40 tanks—suffering only two casualties.", source: "Military History" },
    { text: "The Bailey Bridge built in Ladakh by the Indian Army in 1982 is the highest altitude bridge in the world.", source: "Guinness World Records" },
    { text: "During the 2013 Uttarakhand floods, the Indian Armed Forces conducted \"Operation Rahat,\" the largest civilian rescue operation in the world.", source: "IAF Records" },
    { text: "The Indian Air Force has a base in Farkhor, Tajikistan, making it India's first military base outside its territory.", source: "Ministry of External Affairs" },
    { text: "The Indian Navy's elite special forces unit, MARCOS, is considered one of the most feared and heavily trained commando forces globally.", source: "Indian Navy" },
    { text: "India has consistently contributed the highest number of peacekeepers to United Nations peacekeeping missions since its inception.", source: "UN Peacekeeping" },
    { text: "The Indian Army's Para Commandos wear the balidaan (sacrifice) badge, which must be earned by surviving some of the toughest training in the world.", source: "Indian Army" },
    { text: "The highest airfield in the world is located at Daulat Beg Oldi in the Ladakh region, managed completely by the IAF.", source: "IAF Records" },
    { text: "In 1988, the Indian Armed Forces successfully thwarted a coup in the Maldives within hours of the request.", source: "Military History" },
    { text: "Sepoy Kamal Ram of the Indian Army won the Victoria Cross in WWII at age 19, making him the youngest Indian recipient.", source: "Military Archives" },
    { text: "The Military Nursing Service in India dates back to 1888, serving bravely through both World Wars.", source: "Indian Army Medical Corps" },
    { text: "The Indian Air Force's Garud Commando Force is trained for a grueling 72 weeks, the longest training period among Indian Special Forces.", source: "IAF Records" },
    { text: "INS Viraat holds the Guinness World Record for the oldest functioning aircraft carrier in the world before her decommissioning.", source: "Guinness World Records" },
    { text: "The Indian Army does not recruit based on caste, religion, or community, remaining one of India's most secular institutions.", source: "Indian Constitution" },
    { text: "The Rashtriya Rifles is a unique counter-insurgency force in India, formed entirely from deputed regular army personnel.", source: "Indian Army" },
    { text: "The Indian Army operates an exclusive weather forecasting station purely for its troops deployed at the Siachen Glacier.", source: "DRDO/SASE" },
    { text: "The Assam Rifles, dating back to 1835, holds the distinction of being the oldest paramilitary force in India.", source: "Assam Rifles Directorate" },
    { text: "The combat uniform of the Indian military is designed with digital camouflage specifically formulated for varying Indian terrains.", source: "Ministry of Defence" },
    { text: "The Ezhimala Naval Academy in Kerala is recognized as the largest naval academy in the whole of Asia.", source: "Indian Navy" },
    { text: "INS Arihant is India's first completely indigenously designed and built nuclear-powered ballistic missile submarine.", source: "Indian Navy" }
];

export const getRandomLoadingContent = () => {
    // 40% chance of a quote, 60% chance of a fact (since there are more facts)
    const isQuote = Math.random() < 0.4; 
    
    if (isQuote) {
        const item = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
        return { type: 'quote' as const, ...item };
    } else {
        const item = INTRIGUING_FACTS[Math.floor(Math.random() * INTRIGUING_FACTS.length)];
        return { type: 'fact' as const, ...item };
    }
};
