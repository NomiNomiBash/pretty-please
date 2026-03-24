/**
 * London / hip-crowd texture: split into sections so we can sample a subset each turn
 * and assign lean lines per archetype (tokens + variety).
 */

/** @type {Record<string, string>} */
export const MILIEU_SECTIONS = {
  gigs: `Gigs & nights out — show at Fold / OM / Colour Factory they've had tickets to for three months; DJ set at a pub in Dalston that starts at midnight; album launch at Reference Point; rave in a warehouse in Bermondsey with a 2am door; jazz at Ronnie Scott's (someone else booked, they're just going); closing night of something at the ICA.`,
  culture: `Culture — private view in Bethnal Green; the Tate late they keep meaning to go to; sold-out run at the Young Vic; film at the BFI they can't reschedule; ceramics class they paid upfront for; life drawing in someone's studio in Peckham.`,
  food: `Food & drink — supper club in someone's flat in Hackney; reservation at a place that took six weeks to get; natural wine tasting in Clapton; pop-up they saw on Instagram with a 48hr window.`,
  sport: `Sport & body — five-a-side they've been trying to get into for a year; cold water swimming at the lido; cycling sportive they signed up for in January; reformer pilates block they can't miss two of; climbing session at a wall in Bermondsey.`,
  work: `Work-adjacent — panel at a creative agency they're speaking on; freelance pitch they can't move; a shoot (always a shoot); brand activation they got roped into; podcast recording that keeps getting rescheduled.`,
  social: `Social obligations — friends visiting from Berlin / Amsterdam / New York; birthday dinner for someone they feel guilty about; colleague leaving do they can't skip; their mum is in town; wedding in the countryside that needs the whole weekend; hen do someone guilt-tripped them into.`,
  admin: `Life admin that somehow takes all day — waiting in for a delivery with a four-hour window; their boiler; moving flats (always moving flats); viewing for a flat they probably won't get; taking something to the post office.`,
  fashion: `Fashion & image — sample sale that opens at 8am and will be gone by 10; a shoot (they're the stylist, not the subject); vintage fair at Truman Brewery; sourcing day in Portobello / Brick Lane; brand presentation they got invited to last minute; fitting that ran over; showroom appointment in Fitzrovia; helping a friend put together a look for something; zine launch in a shop in Soho they follow on Instagram.`,
  fashionSoft: `The fashion-adjacent soft-launch — "I'm going to this thing but I'm not sure what it is yet"; a collab they can't talk about; a casting they're not supposed to mention.`,
  altMusic: `Alternative music & the serious gig crowd — Café OTO on a school night (doors 7:30, not home before 1); free jazz residency four consecutive Thursdays; cassette label night in someone's basement in New Cross; drone show at the Barbican they queued for tickets to; musician friend playing a 40-minute set to 30 people and it matters enormously; record fair they've been planning around for weeks; listening session for an album that isn't out yet.`,
  wellness: `Wellness & the body as project — gong bath in a church in Stoke Newington; breathwork session they won't shut up about; cacao ceremony (yes, really); full moon circle in someone's garden; sound healing workshop three hours, cannot leave early; somatic therapy session they finally got an appointment for; ayahuasca retreat (whole weekend gone, possibly longer spiritually); astrology reading booked three months ago; cold plunge community morning at London Fields lido.`,
  creativeAdmin: `The creative-class admin — studio visit from someone important; deadline for a commission that appeared two days ago; artist talk they said yes to in a weak moment; residency application due at midnight; printing and framing something for a show that opens Thursday.`,
  altCrowd: `The actually alternative crowd — squat party whose location doesn't get shared until 10pm; benefit gig for something genuinely political; spoken word night in a pub backroom in Lewisham; noise show at an arthouse cinema; community meeting they actually care about; helping install a friend's show in a pop-up space; clothes swap in a community garden.`,
  virtue: `The ones who make you feel slightly bad about yourself — volunteering at a food bank Saturday morning; community garden session they do every week without fail; teaching a free workshop for young people; mutual aid thing they're coordinating.`,
};

/** Short cues for per-character lines (full section may not appear this turn). */
export const MILIEU_LANE_HINTS = {
  gigs: "clubs/raves/Dalston midnight/ICA closing/Fold tickets",
  culture: "private views/Tate late/BFI/Young Vic/studio life drawing",
  food: "supper club/six-week resy/Insta pop-up/natural wine",
  sport: "five-a-side/lido/sportive/reformer/climbing Bermondsey",
  work: "agency panel/pitch/shoot/brand pod/rescheduled record",
  social: "mates from abroad/birthday guilt/leaving do/mum/wedding/hen",
  admin: "delivery window/boiler/moving/viewing/post office",
  fashion: "sample sale 8am/stylist shoot/Truman/Portobello/showroom/zine",
  fashionSoft: "thing but idk what/collab NDA/casting hush",
  altMusic: "Café OTO/residency New Cross/Barbican drone/tiny mate's set/listening session",
  wellness: "gong bath/breathwork/cacao/full moon/sound healing/somatic/ayahuasca/astro/lido plunge",
  creativeAdmin: "studio visit/commission deadline/residency app midnight/framing for Thursday",
  altCrowd: "squat pin 10pm/benefit gig/Lewisham spoken word/noise cinema/install/community swap",
  virtue: "food bank/community garden/free workshop/mutual aid",
};

