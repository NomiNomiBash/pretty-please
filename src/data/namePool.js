// ─── Name pool ───────────────────────────────────────────────────────────────
// ~100 London-diverse names: multicultural, no two feel the same
const NAMES = [
  "Priya","Deepa","Ananya","Kavya","Ishaan","Rohan","Arjun","Meera","Sonia","Ravi",
  "Nisha","Kiran","Aisha","Zara","Imran","Farah","Yasmin","Tariq","Leila","Omar",
  "Ayo","Temi","Chidi","Amara","Kofi","Adaeze","Emeka","Sade","Tobi","Ngozi",
  "Remi","Kwame","Abena","Yemi","Dami","Funmi","Seun","Bola","Tunde","Ife",
  "Bex","Saskia","Harriet","Flora","Imogen","Cordelia","Pippa","Tabitha","Fenella","Suki",
  "Tom","Ollie","Hamish","Marcus","Theo","Callum","Rory","Alistair","Jasper","Finn",
  "Elodie","Margot","Cleo","Rosie","Jess","Mia","Nina","Lara","Cass","Stella",
  "Mei","Lin","Yuki","Hana","Sora","Ren","Jin","Zoe","Amy","Lily",
  "Jade","Nadia","Alex","Sam","Rae","Quinn","River","Ash","Sage","Indigo",
  "Blake","Avery","Remy","Sasha","Charlie","Frankie","Cam","Kit","Nic","Beau",
  "Dimitri","Elena","Vikram","Lottie","Gus","Zayn","Naima","Bruno","Lydia","Kai",
  "Felix","Arlo","Hugo","Layla","Dex","Maya","Oscar","Ivy","Ezra","Noah",
];

// ─── Avatar pool ─────────────────────────────────────────────────────────────
// More variety than the original 14 — different skin tones, hair, vibe
const AVATARS = [
  "👩🏾","👩🏻","👩🏽","👩🏿","👩🏼",
  "👨🏾","👨🏻","👨🏽","👨🏿","👨🏼",
  "🧑🏾","🧑🏻","🧑🏽","🧑🏿","🧑🏼",
  "👱🏾‍♀️","👱🏻‍♀️","👱🏽‍♀️","👱🏿‍♀️","👱🏼‍♀️",
  "👱🏾‍♂️","👱🏻‍♂️","👱🏽‍♂️","👱🏿‍♂️","👱🏼‍♂️",
  "🧔🏾","🧔🏻","🧔🏽","🧔🏿","🧔🏼",
  "👩🏾‍🦱","👩🏻‍🦱","👩🏽‍🦱","👩🏿‍🦱","👩🏼‍🦱",
  "👩🏾‍🦰","👩🏻‍🦰","👩🏽‍🦰","👩🏿‍🦰","👩🏼‍🦰",
  "👩🏾‍🦳","👩🏻‍🦳","👩🏽‍🦳","👩🏿‍🦳","👩🏼‍🦳",
  "👨🏾‍🦱","👨🏻‍🦱","👨🏽‍🦱","👨🏿‍🦱","👨🏼‍🦱",
  "👨🏾‍🦰","👨🏻‍🦰","👨🏽‍🦰","👨🏿‍🦰","👨🏼‍🦰",
  "👨🏾‍🦳","👨🏻‍🦳","👨🏽‍🦳","👨🏿‍🦳","👨🏼‍🦳",
];

// ─── Fisher-Yates shuffle ─────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function hashString(input) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return function next() {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle(arr, seedKey) {
  const a = [...arr];
  const rand = mulberry32(hashString(seedKey));
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Group size from occasion (target-adjacent, capped at 14) ─────────────────
export function getGroupSizeForOccasion(occ) {
  return Math.min(14, Math.max(occ.max + 1, occ.target + 2));
}

// ─── Pick a subset of characters for this occasion ────────────────────────────
export function pickGroupForOccasion(characters, occ) {
  const n = getGroupSizeForOccasion(occ);
  const pool = shuffle(characters);
  return pool.slice(0, n);
}

// ─── Assign unique random name + avatar to each character archetype ───────────
// Call once at game start. Pass in character array, get back the same
// array with randomised name + avatar fields.
export function assignIdentities(characters) {
  const names   = shuffle(NAMES);
  const avatars = shuffle(AVATARS);
  return characters.map((c, i) => ({
    ...c,
    name:   names[i],
    avatar: avatars[i],
  }));
}

export function assignIdentitiesSeeded(characters, seedKey) {
  const names = seededShuffle(NAMES, `${seedKey}:names`);
  const avatars = seededShuffle(AVATARS, `${seedKey}:avatars`);
  return characters.map((c, i) => ({
    ...c,
    name: names[i],
    avatar: avatars[i],
  }));
}

export function pickGroupForOccasionSeeded(characters, occ, seedKey) {
  const n = getGroupSizeForOccasion(occ);
  return seededShuffle(characters, `${seedKey}:group:${occ.id}`).slice(0, n);
}