/** Two lanes per archetype — primary excuse texture for that voice. */
export const ARCHETYPE_MILIEU_LANES = {
  priya: ["culture", "social"],
  tom: ["work", "admin"],
  saskia: ["work", "admin"],
  marcus: ["food", "social"],
  jade: ["fashionSoft", "culture"],
  ollie: ["gigs", "altMusic"],
  bex: ["wellness", "virtue"],
  hamish: ["altCrowd", "gigs"],
  zara: ["sport", "gigs"],
  theo: ["social", "admin"],
  nadia: ["wellness", "altMusic"],
  remi: ["creativeAdmin", "work"],
  callum: ["fashion", "creativeAdmin"],
  ayo: ["gigs", "food"],
};

const MILIEU_TAIL = `The soft excuses that might be real — "I'm just really in a reading period at the moment"; "I've been trying to spend more time outside the algorithm"; "I'm doing this thing where I don't make plans more than 48 hours out"; "my body is telling me to slow down"; "I said I'd be somewhere but I don't know if I'm actually going"; "it's a long story but I can't do that weekend".

The vague ones (RICHEST FOR THIS GAME — use often) — busy with nothing they can name is more London than any specific commitment: "a thing in Peckham"; "this whole weekend is mad"; "I've got people coming"; "I said I'd help someone move"; "it's complicated, I'll explain later"; "I'm trying to have one weekend to myself this month"; "I've been so overstretched lately".

Cast texture: the gong bath and the squat party whose location drops at 10pm are two ends of the same person — many in this group are both. Mix wellness-coded, fashion-coded, earnestly political, and virtue-adjacent pulls without flattening anyone to one lane.

Balance: mix concrete named pulls, soft-launch mystery, wellness absurdity, and suspicious vagueness. DEFLECT / REGRESS / CREATE-OBSTACLE love the vague category — evasive, relatable, slightly guilty.`;

const MILIEU_INTRO = `━━ LONDON / HIP CROWD (default milieu — voice texture) ━━
Assume London unless SETTING above says otherwise. Young(ish), image-aware, Instagram/TikTok-literate — group chats, FOMO, half-planned weekends.

Each turn only a SAMPLE of pull categories appears below (rotates). Everyone may still invent similar vibes. Per-character "Milieu lean" lines name their usual lanes even when a category isn't printed this turn — use those hints for obstacles. ONE short clause per in-character message — never dump the inventory.`;

/** How many category paragraphs to inject per turn (rest come from leans + invention). */
const SAMPLED_SECTION_COUNT = 4;

function hashSeed(occasionId, turnStep) {
  const s = `${occasionId ?? "occ"}:${turnStep ?? 0}`;
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededPickKeys(allKeys, count, seed) {
  const rng = mulberry32(seed);
  const keys = [...allKeys];
  for (let i = keys.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [keys[i], keys[j]] = [keys[j], keys[i]];
  }
  return keys.slice(0, Math.min(count, keys.length));
}

/**
 * @param {{ occasionId?: string, turnStep?: number }} p
 */
export function buildLondonHipMilieuBlock({ occasionId, turnStep } = {}) {
  const seed = hashSeed(occasionId, turnStep);
  const keys = Object.keys(MILIEU_SECTIONS);
  const picked = seededPickKeys(keys, SAMPLED_SECTION_COUNT, seed);
  const body = picked.map((k) => MILIEU_SECTIONS[k]).join("\n\n");
  return `${MILIEU_INTRO}

This turn's sampled pulls (${picked.join(", ")}):
${body}

${MILIEU_TAIL}`;
}

/**
 * One line for the character block in the system prompt.
 * @param {string} archetypeId
 */
export function milieuLeanLineForArchetype(archetypeId) {
  const lanes = ARCHETYPE_MILIEU_LANES[archetypeId];
  if (!lanes?.length) {
    return "Milieu lean: general London hip chaos — vague excuses especially welcome.";
  }
  const hints = lanes.map((k) => MILIEU_LANE_HINTS[k]).filter(Boolean);
  return `Milieu lean (${lanes.join(" + ")}): ${hints.join(" · ")} — vague / soft-excuse lines always allowed.`;
}
