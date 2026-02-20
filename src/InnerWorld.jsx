import { useState, useEffect, useCallback, useRef } from "react";

// ══════════════════════════════════════════════════════════════
// TPGE ENGINE — Complete Scoring Matrices
// ══════════════════════════════════════════════════════════════
const SCHEMAS = {
  AB: { code: "AB", name: "Abandonment", color: "#E85D75", icon: "💔" },
  ED: { code: "ED", name: "Emotional Deprivation", color: "#7B8CDE", icon: "🫥" },
  DF: { code: "DF", name: "Defectiveness", color: "#9B5DE5", icon: "🪞" },
  FA: { code: "FA", name: "Failure", color: "#F15BB5", icon: "📉" },
  SI: { code: "SI", name: "Social Isolation", color: "#4ECDC4", icon: "🏝" },
  MS: { code: "MS", name: "Mistrust", color: "#FF6B6B", icon: "🛡" },
  SJ: { code: "SJ", name: "Subjugation", color: "#FFA62B", icon: "🔗" },
  US: { code: "US", name: "Unrelenting Standards", color: "#00BBF9", icon: "⚡" },
};

const EMO_S = {
  "Shame": { DF: 4 }, "Loneliness": { AB: 3, SI: 3 }, "Emptiness": { ED: 4 },
  "Sadness": { ED: 2, FA: 1 }, "Fear / Anxiety": { AB: 3, MS: 2 },
  "Hopelessness": { FA: 3, ED: 2 }, "Guilt": { SJ: 3, DF: 2 },
  "Anger": { MS: 3, SJ: 2 }, "Numbness": { ED: 3, SI: 1 },
};

const TRIG_S = {
  "Interaction with someone": { AB: 3, SJ: 2, MS: 1 },
  "Conflict or disagreement": { AB: 2, MS: 2, SJ: 2 },
  "Being alone": { AB: 3, SI: 3, ED: 2 },
  "Being evaluated or judged": { FA: 3, DF: 3, US: 2 },
  "Making a mistake": { FA: 3, US: 3, DF: 2 },
  "Comparing yourself to others": { DF: 3, FA: 3, SI: 1 },
  "Thinking about the future": { FA: 3, US: 2 },
  "A memory resurfaced": { DF: 2, MS: 2, AB: 1 },
  "Nothing specific": { ED: 2 },
};

const PERS_S = {
  "Partner / romantic interest": { AB: 3, SJ: 2, ED: 2 },
  "Authority figure (boss, teacher)": { FA: 3, US: 3 },
  "Peer / colleague": { SI: 3, DF: 2 },
  "Friend": { AB: 2, SI: 2 },
  "Family member": { AB: 2, SJ: 2 },
  "No one — just me": { ED: 2, FA: 2 },
};

const MEAN_S = {
  "I'm unlovable.": { DF: 5 }, "I'll be rejected.": { AB: 5 },
  "I'm not enough.": { DF: 4, FA: 3 }, "I'm failing.": { FA: 5 },
  "I don't belong.": { SI: 5 }, "I can't rely on anyone.": { MS: 5 },
  "My needs don't matter.": { SJ: 5 }, "I must do better.": { US: 5 },
};

const COPE_S = {
  "Withdraw / shut down": { schema: { ED: 3, SI: 2, DF: 2 }, mode: ["DP"] },
  "Seek reassurance": { schema: { AB: 4 }, mode: ["VC"] },
  "Distract / escape": { schema: { ED: 2, DF: 1 }, mode: ["DP"] },
  "Push harder / prove myself": { schema: { US: 4, FA: 2 }, mode: ["DemP"] },
  "Get angry / defensive": { schema: { MS: 4, SJ: 2 }, mode: ["AC"] },
  "Give in / appease": { schema: { SJ: 4 }, mode: ["CS"] },
  "Freeze / avoid action": { schema: { MS: 3, DF: 1 }, mode: ["VC"] },
};

const NEED_S = {
  "Stay with me": { AB: 5 }, "Reassure me": { AB: 4, ED: 2 },
  "Protect me": { MS: 4 }, "Respect me": { SJ: 4 },
  "Believe in me": { FA: 4 }, "Accept me as I am": { DF: 4 },
  "Leave me alone": { ED: 2, MS: 2 },
};

const DISAMB = {
  "DF-FA": { q: "When you feel 'not enough,' is it more about...", opts: [{ t: "Who I am as a person is wrong", b: { DF: 3 } }, { t: "I can't perform or achieve well enough", b: { FA: 3 } }] },
  "AB-ED": { q: "Is the pain more about...", opts: [{ t: "Losing people who matter to me", b: { AB: 3 } }, { t: "Not being understood even when people are here", b: { ED: 3 } }] },
  "MS-AB": { q: "The fear comes from...", opts: [{ t: "Being betrayed or used", b: { MS: 3 } }, { t: "Being left or replaced", b: { AB: 3 } }] },
  "SJ-AB": { q: "When you give in, is it more about...", opts: [{ t: "Avoiding anger or conflict", b: { SJ: 3 } }, { t: "Preventing them from leaving", b: { AB: 3 } }] },
  "ED-SI": { q: "Is the pain more about...", opts: [{ t: "Not being understood by people around me", b: { ED: 3 } }, { t: "Not having people at all", b: { SI: 3 } }] },
  "MS-SJ": { q: "Do you stay quiet because...", opts: [{ t: "It's safer — speaking up is dangerous", b: { MS: 3 } }, { t: "I'm afraid of the consequences", b: { SJ: 3 } }] },
};

// ── KINGDOMS ──
const KINGDOMS = {
  AB: { name: "The Shifting Tides", sub: "Abandonment", env: "Tidal shores with dissolving bridges", grad: "linear-gradient(135deg,#1a0a1e,#2d1435,#1a1028,#0f1a2e)", accent: "#E85D75", particles: ["~","≈","∿","◌"],
    minions: [
      { name: "The Drifter", icon: "drift", thought: "They're pulling away from me.", distortion: "Mind Reading", reframes: ["I can't read their mind — distance isn't always rejection.", "People have their own rhythms that aren't about me."] },
      { name: "The Vanisher", icon: "vanish", thought: "This connection won't last.", distortion: "Fortune Telling", reframes: ["I'm predicting loss before it happens.", "Some things last. I don't have the evidence this won't."] },
      { name: "The Echo Caller", icon: "echo", thought: "I'm going to end up alone.", distortion: "Catastrophizing", reframes: ["Loneliness right now doesn't mean alone forever.", "I've weathered this feeling before and it shifted."] }
    ],
    boss: { name: "The Forsaker", icon: "forsaker", belief: "Everyone leaves eventually.", transformed: "The Anchor", tIcon: "anchor", wisdom: "I can hold steady even in uncertainty.", transformLine: "I was trying to prepare you... so it wouldn't hurt as much when they left." }
  },
  ED: { name: "The Hollow Vale", sub: "Emotional Deprivation", env: "Muted landscape where warmth recedes", grad: "linear-gradient(135deg,#0e0e1e,#1a1a35,#121228,#0a0a1c)", accent: "#7B8CDE", particles: ["·","∘","○","◌"],
    minions: [
      { name: "The Withholder", icon: "withhold", thought: "No one will understand what I need.", distortion: "Mind Reading", reframes: ["I haven't tested this — some people do want to understand.", "Not asking guarantees I won't receive."] },
      { name: "The Empty Well", icon: "well", thought: "I shouldn't expect comfort from anyone.", distortion: "Should Statements", reframes: ["That's a rule, not a truth. Comfort is a basic human need.", "Expecting nothing protects me but also isolates me."] },
      { name: "The Invisible", icon: "invisible", thought: "Even when people are here, I feel alone.", distortion: "Emotional Reasoning", reframes: ["Feeling alone doesn't mean I am alone.", "This feeling may say more about the pattern than the people."] }
    ],
    boss: { name: "The Withholder King", icon: "withholdK", belief: "My needs will never be met.", transformed: "The Well", tIcon: "wellT", wisdom: "I can name my needs and seek care.", transformLine: "I taught you not to need... because needing hurt so much." }
  },
  DF: { name: "The Hall of Mirrors", sub: "Defectiveness", env: "Distorted reflections multiply endlessly", grad: "linear-gradient(135deg,#0a0612,#1a0e2e,#12082a,#08040f)", accent: "#9B5DE5", particles: ["◇","◆","▽","✧"],
    minions: [
      { name: "The Whisperer", icon: "whisper", thought: "They can see right through you.", distortion: "Mind Reading", reframes: ["I can't actually read minds. I don't know what they see.", "People are usually more focused on themselves than judging me."] },
      { name: "The Exposer", icon: "exposer", thought: "If they knew the real you, they'd leave.", distortion: "Fortune Telling", reframes: ["I'm predicting rejection without evidence.", "Some people have seen me clearly and chose to stay."] },
      { name: "The Mocking Shade", icon: "shade", thought: "You're not good enough as a person.", distortion: "Labeling", reframes: ["That's a label, not a fact. I have specific traits, not a fixed rating.", "Making mistakes doesn't make me a mistake."] }
    ],
    boss: { name: "The Judge", icon: "judge", belief: "I am fundamentally flawed.", transformed: "The Discerner", tIcon: "discerner", wisdom: "I can see myself clearly — without cruelty.", transformLine: "I was trying to protect you. If I convinced you first, no one else could hurt you." }
  },
  FA: { name: "The Crumbling Academy", sub: "Failure", env: "Cracking structures and ticking timers", grad: "linear-gradient(135deg,#1a0a18,#2e1428,#1c0e1a,#120810)", accent: "#F15BB5", particles: ["△","▽","◁","▷"],
    minions: [
      { name: "The Examiner", icon: "exam", thought: "You're going to fail at this.", distortion: "Fortune Telling", reframes: ["I'm predicting failure without evidence.", "Struggle doesn't equal failure — it's part of learning."] },
      { name: "The Comparer", icon: "compare", thought: "Everyone else can handle this but you.", distortion: "All-or-Nothing", reframes: ["I'm seeing others' highlight reel, not their struggles.", "Difficulty isn't proof of inadequacy."] },
      { name: "The Clock", icon: "clock", thought: "You're running out of time to prove yourself.", distortion: "Catastrophizing", reframes: ["There isn't a deadline on my worth.", "Urgency doesn't mean I'm failing."] }
    ],
    boss: { name: "The Inadequate Crown", icon: "crown", belief: "I am incapable of success.", transformed: "The Builder", tIcon: "builder", wisdom: "I can define success on my own terms.", transformLine: "I kept you small so you'd never reach high enough to fall." }
  },
  SI: { name: "The Outer Ring", sub: "Social Isolation", env: "Glass walls separate from warmth", grad: "linear-gradient(135deg,#0a1a1a,#0f2828,#0c1e1e,#081414)", accent: "#4ECDC4", particles: ["○","◎","◉","●"],
    minions: [
      { name: "The Outsider", icon: "outsider", thought: "I don't fit in here.", distortion: "Labeling", reframes: ["Feeling different isn't the same as being excluded.", "Connection doesn't require being identical."] },
      { name: "The Closed Circle", icon: "circle", thought: "They're closer to each other than to me.", distortion: "Mind Reading", reframes: ["I'm guessing about bonds I can't measure.", "Closeness isn't a finite resource."] },
      { name: "The Passing Crowd", icon: "crowd", thought: "No one would notice if I disappeared.", distortion: "Fortune Telling", reframes: ["I'm underestimating my impact on others.", "Invisibility is a feeling, not a fact."] }
    ],
    boss: { name: "The Gatekeeper", icon: "gatekeeper", belief: "I don't belong anywhere.", transformed: "The Bridge", tIcon: "bridge", wisdom: "I can create connection through choice.", transformLine: "I kept you outside so you wouldn't feel the sting of being pushed out." }
  },
  MS: { name: "The Iron Bastion", sub: "Mistrust", env: "Surveillance and hidden traps everywhere", grad: "linear-gradient(135deg,#1a0e0e,#2e1414,#1c1010,#120a0a)", accent: "#FF6B6B", particles: ["⬡","⬢","◈","◊"],
    minions: [
      { name: "The Doubter", icon: "doubter", thought: "There's always a hidden motive.", distortion: "Mind Reading", reframes: ["Not every kindness has strings attached.", "I can evaluate trust based on evidence, not fear."] },
      { name: "The Traplayer", icon: "trap", thought: "If I let my guard down, I'll get hurt.", distortion: "Fortune Telling", reframes: ["Vulnerability isn't guaranteed pain.", "Some risks are worth taking to build real connection."] },
      { name: "The False Ally", icon: "false", thought: "People are only nice when they want something.", distortion: "Overgeneralization", reframes: ["Some people have been genuinely kind without agenda.", "This belief protects me but also keeps everyone at distance."] }
    ],
    boss: { name: "The Betrayer Sentinel", icon: "sentinel", belief: "People will hurt me if I let them in.", transformed: "The Sentinel", tIcon: "sentinelT", wisdom: "I can discern safe risks from real threats.", transformLine: "I built these walls because once, the door was open and someone walked in and broke things." }
  },
  SJ: { name: "The Weighed Court", sub: "Subjugation", env: "Heavy gravity and imposed paths", grad: "linear-gradient(135deg,#1a150a,#2e2410,#1c1808,#120e04)", accent: "#FFA62B", particles: ["⛓","◼","▣","▩"],
    minions: [
      { name: "The Obligator", icon: "oblig", thought: "I have to do what they expect.", distortion: "Should Statements", reframes: ["Obligation isn't the same as choice.", "I can consider what I want before deciding."] },
      { name: "The Guilt Bearer", icon: "guilt", thought: "If I say no, something bad will happen.", distortion: "Catastrophizing", reframes: ["Saying no is not the same as causing harm.", "Other people's reactions are their responsibility."] },
      { name: "The Silencer", icon: "silence", thought: "My opinion will only cause trouble.", distortion: "Fortune Telling", reframes: ["I'm predicting conflict that hasn't happened.", "My perspective has value even when it differs."] }
    ],
    boss: { name: "The Yoke", icon: "yoke", belief: "My needs don't matter.", transformed: "The Voice", tIcon: "voice", wisdom: "My needs are valid and worth expressing.", transformLine: "I taught you to carry everything quietly... because asking was punished." }
  },
  US: { name: "The Ascension Spire", sub: "Unrelenting Standards", env: "Endless climb, receding summit", grad: "linear-gradient(135deg,#0a141e,#0f2235,#0c1a28,#08101c)", accent: "#00BBF9", particles: ["△","▲","⬆","↑"],
    minions: [
      { name: "The Taskmaster", icon: "task", thought: "I should be doing more.", distortion: "Should Statements", reframes: ["'Should' is a demand, not a truth. I can choose what's enough.", "Rest is productive — my brain needs it to function."] },
      { name: "The Faultfinder", icon: "fault", thought: "This isn't good enough yet.", distortion: "All-or-Nothing", reframes: ["'Good enough' is a real standard, not a failure.", "Perfection is a moving target — done beats perfect."] },
      { name: "The Deadline", icon: "deadline", thought: "I can't rest until everything is finished.", distortion: "Emotional Reasoning", reframes: ["The urgency is a feeling, not a fact.", "Incomplete doesn't mean inadequate."] }
    ],
    boss: { name: "The Perfectionist", icon: "perfect", belief: "If I'm not perfect, I'm worthless.", transformed: "The Compass", tIcon: "compass", wisdom: "Good enough is a real destination.", transformLine: "I drove you because I believed only perfection could keep you safe from criticism." }
  },
};

// ── Thought templates per schema×mode ──
const THOUGHT_TEMPLATES = {
  AB: { base: ["They're pulling away.","This won't last.","I'm going to be left.","Something is wrong—I can feel it.","I'm not a priority."], VC: ["What if they leave?","I'm scared I'll end up alone."], AC: ["Why do I always have to fight to keep people?"], DP: ["Whatever. People leave.","Doesn't matter."], CS: ["Maybe if I try harder, they'll stay."], PunP: ["You drive everyone away."] },
  ED: { base: ["No one really gets me.","I shouldn't expect comfort.","I'm invisible.","People don't show up when it matters.","I have to handle it alone."], VC: ["I just want someone to notice."], AC: ["Why do I have to spell everything out?"], DP: ["I don't need anyone."], CS: ["I'll just handle it myself."], PunP: ["You don't deserve care."] },
  DF: { base: ["Something about me is wrong.","If they really knew me, they'd leave.","I'm not good enough as a person.","I'm defective.","Everyone can see it."], VC: ["I'm so ashamed.","What if they find out?"], AC: ["Why can't I just be normal?"], DP: ["It doesn't matter what they think."], CS: ["I'll just hide the real me."], PunP: ["You're worthless.","You deserve to feel this way."] },
  FA: { base: ["I'm going to fail.","Everyone else handles this fine.","I'm not smart enough.","I'll never succeed.","I'm running out of time."], VC: ["I can't do this."], AC: ["It's unfair—everyone has advantages I don't."], DP: ["Success doesn't matter anyway."], DemP: ["Try harder. No excuses."], PunP: ["You're incompetent."] },
  SI: { base: ["I don't belong.","I'm fundamentally different.","No one would notice if I disappeared.","They're all connected and I'm outside.","I'll never fit in."], VC: ["I feel so alone."], AC: ["Why don't people include me?"], DP: ["I prefer being alone anyway."], CS: ["I'll just adapt to whatever they want."], PunP: ["You're too weird for people to accept."] },
  MS: { base: ["I can't trust this.","There's always a catch.","They'll use this against me.","People only look out for themselves.","If I let my guard down, I'll get hurt."], VC: ["I'm scared of being hurt again."], AC: ["I won't let anyone take advantage of me."], DP: ["Trust no one. Simple."], CS: ["I'll just go along so they don't turn on me."], PunP: ["You're naive if you trust anyone."] },
  SJ: { base: ["My needs don't matter.","I have to do what they want.","Saying no will cause problems.","It's easier to give in.","My opinion doesn't count."], VC: ["I just want them to stop pressuring me."], AC: ["I'm so tired of being pushed around."], DP: ["It doesn't matter what I want."], CS: ["I should just go along with it."], PunP: ["You're selfish for wanting things."] },
  US: { base: ["This isn't good enough.","I should be doing more.","I'm falling behind.","I can't rest until it's perfect.","Good enough isn't enough."], VC: ["What if I can't keep up?"], AC: ["Why is nothing ever enough?"], DP: ["Whatever—it's fine."], DemP: ["Push harder. Don't stop.","No rest until it's done."], PunP: ["You're lazy.","You'll never amount to anything at this rate."] },
};

// ── Adaptive Coach Responses ──
const COACH_RESPONSES = {
  emotion: {
    "Shame": { kai: "Shame often feels like it defines us. But it's a feeling, not an identity. Let's look at what's underneath it.", science: "Shame activates the anterior cingulate cortex — your brain literally processes it like physical pain." },
    "Loneliness": { kai: "Loneliness can be so loud. It doesn't mean you're alone in any permanent way — it means a need isn't being met right now.", science: "Social pain uses the same neural pathways as physical pain. Your brain treats disconnection as a threat." },
    "Emptiness": { kai: "That hollowed-out feeling makes sense. Sometimes when emotions get too intense, the system just... goes quiet.", science: "Emotional numbness can be a protective mechanism — your nervous system dampening overwhelming input." },
    "Sadness": { kai: "Sadness has information in it. It usually points toward something that matters to you.", science: "Sadness slows us down and turns attention inward — evolutionarily, it's a signal to reflect and seek support." },
    "Fear / Anxiety": { kai: "Anxiety is your alarm system. Right now it's loud — but loud doesn't mean accurate. Let's check what it's responding to.", science: "Anxiety activates your amygdala's threat detection. The feeling is real, but the predicted threat may not be." },
    "Hopelessness": { kai: "When everything feels impossible, that's the feeling talking, not the facts. Hopelessness narrows your view — let's widen it together.", science: "Hopelessness correlates with reduced prefrontal activity — your brain's problem-solving center goes quieter. That's reversible." },
    "Guilt": { kai: "Guilt can be a compass — but it can also be a cage. Let's figure out which one this is.", science: "Productive guilt motivates repair. Chronic guilt reinforces schemas about being 'bad.' The difference matters." },
    "Anger": { kai: "Anger is often hurt wearing armor. There's usually something vulnerable underneath it.", science: "Anger is a secondary emotion — it typically masks primary feelings like fear, sadness, or helplessness." },
    "Numbness": { kai: "Numbness isn't nothing — it's your system's way of managing something too big. Let's go gently.", science: "Dissociative numbing is a parasympathetic response. Your nervous system is protecting you from overload." },
  },
  trigger: {
    "Being evaluated or judged": "That makes sense — situations where you feel watched or measured can activate deep patterns about worth and competence.",
    "Being alone": "Solitude can be peaceful or painful depending on what narratives fill the silence. Let's see what yours is saying.",
    "Making a mistake": "Mistakes hit different when they connect to beliefs about who you are, not just what you did.",
    "Comparing yourself to others": "Comparison steals context. You're seeing their outside and comparing it to your inside.",
    "Conflict or disagreement": "Conflict can feel threatening when it connects to fears about relationships or safety.",
    "Interaction with someone": "Something about that interaction activated a pattern. Let's trace what that was.",
    "Thinking about the future": "Future-focused anxiety often borrows pain from the past and projects it forward.",
    "A memory resurfaced": "When old memories surface, they bring old feelings with them — even if the situation is different now.",
    "Nothing specific": "Sometimes the feeling arrives without an obvious trigger. That usually means it's a deeper pattern surfacing.",
  },
  meaning: {
    "I'm unlovable.": "That belief has probably been there a long time. It feels true — but feeling true and being true are very different things.",
    "I'll be rejected.": "The anticipation of rejection can be its own kind of pain. Your brain is trying to protect you by predicting it first.",
    "I'm not enough.": "Notice the absoluteness of that. Not 'I struggled with this specific thing' — but 'I'm not enough.' That's a schema speaking.",
    "I'm failing.": "Failure feels final. But most of what we call 'failure' is actually incomplete progress. There's a difference.",
    "I don't belong.": "Belonging isn't about being identical to others. It's about being seen. That belief may be keeping you from testing whether people would accept you.",
    "I can't rely on anyone.": "When trust has been broken before, self-reliance feels safer. But it also keeps people at a distance where they can't prove the belief wrong.",
    "My needs don't matter.": "If you learned early that your needs caused problems, of course you'd minimize them. That was adaptive then — but it's costing you now.",
    "I must do better.": "The drive to improve can be healthy. But when it becomes 'I must be better or I'm worthless,' it's the schema talking, not motivation.",
  },
};

// ── Modes ──
const MODES = {
  VC: { name: "Vulnerable Child", color: "#B5E2FA" }, AC: { name: "Angry Child", color: "#FF6B6B" },
  DP: { name: "Detached Protector", color: "#95A3B3" }, CS: { name: "Compliant Surrenderer", color: "#C9B1FF" },
  DemP: { name: "Demanding Parent", color: "#FFC300" }, PunP: { name: "Punitive Parent", color: "#900C3F" },
};

const MODE_INFER = {
  "Shame": ["VC","PunP"], "Fear / Anxiety": ["VC"], "Anger": ["AC"],
  "Numbness": ["DP"], "Emptiness": ["DP","VC"], "Guilt": ["CS","PunP"],
  "Hopelessness": ["VC","CS"], "Loneliness": ["VC"], "Sadness": ["VC"],
};

const SOCRATIC = [
  { id: "evidence", name: "Evidence Check", icon: "⚔️", damage: 28, q: "What's the actual evidence — facts, not feelings?" },
  { id: "friend", name: "Friend Test", icon: "💛", damage: 32, q: "If your closest friend said this about themselves, what would you tell them?" },
  { id: "double", name: "Double Standard", icon: "⚖️", damage: 30, q: "Are you holding yourself to a standard you'd never apply to someone you care about?" },
  { id: "kind", name: "Kind Reframe", icon: "🌱", damage: 35, q: "What's a way to say this that's honest AND not cruel?" },
];

// ── Safety ──
const HARD_KW = ["kill myself","want to die","end it all","suicide","end my life","hurt myself","overdose"];
const SOFT_KW = ["no reason to live","can't go on","what's the point","better off without me","don't want to be here"];
function checkSafety(t) { if(!t) return "OK"; const l=t.toLowerCase(); if(HARD_KW.some(k=>l.includes(k))) return "HARD"; if(SOFT_KW.some(k=>l.includes(k))) return "SOFT"; return "OK"; }


// ── TPGE Engine Core ──
function runTPGE(a) {
  const s = { AB:0, ED:0, DF:0, FA:0, SI:0, MS:0, SJ:0, US:0 };
  const add = m => { if(m) Object.entries(m).forEach(([k,v]) => s[k]+=v); };
  if(a.emotions) a.emotions.forEach(e => add(EMO_S[e]));
  let sorted = () => Object.entries(s).sort((x,y) => y[1]-x[1]);
  let t = sorted();
  if(a.intensity>=85){if(t[0])s[t[0][0]]+=2;if(t[1])s[t[1][0]]+=1;}
  else if(a.intensity>=70){if(t[0])s[t[0][0]]+=1;if(t[1])s[t[1][0]]+=1;}
  if(a.trigger) add(TRIG_S[a.trigger]);
  if(a.person) add(PERS_S[a.person]);
  if(a.meaning) add(MEAN_S[a.meaning]);
  if(a.meaning){const ms=MEAN_S[a.meaning];if(ms){const tp=Object.entries(ms).sort((x,y)=>y[1]-x[1])[0];if(tp){if(a.truthRating>=85)s[tp[0]]+=2;else if(a.truthRating>=70)s[tp[0]]+=1;}}}
  t=sorted();
  if(a.familiarity==="This is my story"){[0,1].forEach(i=>{if(t[i])s[t[i][0]]+=2;});}
  else if(a.familiarity==="It happens a lot"){[0,1,2].forEach(i=>{if(t[i])s[t[i][0]]+=1;});}
  t=sorted();
  if(a.onset==="Childhood — as far back as I can remember"){if(t[0])s[t[0][0]]+=2;}
  else if(a.onset==="Teenage years"){if(t[0])s[t[0][0]]+=1;if(t[1])s[t[1][0]]+=1;}
  if(a.copingUrge){const c=COPE_S[a.copingUrge];if(c?.schema)add(c.schema);}
  if(a.unmetNeed) add(NEED_S[a.unmetNeed]);
  t=sorted();
  const top = t.filter(x=>x[1]>0).map(([code,score])=>({code,score,schema:SCHEMAS[code]}));
  const maxScore = top[0]?.score||1;
  const conf = top.length>=2 ? Math.round(((top[0].score-top[1].score)/maxScore)*100) : 95;
  // Mode inference
  const modeS = { VC:0, AC:0, DP:0, CS:0, DemP:0, PunP:0 };
  if(a.emotions) a.emotions.forEach(e=>{const ms=MODE_INFER[e];if(ms)ms.forEach(m=>modeS[m]+=3);});
  if(a.copingUrge){const c=COPE_S[a.copingUrge];if(c?.mode)c.mode.forEach(m=>modeS[m]+=4);}
  const topModes = Object.entries(modeS).sort((x,y)=>y[1]-x[1]).filter(x=>x[1]>0).map(([code,score])=>({code,score}));
  // Thoughts
  const pk = top[0]?.code || "DF";
  const tm = topModes[0]?.code || "VC";
  const templates = THOUGHT_TEMPLATES[pk];
  let thoughts = [...(templates?.base||[])];
  if(templates?.[tm]) thoughts.push(...templates[tm]);
  // Disambiguator check
  let disamb = null;
  if(conf <= 50 && top.length >= 2) {
    const key = `${top[0].code}-${top[1].code}`;
    const key2 = `${top[1].code}-${top[0].code}`;
    disamb = DISAMB[key] || DISAMB[key2] || null;
  }
  return { scores: s, top, conf, topModes, pk, tm, thoughts, kingdom: KINGDOMS[pk], disamb, maxScore };
}

// ══════════════════════════════════════════════════════════════
// 2D SVG CHARACTERS
// ══════════════════════════════════════════════════════════════

function KaiChar({ mood="idle", size=100, style={} }) {
  const blink = mood==="think" ? "kaiThinkEye" : mood==="happy" ? "kaiHappyEye" : "kaiBlink";
  const body = mood==="think" ? "kaiLean" : mood==="wave" ? "kaiWaveBody" : "kaiBreathe";
  return (
    <svg viewBox="0 0 120 160" width={size} height={size*1.33} style={{animation:`${body} 3s ease-in-out infinite`,...style}}>
      <defs>
        <linearGradient id="kCloak" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#1a2a4a"/><stop offset="100%" stopColor="#0e1a30"/></linearGradient>
        <radialGradient id="kGlow" cx="50%" cy="40%"><stop offset="0%" stopColor="rgba(93,156,232,0.2)"/><stop offset="100%" stopColor="transparent"/></radialGradient>
        <radialGradient id="kOrb"><stop offset="0%" stopColor="rgba(93,156,232,0.6)"/><stop offset="100%" stopColor="transparent"/></radialGradient>
      </defs>
      <ellipse cx="60" cy="148" rx="30" ry="10" fill="rgba(93,156,232,0.1)"/>
      <path d="M32 72 Q32 135 60 145 Q88 135 88 72" fill="url(#kCloak)" stroke="rgba(93,156,232,0.3)" strokeWidth="1"/>
      <circle cx="60" cy="52" r="28" fill="#1e1e2e" stroke="rgba(93,156,232,0.4)" strokeWidth="1.5"/>
      <circle cx="60" cy="52" r="22" fill="url(#kGlow)"/>
      <path d="M32 52 Q28 28 60 14 Q92 28 88 52" fill="#1a2a4a" opacity="0.7"/>
      <g style={{animation:`${blink} 4s ease-in-out infinite`}}>
        <ellipse cx="50" cy="50" rx="4" ry={mood==="happy"?2:4.5} fill="#5d9ce8"/>
        <ellipse cx="70" cy="50" rx="4" ry={mood==="happy"?2:4.5} fill="#5d9ce8"/>
        <circle cx="51" cy="48" r="1.5" fill="#a0cfff" opacity="0.8"/>
        <circle cx="71" cy="48" r="1.5" fill="#a0cfff" opacity="0.8"/>
      </g>
      {mood==="happy" ? <path d="M52 60 Q60 66 68 60" fill="none" stroke="#5d9ce8" strokeWidth="1.5" strokeLinecap="round"/>
       : mood==="think" ? <ellipse cx="62" cy="61" rx="3" ry="2" fill="none" stroke="#5d9ce8" strokeWidth="1"/>
       : <path d="M54 61 Q60 63 66 61" fill="none" stroke="rgba(93,156,232,0.5)" strokeWidth="1" strokeLinecap="round"/>}
      {mood==="think" && <g style={{animation:"orbFloat 2s ease-in-out infinite"}}><circle cx="60" cy="115" r="8" fill="url(#kOrb)"/><circle cx="60" cy="115" r="5" fill="#5d9ce8" opacity="0.5"/></g>}
      {mood==="wave" && <g style={{transformOrigin:"85px 80px",animation:"handWave 0.8s ease-in-out infinite"}}><path d="M82 78 Q90 68 92 58" fill="none" stroke="#c4a8e8" strokeWidth="3" strokeLinecap="round"/><circle cx="92" cy="56" r="4" fill="#c4a8e8"/></g>}
    </svg>
  );
}

function MinionChar({ type="whisper", color="#9B5DE5", size=90, defeated=false, style={} }) {
  const shapes = {
    drift:   { body:"M30 50 Q20 90 40 110 Q60 120 80 110 Q100 90 90 50 Q80 20 60 15 Q40 20 30 50Z", eyes:[{cx:48,cy:52},{cx:72,cy:52}], mouth:"M50 68 Q60 72 70 68" },
    vanish:  { body:"M35 45 Q25 85 45 108 Q60 115 75 108 Q95 85 85 45 Q75 20 60 18 Q45 20 35 45Z", eyes:[{cx:50,cy:50},{cx:70,cy:50}], mouth:"M52 66 Q60 62 68 66" },
    echo:    { body:"M40 48 Q28 80 42 105 Q55 115 68 105 Q82 80 70 48 Q65 28 55 25 Q45 28 40 48Z", eyes:[{cx:50,cy:50},{cx:66,cy:50}], mouth:"M50 65 L62 65" },
    whisper: { body:"M32 50 Q22 88 42 108 Q60 118 78 108 Q98 88 88 50 Q78 22 60 16 Q42 22 32 50Z", eyes:[{cx:48,cy:50},{cx:72,cy:50}], mouth:"M48 66 Q60 74 72 66" },
    exposer: { body:"M35 48 Q25 85 43 108 Q58 115 73 108 Q95 85 85 48 Q75 22 55 16 Q40 22 35 48Z", eyes:[{cx:47,cy:50},{cx:68,cy:50}], mouth:"M50 66 Q58 60 66 66" },
    shade:   { body:"M30 55 Q20 90 40 110 Q60 118 80 110 Q100 90 90 55 Q82 25 60 15 Q38 25 30 55Z", eyes:[{cx:46,cy:52},{cx:74,cy:52}], mouth:"M46 68 Q60 76 74 68" },
    default: { body:"M35 48 Q25 85 45 108 Q60 115 75 108 Q95 85 85 48 Q75 22 60 16 Q45 22 35 48Z", eyes:[{cx:48,cy:50},{cx:72,cy:50}], mouth:"M50 66 Q60 72 70 66" },
  };
  const s = shapes[type] || shapes.default;
  return (
    <svg viewBox="0 0 120 130" width={size} height={size*1.08} style={{...style, animation: defeated ? "none" : "minionFloat 3s ease-in-out infinite", opacity: defeated ? 0.25 : 1, filter: defeated ? "grayscale(1)" : `drop-shadow(0 0 12px ${color}55)`, transition: "all 1s ease" }}>
      <defs>
        <linearGradient id={`mg${type}`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor={color} stopOpacity="0.8"/><stop offset="100%" stopColor={color} stopOpacity="0.4"/></linearGradient>
      </defs>
      <ellipse cx="60" cy="118" rx="25" ry="6" fill={`${color}22`}/>
      <path d={s.body} fill={`url(#mg${type})`} stroke={`${color}88`} strokeWidth="1.5"/>
      {/* inner pattern */}
      <path d={s.body} fill="none" stroke={`${color}15`} strokeWidth="8" strokeDasharray="4 8"/>
      {/* eyes */}
      <g style={{animation:"minionBlink 5s ease-in-out infinite"}}>
        {s.eyes.map((e,i) => <g key={i}><ellipse cx={e.cx} cy={e.cy} rx="5" ry="6" fill="#0a0a1a"/><ellipse cx={e.cx} cy={e.cy} rx="3.5" ry="4.5" fill={color} opacity="0.9"/><circle cx={e.cx+1} cy={e.cy-1.5} r="1.5" fill="#fff" opacity="0.7"/></g>)}
      </g>
      <path d={s.mouth} fill="none" stroke="#0a0a1a" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function BossChar({ type="judge", color="#9B5DE5", size=120, hp=100, transformed=false, style={} }) {
  const glow = hp > 60 ? 20 : hp > 30 ? 12 : 6;
  return (
    <svg viewBox="0 0 140 180" width={size} height={size*1.29} style={{...style, animation: transformed ? "bossTransform 2s ease forwards" : hp < 30 ? "bossShake 0.5s ease infinite" : "bossFloat 4s ease-in-out infinite", filter: transformed ? `drop-shadow(0 0 20px rgba(155,93,229,0.6))` : `drop-shadow(0 0 ${glow}px ${color}88)` }}>
      <defs>
        <radialGradient id="bossGlow"><stop offset="0%" stopColor={transformed ? "#9B5DE5" : color} stopOpacity="0.4"/><stop offset="100%" stopColor="transparent"/></radialGradient>
        <linearGradient id="bossBody" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={transformed ? "#9B5DE5" : color}/><stop offset="100%" stopColor={transformed ? "#6B3FA0" : `${color}88`}/></linearGradient>
      </defs>
      {/* aura */}
      <circle cx="70" cy="80" r="65" fill="url(#bossGlow)" style={{animation:"bossAura 3s ease-in-out infinite"}}/>
      {/* body */}
      <path d="M30 65 Q20 120 45 150 Q70 165 95 150 Q120 120 110 65 Q100 25 70 15 Q40 25 30 65Z" fill="url(#bossBody)" stroke={transformed?"#c4a8e8":`${color}66`} strokeWidth="2"/>
      {/* crown/horns */}
      {!transformed && <>
        <path d="M45 30 L35 8 L50 22Z" fill={color} opacity="0.7"/>
        <path d="M95 30 L105 8 L90 22Z" fill={color} opacity="0.7"/>
        <path d="M70 20 L70 2 L75 18Z" fill={color} opacity="0.5"/>
      </>}
      {transformed && <circle cx="70" cy="15" r="10" fill="none" stroke="#c4a8e8" strokeWidth="1.5" style={{animation:"orbFloat 2s ease-in-out infinite"}}/>}
      {/* face */}
      <g style={{animation: transformed ? "none" : "bossBlink 6s ease-in-out infinite"}}>
        <ellipse cx="55" cy="68" rx={transformed?5:7} ry={transformed?5:8} fill="#0a0a1a"/>
        <ellipse cx="85" cy="68" rx={transformed?5:7} ry={transformed?5:8} fill="#0a0a1a"/>
        <ellipse cx="55" cy="68" rx={transformed?4:5} ry={transformed?4:6} fill={transformed?"#c4a8e8":color} opacity="0.9"/>
        <ellipse cx="85" cy="68" rx={transformed?4:5} ry={transformed?4:6} fill={transformed?"#c4a8e8":color} opacity="0.9"/>
        {!transformed && <><circle cx="56" cy="66" r="2" fill="#fff" opacity="0.5"/><circle cx="86" cy="66" r="2" fill="#fff" opacity="0.5"/></>}
      </g>
      {transformed ? <path d="M58 88 Q70 96 82 88" fill="none" stroke="#c4a8e8" strokeWidth="2" strokeLinecap="round"/>
       : <path d="M50 88 Q70 82 90 88" fill="none" stroke="#0a0a1a" strokeWidth="2.5" strokeLinecap="round"/>}
      {/* hp cracks */}
      {hp < 60 && !transformed && <><path d="M45 90 L38 110 L48 105" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5"/>{hp<30 && <path d="M90 75 L98 95 L88 92" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5"/>}</>}
    </svg>
  );
}


// ══════════════════════════════════════════════════════════════
// UI COMPONENTS
// ══════════════════════════════════════════════════════════════
const F = "'Crimson Pro',Georgia,serif";
const M = "'JetBrains Mono','Fira Code',monospace";
const D = "'Playfair Display',Georgia,serif";

function Typewriter({ text, speed=28, onDone, style={} }) {
  const [d,setD]=useState(""); const idx=useRef(0);
  useEffect(()=>{ idx.current=0; setD("");
    const iv=setInterval(()=>{ idx.current++; setD(text.slice(0,idx.current)); if(idx.current>=text.length){clearInterval(iv);onDone?.();}},speed);
    return ()=>clearInterval(iv);
  },[text]);
  return <span style={style}>{d}<span style={{opacity:0.4,animation:"blink 1s step-end infinite"}}>|</span></span>;
}

function Particles({ kingdom }) {
  const chars = kingdom?.particles || ["◇","◆","▽","✧"];
  const [p]=useState(()=>Array.from({length:20},(_,i)=>({id:i,x:Math.random()*100,y:Math.random()*100,s:Math.random()*3+1,dur:Math.random()*20+15,del:Math.random()*-20,ch:chars[i%chars.length],op:Math.random()*0.25+0.05})));
  return <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:1,overflow:"hidden"}}>{p.map(pt=><div key={pt.id} style={{position:"absolute",left:`${pt.x}%`,top:`${pt.y}%`,fontSize:pt.s+8,color:kingdom?.accent||"#9B5DE5",opacity:pt.op,animation:`floatP ${pt.dur}s linear ${pt.del}s infinite`}}>{pt.ch}</div>)}</div>;
}

function CoachBubble({ name="Kai", mood="idle", children, delay=0, showChar=true }) {
  const colors = { Kai:"rgba(93,155,229,0.08)", Aria:"rgba(229,93,155,0.08)", Zen:"rgba(93,229,200,0.08)" };
  const borders = { Kai:"rgba(93,155,229,0.2)", Aria:"rgba(229,93,155,0.2)", Zen:"rgba(93,229,200,0.2)" };
  const nameColors = { Kai:"#5d9ce8", Aria:"#e85d9c", Zen:"#5de8c4" };
  return (
    <div style={{display:"flex",gap:12,alignItems:"flex-start",animation:`fadeUp 0.6s ease ${delay}s both`}}>
      {showChar && name==="Kai" && <div style={{flexShrink:0}}><KaiChar mood={mood} size={52}/></div>}
      <div style={{flex:1,background:colors[name],border:`1px solid ${borders[name]}`,borderRadius:16,padding:"14px 16px"}}>
        <p style={{fontSize:10,fontFamily:M,color:nameColors[name],letterSpacing:1,textTransform:"uppercase",margin:"0 0 6px"}}>Coach {name}</p>
        <div style={{fontSize:15,lineHeight:1.65,fontFamily:F}}>{children}</div>
      </div>
    </div>
  );
}

function NarrativeBox({ value, onChange, placeholder="If you'd like to share more, write a few words here...", maxLen=300 }) {
  return (
    <div style={{position:"relative",marginTop:12}}>
      <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} maxLength={maxLen}
        style={{width:"100%",minHeight:72,background:"rgba(155,93,229,0.04)",border:"1px solid rgba(155,93,229,0.15)",borderRadius:12,padding:"12px 14px",color:"#e8e0f0",fontFamily:F,fontSize:14,resize:"none",outline:"none",lineHeight:1.6,boxSizing:"border-box"}}/>
      <span style={{position:"absolute",bottom:6,right:10,fontSize:10,fontFamily:M,color:"rgba(255,255,255,0.15)"}}>{value.length}/{maxLen}</span>
    </div>
  );
}

function ScienceNote({ text }) {
  return text ? (
    <div style={{background:"rgba(74,222,128,0.04)",border:"1px solid rgba(74,222,128,0.12)",borderRadius:10,padding:"10px 14px",marginTop:10,fontSize:12,fontFamily:M,color:"rgba(74,222,128,0.6)",lineHeight:1.6,animation:"fadeUp 0.4s ease both"}}>
      <span style={{opacity:0.5}}>🧠 </span>{text}
    </div>
  ) : null;
}

// ── Adaptive Journal Prompts ──
const DEFUSE_PROMPTS = {
  AB: { prompt: "What thoughts or fears come up when you hear this? What story does your mind start telling?", deeper: "If this thought had been with you since childhood, what's the earliest memory it connects to?" },
  ED: { prompt: "When this thought is loudest, what emotions flood in? What do you wish you could say out loud?", deeper: "What would it mean if someone truly heard this thought — and stayed?" },
  DF: { prompt: "What fears does this thought stir up? What does it make you believe about yourself?", deeper: "If a younger version of you was saying this, what would they need to hear?" },
  FA: { prompt: "What does your mind jump to when this thought appears? What worst-case scenario does it paint?", deeper: "If this thought wasn't about ability — what would it really be about?" },
  SI: { prompt: "What emotions surface with this thought? Does it make you want to reach out or pull away?", deeper: "Is there a moment you can remember when you did belong? What was different?" },
  MS: { prompt: "What fears does this thought activate? What does it make you want to protect yourself from?", deeper: "If you could know for sure you were safe right now, what would change?" },
  SJ: { prompt: "Whose voice does this thought sound like? What feelings come up — guilt, anger, resignation?", deeper: "What would you want to say if there were no consequences at all?" },
  US: { prompt: "What fears rush in when you hear this thought? What does it tell you will happen if you stop trying?", deeper: "What would 'enough' actually look like — not perfect, just enough?" },
};

const REFRAME_PROMPTS = {
  AB: "What thoughts or feelings came up when you talked back to that? Does any part of you resist the reframe?",
  ED: "Does the reframe feel possible, or does something in you push back? What emotion comes up — hope, doubt, both?",
  DF: "When you read the reframe, what's your first honest reaction? What fears does it stir or quiet?",
  FA: "Does any part of you believe the reframe? Even 10%? What thought tries to argue against it?",
  SI: "What emotions come up if you let the reframe be true, even just for today? What would you do differently?",
  MS: "What fears surface when you consider trusting the reframe? What would it mean to test it?",
  SJ: "Reading that reframe — what emotions show up? Relief, guilt, fear, something else? All of it is data.",
  US: "If the reframe is true, what thoughts change? What would you give yourself permission to feel?",
};

const RESOLVED_PROMPTS = {
  AB: "Before we move on — what thoughts or feelings are still lingering? Sometimes the real insight comes after the fight.",
  ED: "Take a breath. What's running through your mind right now? Not analyzing — just noticing.",
  DF: "You just challenged a voice that's been loud for a long time. What thoughts are surfacing now?",
  FA: "That thought lost some of its charge. What fears remain? What feels different?",
  SI: "You just proved you can engage with difficult thoughts. What does that tell you? What emotions are here?",
  MS: "You chose to engage instead of defend. What thoughts or feelings are present right now?",
  SJ: "You just exercised choice over a pattern that usually controls you. What's going through your mind?",
  US: "You let something be 'good enough' just now. What thoughts come up — relief, anxiety, something else?",
};

const BOSS_ENTRY_PROMPTS = {
  AB: "Before we examine this belief — what thoughts rush in when you see it written out? What fears does it stir?",
  ED: "This belief has probably been running quietly for a while. What emotions surface when you see it named?",
  DF: "This is the deeper voice. What thoughts or fears come up when you read it? What does it make you believe?",
  FA: "The core belief underneath everything. When you see it clearly, what fears and thoughts flood in?",
  SI: "This is the gatekeeper's real message. What emotions does it trigger? What stories does your mind tell?",
  MS: "This belief built walls for a reason. What fears come up as we prepare to examine it? What does it protect?",
  SJ: "This is the weight you've been carrying. What thoughts and feelings surface when you finally name it?",
  US: "The voice behind the drive. What fears and thoughts come up when you see it stripped down like this?",
};

const POST_TRANSFORM_PROMPTS = {
  AB: "The Anchor is here now. What would your life look like if you believed this even a little? What fears soften?",
  ED: "The Well is open. If you could receive care without guilt, what would you ask for? What thoughts resist that?",
  DF: "The Discerner sees clearly. What would you do differently if shame had less power? What fears remain?",
  FA: "The Builder knows enough is real. What would you try if failure wasn't the end? What thoughts hold you back?",
  SI: "The Bridge connects. Where would you reach if belonging felt possible? What fears linger?",
  MS: "The Sentinel guards wisely. Who would you let closer if trust felt safer? What thoughts argue against it?",
  SJ: "The Voice speaks. What would you say if you believed your needs mattered? What fears come up?",
  US: "The Compass points to rest. What would you stop doing if you believed you were enough? What thoughts resist?",
};

const RERATE_PROMPTS = {
  AB: "Looking back on this session — what surprised you? What thoughts, fears, or realizations will you carry with you?",
  ED: "You showed up for yourself today. What emotions are present now? What do you want to remember from this?",
  DF: "You looked in the mirrors and didn't look away. What did you learn? What fears shifted, even slightly?",
  FA: "You engaged with failure and came out the other side. What thoughts changed? What still feels heavy?",
  SI: "You walked into the Outer Ring and found your voice. What emotions are here now? What do you want to remember?",
  MS: "You lowered the walls enough to examine what's behind them. What did you find? What fears remain?",
  SJ: "You practiced having a voice. What would you say to yourself tomorrow morning? What fears might try to undo it?",
  US: "You let something be imperfect today. What thoughts and emotions are you sitting with right now?",
};

const DISTORTION_DEFS = {
  "Mind Reading": "Assuming you know what others think without evidence",
  "All-or-Nothing Thinking": "Seeing things in only two categories — perfect or failure",
  "Catastrophizing": "Jumping to the worst possible outcome",
  "Emotional Reasoning": "Believing something is true because it feels true",
  "Should Statements": "Rigid rules about how you or others must behave",
  "Labeling": "Attaching a fixed, global label to yourself or others",
  "Personalization": "Blaming yourself for things outside your control",
  "Overgeneralization": "Drawing broad conclusions from a single event",
  "Disqualifying the Positive": "Dismissing good experiences as flukes or irrelevant",
  "Fortune Telling": "Predicting the future will go badly without evidence",
  "Magnification": "Blowing up the importance of problems or shortcomings",
  "Mental Filter": "Focusing only on negatives while ignoring the full picture",
};

function JournalBox({ value, onChange, prompt, onLog, moment, accent="#9B5DE5", expandable=true }) {
  const [expanded,setExpanded]=useState(false);
  const hasText = value?.trim()?.length > 0;
  return (
    <div style={{marginTop:14,animation:"fadeUp 0.4s ease 0.3s both"}}>
      {!expanded && expandable ? (
        <div onClick={()=>setExpanded(true)} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",background:`${accent}06`,border:`1px dashed ${accent}25`,borderRadius:12,cursor:"pointer",transition:"all 0.3s"}}>
          <span style={{fontSize:14,opacity:0.5}}>📝</span>
          <span style={{fontSize:13,color:`${accent}88`,fontFamily:F,fontStyle:"italic"}}>{prompt || "What thoughts, fears, or feelings are coming up right now?"}</span>
        </div>
      ) : (
        <div style={{background:`${accent}06`,border:`1px solid ${accent}20`,borderRadius:14,padding:"12px 14px",transition:"all 0.3s"}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
            <span style={{fontSize:12,opacity:0.5}}>📝</span>
            <span style={{fontSize:11,fontFamily:M,color:`${accent}66`,letterSpacing:0.5}}>YOUR THOUGHTS</span>
            <span style={{marginLeft:"auto",fontSize:9,fontFamily:M,color:"rgba(255,255,255,0.12)"}}>journal</span>
          </div>
          <p style={{fontSize:13,color:`${accent}88`,fontStyle:"italic",lineHeight:1.5,margin:"0 0 8px"}}>{prompt}</p>
          <textarea value={value} onChange={e=>onChange(e.target.value)} maxLength={500}
            placeholder="Whatever comes to mind — thoughts, fears, memories, questions. No filter needed..."
            style={{width:"100%",minHeight:72,background:"rgba(0,0,0,0.15)",border:`1px solid ${accent}15`,borderRadius:10,padding:"10px 12px",color:"#e8e0f0",fontFamily:F,fontSize:14,resize:"vertical",outline:"none",lineHeight:1.6,boxSizing:"border-box",transition:"border-color 0.3s"}}/>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:6}}>
            <span style={{fontSize:10,fontFamily:M,color:"rgba(255,255,255,0.12)"}}>{(value||"").length}/500</span>
            {hasText && <div style={{display:"flex",alignItems:"center",gap:4,animation:"fadeUp 0.3s ease both"}}>
              <span style={{fontSize:9,fontFamily:M,color:"rgba(74,222,128,0.4)"}}>✓ recorded</span>
            </div>}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// SURVEY UI COMPONENTS
// ═══════════════════════════════════════
const SURVEY_SECTIONS = ["Welcome","About You","First Impressions","Experience & Usability","Strengths & Value","Areas to Improve","Feature Ideas","Therapeutic Impact","Pricing & Interest","Final Thoughts","Thank You"];
const ratingLabels5 = ["Strongly Disagree","Disagree","Neutral","Agree","Strongly Agree"];
const likelihoodLabels = ["Very Unlikely","Unlikely","Neutral","Likely","Very Likely"];

function SurveyStarRating({ value, onChange, count=5, labels }) {
  const [hover,setHover]=useState(0);
  return (<div style={{display:"flex",flexDirection:"column",gap:6}}>
    <div style={{display:"flex",gap:4}}>
      {Array.from({length:count},(_,i)=>i+1).map(star=>(
        <button key={star} type="button" onClick={()=>onChange(star)} onMouseEnter={()=>setHover(star)} onMouseLeave={()=>setHover(0)}
          style={{background:"none",border:"none",cursor:"pointer",fontSize:28,color:star<=(hover||value)?"#e8a849":"#3a3a5c",transition:"color 0.15s, transform 0.15s",transform:star<=(hover||value)?"scale(1.15)":"scale(1)",padding:2}}>★</button>
      ))}
    </div>
    {labels&&(value>0||hover>0)&&<span style={{fontSize:13,color:"#a9b4d0",fontStyle:"italic",minHeight:18}}>{labels[(hover||value)-1]}</span>}
  </div>);
}

function SurveyLikert({ value, onChange, labels=ratingLabels5 }) {
  return (<div style={{display:"flex",gap:0,borderRadius:12,overflow:"hidden",border:"1px solid #2a2a4a"}}>
    {labels.map((label,i)=>{const val=i+1;const sel=value===val;return(
      <button key={val} type="button" onClick={()=>onChange(val)}
        style={{flex:1,padding:"10px 6px",fontSize:12,fontWeight:sel?700:400,color:sel?"#0d0d1a":"#8892b0",
          background:sel?"linear-gradient(135deg,#e8a849,#d4783a)":"rgba(20,20,40,0.6)",
          border:"none",cursor:"pointer",transition:"all 0.2s",fontFamily:"'Nunito',sans-serif",
          borderRight:i<labels.length-1?"1px solid #2a2a4a":"none"}}>{label}</button>
    );})}
  </div>);
}

function SurveyText({ value, onChange, placeholder, rows=3 }) {
  return <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}
    style={{width:"100%",padding:"14px 16px",borderRadius:12,border:"1px solid #2a2a4a",background:"rgba(15,15,30,0.7)",color:"#d0d8f0",fontSize:15,fontFamily:"'Nunito',sans-serif",resize:"vertical",outline:"none",lineHeight:1.6,boxSizing:"border-box"}}
    onFocus={e=>e.target.style.borderColor="#e8a849"} onBlur={e=>e.target.style.borderColor="#2a2a4a"}/>;
}

function SurveyInput({ value, onChange, placeholder, type="text" }) {
  return <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
    style={{width:"100%",padding:"12px 16px",borderRadius:12,border:"1px solid #2a2a4a",background:"rgba(15,15,30,0.7)",color:"#d0d8f0",fontSize:15,fontFamily:"'Nunito',sans-serif",outline:"none",boxSizing:"border-box"}}
    onFocus={e=>e.target.style.borderColor="#e8a849"} onBlur={e=>e.target.style.borderColor="#2a2a4a"}/>;
}

function SurveySelect({ value, onChange, options, placeholder }) {
  return (<select value={value} onChange={e=>onChange(e.target.value)}
    style={{width:"100%",padding:"12px 16px",borderRadius:12,border:"1px solid #2a2a4a",background:"rgba(15,15,30,0.85)",color:value?"#d0d8f0":"#6a7394",fontSize:15,fontFamily:"'Nunito',sans-serif",outline:"none",cursor:"pointer",boxSizing:"border-box"}}>
    <option value="" disabled>{placeholder}</option>
    {options.map(o=><option key={o} value={o}>{o}</option>)}
  </select>);
}

function SurveyCheckboxes({ options, selected, onChange }) {
  const toggle=opt=>onChange(selected.includes(opt)?selected.filter(s=>s!==opt):[...selected,opt]);
  return (<div style={{display:"flex",flexDirection:"column",gap:8}}>
    {options.map(opt=>{const ck=selected.includes(opt);return(
      <button key={opt} type="button" onClick={()=>toggle(opt)}
        style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:10,
          border:ck?"1px solid #e8a849":"1px solid #2a2a4a",background:ck?"rgba(232,168,73,0.1)":"rgba(15,15,30,0.5)",
          color:ck?"#e8d5b0":"#8892b0",cursor:"pointer",fontSize:14,fontFamily:"'Nunito',sans-serif",textAlign:"left",transition:"all 0.2s"}}>
        <span style={{width:20,height:20,borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",
          border:ck?"2px solid #e8a849":"2px solid #3a3a5c",background:ck?"#e8a849":"transparent",
          fontSize:13,color:"#0d0d1a",fontWeight:800,flexShrink:0}}>{ck?"✓":""}</span>
        {opt}
      </button>
    );})}
  </div>);
}

function SQ({ label, sublabel, required, children }) {
  return (<div style={{marginBottom:28}}>
    <label style={{display:"block",fontSize:16,fontWeight:600,color:"#e0e6f4",marginBottom:sublabel?4:10,lineHeight:1.5}}>
      {label}{required&&<span style={{color:"#e8a849",marginLeft:4}}>*</span>}
    </label>
    {sublabel&&<p style={{fontSize:13,color:"#6d7a9c",margin:"0 0 10px 0",lineHeight:1.5}}>{sublabel}</p>}
    {children}
  </div>);
}

const card = { background:"rgba(155,93,229,0.08)",border:"1px solid rgba(155,93,229,0.2)",borderRadius:14,padding:"14px 16px",cursor:"pointer",transition:"all 0.3s ease" };
const cardHov = { background:"rgba(155,93,229,0.15)",borderColor:"rgba(155,93,229,0.5)",transform:"translateY(-2px)",boxShadow:"0 8px 24px rgba(155,93,229,0.12)" };
const cardSel = { background:"rgba(155,93,229,0.2)",borderColor:"#9B5DE5",boxShadow:"0 0 16px rgba(155,93,229,0.25)" };
const btn = { background:"linear-gradient(135deg,#9B5DE5,#7B2FBF)",color:"#fff",border:"none",borderRadius:12,padding:"15px 28px",fontSize:16,fontFamily:F,fontWeight:600,cursor:"pointer",transition:"all 0.3s",width:"100%",letterSpacing:0.5 };
const btnSec = { background:"rgba(155,93,229,0.1)",color:"#c4a8e8",border:"1px solid rgba(155,93,229,0.25)",borderRadius:12,padding:"13px 20px",fontSize:15,fontFamily:F,cursor:"pointer",transition:"all 0.3s",width:"100%" };
const tag = { display:"inline-block",background:"rgba(155,93,229,0.12)",border:"1px solid rgba(155,93,229,0.25)",borderRadius:20,padding:"5px 12px",fontSize:12,fontFamily:M,marginRight:6,marginBottom:6 };
const xpBadge = { display:"inline-block",background:"rgba(255,200,50,0.1)",border:"1px solid rgba(255,200,50,0.25)",borderRadius:8,padding:"4px 10px",fontSize:11,fontFamily:M,color:"#ffc832" };
const hpBar = (pct,color="#9B5DE5") => ({width:`${pct}%`,height:"100%",background:`linear-gradient(90deg,${color},${color}cc)`,borderRadius:6,transition:"width 0.8s cubic-bezier(0.4,0,0.2,1)",boxShadow:`0 0 10px ${color}55`});

function Screen({ children, bg, kingdom }) {
  return (
    <div style={{width:"100%",minHeight:"100vh",background:bg||kingdom?.grad||"#06020e",fontFamily:F,color:"#e8e0f0",overflow:"hidden",position:"relative"}}>
      <Particles kingdom={kingdom}/>
      <div style={{maxWidth:440,margin:"0 auto",padding:"24px 20px",minHeight:"100vh",display:"flex",flexDirection:"column",position:"relative",zIndex:2}}>{children}</div>
    </div>
  );
}


// ══════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════
export default function InnerWorld() {
  const [scr,setScr]=useState("intro");
  const [fade,setFade]=useState(false);
  const [twDone,setTwDone]=useState(false);
  const [show,setShow]=useState(false);
  const [hov,setHov]=useState(null);
  const [introStep,setIntroStep]=useState(0);
  const [ans,setAns]=useState({emotions:[],intensity:50,trigger:null,person:null,meaning:null,truthRating:50,familiarity:null,onset:null,copingUrge:null,unmetNeed:null});
  const [narratives,setNarr]=useState({emotion:"",trigger:"",meaning:"",coping:"",need:""});
  const [entryPath,setEntry]=useState(null);
  const [result,setResult]=useState(null);
  const [disambQ,setDisambQ]=useState(null);
  const [safety,setSafety]=useState("OK");
  // Battle state
  const [mIdx,setMIdx]=useState(0);
  const [mStep,setMStep]=useState("appear");
  const [selDist,setSelDist]=useState(null);
  const [selRef,setSelRef]=useState(null);
  const [bossHp,setBossHp]=useState(100);
  const [bossPhase,setBossPhase]=useState("entry");
  const [evSel,setEvSel]=useState([]);
  const [socUsed,setSocUsed]=useState([]);
  const [activeSoc,setActiveSoc]=useState(null);
  const [postInt,setPostInt]=useState(3);
  const [xp,setXp]=useState(0);
  // Journal — pattern tracking system
  const [journal,setJournal]=useState([]); // {moment,thought,text,emotion,kingdom,timestamp}
  const [battleNarr,setBattleNarr]=useState({defuse:"",defuseJournal:"",trap:"",reframe:"",resolved:"",bossEntry:"",bossForge:"",postBattle:"",rerate:""});
  const logPattern = (moment,text,extra={}) => { if(!text?.trim()) return; setJournal(j=>[...j,{moment,text:text.trim(),timestamp:Date.now(),kingdom:K?.name,...extra}]); };
  // Grounding
  const [breathStep,setBreathStep]=useState(0);
  const [breathTimer,setBreathTimer]=useState(null);
  const [scanStep,setScanStep]=useState(0);
  // Mission goals
  const [missionGoals,setMissionGoals]=useState({short:"",medium:"",long:""});
  const [calTasks,setCalTasks]=useState([]);
  const [exportMsg,setExportMsg]=useState("");
  // Survey
  const [surveySection,setSurveySection]=useState(0);
  const [surveyFade,setSurveyFade]=useState(true);
  const [surveyData,setSurveyData]=useState({
    age:"",gender:"",mentalHealthFamiliarity:"",currentTools:[],currentToolsOther:"",
    firstReaction:"",conceptClarity:0,conceptAppeal:0,whatStoodOut:"",
    easeOfUse:0,navigationClarity:0,visualAppeal:0,confusingElements:"",
    favoriteFeatures:[],favoriteFeatureWhy:"",uniqueValue:0,wouldRecommend:0,
    frustratingParts:"",missingFeatures:"",improvementPriority:[],
    desiredFeatures:[],desiredFeaturesOther:"",featureIdeas:"",
    therapeuticRelevance:0,engagementLevel:0,safetyComfort:0,therapeuticFeedback:"",preferOverTraditional:0,
    purchaseIntent:0,priceExpectation:"",priceTooExpensive:"",priceBargain:"",subscriptionPreference:"",paymentFactors:[],
    overallRating:0,oneWordReaction:"",recommendLikelihood:0,additionalFeedback:"",contactEmail:"",wantUpdates:false,
  });
  const [surveySubmitted,setSurveySubmitted]=useState(false);
  const surveyUpdate=(k,v)=>setSurveyData(p=>({...p,[k]:v}));
  const surveyNav=(s)=>{setSurveyFade(false);setTimeout(()=>{setSurveySection(s);setSurveyFade(true);},250);};
  // Grounding
  const [groundMode,setGroundMode]=useState("breathe"); // "breathe" or "sensory"
  const [senseAnswers,setSenseAnswers]=useState({see:"",hear:"",touch:"",smell:"",taste:""});
  const [groundReflect,setGroundReflect]=useState("");

  const go = useCallback((next)=>{
    setFade(true); setTwDone(false); setShow(false);
    setTimeout(()=>{ setScr(next); setFade(false); setTimeout(()=>setShow(true),100); },500);
  },[]);
  useEffect(()=>{setTimeout(()=>setShow(true),300);},[]);

  // Export helpers
  const exportJournal = (format) => {
    if(!journal.length) return;
    const lines = journal.map(e => {
      const label = (e.moment||"").replace(/_/g," ").toUpperCase();
      const ctx = e.minion ? ` (${e.minion})` : e.boss ? ` (${e.boss})` : "";
      return `[${label}${ctx}]\n${e.text}\n`;
    }).join("\n");
    const header = `InnerWorlds — Session Journal\nKingdom: ${K?.name||"Unknown"}\nDate: ${new Date().toLocaleDateString()}\n${"─".repeat(40)}\n\n`;
    const goalsSection = Object.entries(missionGoals).filter(([,v])=>v.trim()).length ? 
      `\n${"─".repeat(40)}\nGOALS\n${missionGoals.short?.trim()?`Short-term: ${missionGoals.short}\n`:""}${missionGoals.medium?.trim()?`Medium-term: ${missionGoals.medium}\n`:""}${missionGoals.long?.trim()?`Long-term: ${missionGoals.long}\n`:""}` : "";
    const full = header + lines + goalsSection;
    if(format==="copy") {
      navigator.clipboard?.writeText(full).then(()=>{setExportMsg("Copied to clipboard ✓");setTimeout(()=>setExportMsg(""),2500);}).catch(()=>setExportMsg("Copy failed"));
    } else {
      const blob = new Blob([full],{type:"text/plain"});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href=url; a.download=`innerworld-journal-${new Date().toISOString().slice(0,10)}.txt`; a.click();
      URL.revokeObjectURL(url);
      setExportMsg("Downloaded ✓"); setTimeout(()=>setExportMsg(""),2500);
    }
  };
  const addToCalendar = () => {
    const items = [];
    calTasks.forEach(t => items.push(`${t.name}: ${t.desc}`));
    if(missionGoals.short?.trim()) items.push(`Short-term: ${missionGoals.short}`);
    if(missionGoals.medium?.trim()) items.push(`Medium-term: ${missionGoals.medium}`);
    if(missionGoals.long?.trim()) items.push(`Long-term: ${missionGoals.long}`);
    if(!items.length) return;
    const title = encodeURIComponent(`InnerWorlds: ${K?.name||"Schema Quest"} Experiments`);
    const details = encodeURIComponent(items.join("\n\n"));
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate()+1); tomorrow.setHours(9,0,0,0);
    const start = tomorrow.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}/,"");
    const end = new Date(tomorrow.getTime()+3600000).toISOString().replace(/[-:]/g,"").replace(/\.\d{3}/,"");
    window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${start}/${end}`,"_blank");
  };
  const addToReminders = () => {
    const items = [];
    calTasks.forEach(t => items.push(`☐ ${t.name}: ${t.desc}`));
    if(missionGoals.short?.trim()) items.push(`☐ Short-term: ${missionGoals.short}`);
    if(missionGoals.medium?.trim()) items.push(`☐ Medium-term: ${missionGoals.medium}`);
    if(missionGoals.long?.trim()) items.push(`☐ Long-term: ${missionGoals.long}`);
    if(!items.length) return;
    const text = `InnerWorlds Experiments — ${K?.name||"Schema Quest"}\n${new Date().toLocaleDateString()}\n\n${items.join("\n")}`;
    navigator.clipboard?.writeText(text).then(()=>{setExportMsg("Reminders copied ✓ — Paste into your reminders app");setTimeout(()=>setExportMsg(""),3000);}).catch(()=>setExportMsg("Copy failed"));
  };

  // Survey data collection — bundles ALL session data with survey responses
  const collectAllData = () => {
    return {
      timestamp: new Date().toISOString(),
      sessionData: {
        kingdom: K?.name||"Unknown",
        schema: result?.pk||"Unknown",
        initialIntensity: ans.intensity,
        postIntensity: postInt,
        intensityDelta: ans.intensity - postInt,
        xpEarned: xp+25,
        journalEntryCount: journal.length,
        experimentsSelected: calTasks.map(t=>t.name),
        goals: missionGoals,
      },
      journal: journal.map(e=>({moment:e.moment,text:e.text,minion:e.minion,boss:e.boss})),
      surveyResponses: surveyData,
    };
  };
  const submitSurvey = (method) => {
    const payload = collectAllData();
    if(method==="download") {
      const blob = new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a");a.href=url;a.download=`innerworlds-feedback-${new Date().toISOString().slice(0,10)}.json`;a.click();
      URL.revokeObjectURL(url);
      setSurveySubmitted(true); surveyNav(10);
    } else if(method==="copy") {
      navigator.clipboard?.writeText(JSON.stringify(payload,null,2)).then(()=>{
        setSurveySubmitted(true); surveyNav(10);
      });
    } else if(method==="webhook") {
      // Google Sheets via GET request
      const SHEETS_URL = "https://script.google.com/macros/s/AKfycbx8hqJikxkhocvxWDTW-7vlcS9I9kAN6g3X59jJZf31oa36-8OzEgkqS-aIYp6RdoKD/exec";
      const img = new Image();
      img.src = SHEETS_URL + "?payload=" + encodeURIComponent(JSON.stringify(payload));
      setSurveySubmitted(true); surveyNav(10);
    }
    // Also log to console for development
    console.log("InnerWorlds Survey Data:",payload);
  };

  // Grounding breathing timer — top level to avoid conditional hook
  const groundPhases = ["Get comfortable...","Breathe in... 4 seconds","Hold... 4 seconds","Breathe out... 6 seconds","Breathe in...","Hold...","Breathe out slowly...","Now notice one thing you can see.","Notice one thing you can hear.","One thing you can feel with your hands."];
  const groundDurations = [2000,4000,4000,6000,4000,4000,6000,4000,4000,4000];
  useEffect(()=>{
    if(scr!=="grounding" || groundMode!=="breathe") return;
    setBreathStep(0);
    let step=0;
    let timer=null;
    function advance(){
      if(step<groundPhases.length-1){step++;setBreathStep(step);
        timer=setTimeout(advance,groundDurations[step]||4000);
      }
    }
    timer=setTimeout(advance,groundDurations[0]);
    return ()=>{if(timer)clearTimeout(timer);};
  },[scr,groundMode]);

  // TPGE scan animation timer — top level to avoid conditional hook
  const scanSteps=["Analyzing trigger context","Mapping emotional signature","Scanning schema patterns","Classifying mode state","Generating encounter profile","Kingdom identified"];
  useEffect(()=>{
    if(scr!=="tpge_scan") return;
    setScanStep(0);
    const timers=scanSteps.map((_,i)=>setTimeout(()=>{setScanStep(i);if(i===scanSteps.length-1)setTimeout(()=>go("fit_check"),900);},i*650));
    return ()=>timers.forEach(clearTimeout);
  },[scr]);

  const addXp = n => setXp(x=>x+n);
  const K = result?.kingdom || KINGDOMS.DF;

  // ═══════════════════════════════════════
  // IMMERSIVE INTRO — Kai guides you through
  // ═══════════════════════════════════════
  if(scr==="intro") {
    const WF = "'Fraunces','Playfair Display',Georgia,serif";
    const WS = "'DM Sans','Crimson Pro',sans-serif";
    const warmCard = { background:"rgba(255,255,255,0.65)", backdropFilter:"blur(12px)", border:"1px solid rgba(123,166,142,0.2)", borderRadius:16, padding:"24px 24px", marginBottom:0, animation:"warmFadeUp 0.7s ease both" };
    const warmBtn = { display:"inline-block", padding:"15px 36px", background:"#1A4A4A", color:"#FDF6EC", fontFamily:WF, fontSize:"1.05rem", fontWeight:500, border:"none", borderRadius:14, cursor:"pointer", transition:"transform 0.2s, box-shadow 0.2s", boxShadow:"0 4px 24px rgba(26,74,74,0.2)", letterSpacing:0.3 };
    const warmBtnSec = { ...warmBtn, background:"transparent", color:"#1A4A4A", border:"1px solid rgba(26,74,74,0.2)", boxShadow:"none", padding:"12px 28px", fontSize:"0.95rem" };
    const dot = (color) => ({ width:8, height:8, borderRadius:"50%", background:color, flexShrink:0 });
    const label = (color) => ({ display:"inline-flex", alignItems:"center", gap:8, fontSize:12, fontWeight:600, letterSpacing:0.8, textTransform:"uppercase", color, marginBottom:12 });

    const kaiMessages = [
      null,
      "Hey — I'm Kai, your guide. InnerWorlds turns therapeutic skills into a game. You'll face your thinking patterns as opponents and practice real strategies to respond to them.",
      "This draws from three proven approaches. Schema Therapy looks at deep emotional patterns shaped by your life. Narrative Experiential Therapy helps you externalize and reauthor those patterns. And CBT gives you practical tools to catch thinking traps in the moment.",
      "What you're about to enter is the foundation of something much bigger. And one thing before we go in — your comfort always comes first.",
      "Ready? You'll start by telling me what's on your mind.",
    ];

    const kaiMoods = [null,"wave","think","happy","happy"];
    const nextIntro = () => { setTwDone(false); setIntroStep(s=>s+1); };

    return (
      <div style={{width:"100%",minHeight:"100vh",background:"#FDF6EC",fontFamily:WS,color:"#2C3E3E",overflow:"hidden",position:"relative"}}>
        {/* Ambient orbs */}
        <div style={{position:"fixed",inset:0,zIndex:0,overflow:"hidden",pointerEvents:"none"}}>
          <div style={{position:"absolute",width:400,height:400,borderRadius:"50%",filter:"blur(80px)",opacity:0.3,background:"#7BA68E",top:"-10%",right:"-5%",animation:"warmDrift 20s ease-in-out infinite alternate"}}/>
          <div style={{position:"absolute",width:350,height:350,borderRadius:"50%",filter:"blur(80px)",opacity:0.3,background:"#9B8EC4",bottom:"10%",left:"-8%",animation:"warmDrift 20s ease-in-out infinite alternate",animationDelay:"-7s"}}/>
          <div style={{position:"absolute",width:250,height:250,borderRadius:"50%",filter:"blur(80px)",opacity:0.2,background:"#E8A854",top:"50%",right:"20%",animation:"warmDrift 20s ease-in-out infinite alternate",animationDelay:"-14s"}}/>
        </div>

        <div style={{position:"relative",zIndex:1,maxWidth:560,margin:"0 auto",padding:"40px 24px 80px",minHeight:"100vh",display:"flex",flexDirection:"column"}}>

          {/* ─── STEP 0: TITLE ─── */}
          {introStep===0 && <>
            <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
              <div style={{animation:"warmFadeUp 0.8s ease both"}}>
                <div style={{display:"inline-block",background:"#1A4A4A",color:"#FDF6EC",fontSize:11,fontWeight:600,letterSpacing:1.5,textTransform:"uppercase",padding:"6px 16px",borderRadius:20,marginBottom:24}}>Early Prototype</div>
              </div>
              <h1 style={{fontFamily:WF,fontWeight:700,fontSize:"clamp(2.2rem,5vw,3rem)",color:"#1A4A4A",lineHeight:1.15,marginBottom:12,animation:"warmFadeUp 0.8s ease 0.15s both"}}>
                InnerWorlds
                <span style={{display:"block",fontWeight:300,fontStyle:"italic",fontSize:"0.55em",color:"#7BA68E",marginTop:4}}>The Schema Quest</span>
              </h1>
              <p style={{fontSize:"1.05rem",color:"#5A6E6E",lineHeight:1.6,maxWidth:440,margin:"0 auto 28px",animation:"warmFadeUp 0.8s ease 0.3s both"}}>
                Before you step inside, your guide would like a quick word.
              </p>
              <div style={{animation:"warmFadeUp 0.8s ease 0.6s both",marginBottom:28}}>
                <div style={{width:100,height:133,margin:"0 auto",borderRadius:20,background:"radial-gradient(circle at 50% 40%, rgba(93,156,232,0.12), rgba(26,74,74,0.06))",display:"flex",alignItems:"center",justifyContent:"center",animation:"warmGlow 4s ease-in-out infinite"}}>
                  <KaiChar mood="wave" size={80}/>
                </div>
              </div>
              <div style={{animation:"warmFadeUp 0.8s ease 0.9s both"}}>
                <button style={warmBtn} onClick={nextIntro}>Meet Kai →</button>
              </div>
              <p style={{fontSize:"0.82rem",color:"#5A6E6E",marginTop:12,opacity:0.6,animation:"warmFadeUp 0.8s ease 1s both"}}>Takes about 1 minute</p>
            </div>
          </>}

          {/* ─── STEPS 1–4: KAI GUIDED ─── */}
          {introStep>=1 && introStep<=4 && <>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:24,animation:"warmFadeUp 0.5s ease both"}}>
              {[1,2,3,4].map(i=>(
                <div key={i} style={{flex:1,height:3,borderRadius:2,background:i<=introStep?"#1A4A4A":"rgba(26,74,74,0.1)",transition:"background 0.4s"}}/>
              ))}
            </div>

            <div style={{display:"flex",gap:14,alignItems:"flex-start",marginBottom:20,animation:"warmFadeUp 0.6s ease both"}}>
              <div style={{flexShrink:0,width:60,height:80,borderRadius:14,background:"radial-gradient(circle at 50% 40%, rgba(93,156,232,0.1), rgba(26,74,74,0.04))",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <KaiChar mood={kaiMoods[introStep]||"idle"} size={48}/>
              </div>
              <div style={{flex:1,background:"rgba(26,74,74,0.04)",border:"1px solid rgba(26,74,74,0.1)",borderRadius:16,padding:"14px 16px"}}>
                <p style={{fontSize:11,fontWeight:600,letterSpacing:0.8,textTransform:"uppercase",color:"#1A4A4A",margin:"0 0 6px",opacity:0.5}}>Coach Kai</p>
                <div style={{fontSize:15,lineHeight:1.65,color:"#2C3E3E"}}>
                  <Typewriter key={`intro-${introStep}`} text={kaiMessages[introStep]} speed={14} onDone={()=>setTwDone(true)} style={{color:"#2C3E3E"}}/>
                </div>
              </div>
            </div>

            {twDone && <>
              {/* STEP 1: What is this + how to play */}
              {introStep===1 && <div style={{...warmCard, animationDelay:"0.1s"}}>
                <div style={label("#1A4A4A")}><span style={dot("#1A4A4A")}/> How it works</div>
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  {[
                    {n:1,t:"You'll encounter thought patterns as opponents — things like catastrophizing or all-or-nothing thinking."},
                    {n:2,t:"You'll choose responses to challenge them — reframing, finding evidence, or practicing self-compassion."},
                    {n:3,t:"No wrong answers. It's about building awareness of what works for you."}
                  ].map(s=>(
                    <div key={s.n} style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                      <div style={{flexShrink:0,width:26,height:26,borderRadius:"50%",background:"#1A4A4A",color:"#FDF6EC",fontFamily:WF,fontWeight:500,fontSize:"0.8rem",display:"flex",alignItems:"center",justifyContent:"center",marginTop:1}}>{s.n}</div>
                      <p style={{flex:1,fontSize:"0.93rem",lineHeight:1.55,color:"#5A6E6E",margin:0}}>{s.t}</p>
                    </div>
                  ))}
                </div>
              </div>}

              {/* STEP 2: Science — Schema → Narrative Experiential → CBT */}
              {introStep===2 && <div style={{...warmCard, animationDelay:"0.1s"}}>
                <div style={label("#7BA68E")}><span style={dot("#7BA68E")}/> The science</div>
                <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:4}}>
                  {[
                    {l:"Schema Therapy",c:"#9B8EC4",d:"Identifies deep emotional patterns — core beliefs shaped by early life that drive how you think, feel, and react today."},
                    {l:"Narrative Experiential Therapy",c:"#E8A854",d:"Helps you externalize inner patterns as characters you can observe and dialogue with, rather than forces that control you."},
                    {l:"Cognitive Behavioral Therapy",c:"#7BA68E",d:"Practical tools for catching thinking traps — distortions like catastrophizing, mind reading, and all-or-nothing thinking."}
                  ].map(t=>(
                    <div key={t.l} style={{padding:"12px 14px",background:`${t.c}10`,border:`1px solid ${t.c}20`,borderRadius:10}}>
                      <div style={{fontSize:13,fontWeight:600,color:t.c,marginBottom:3}}>{t.l}</div>
                      <div style={{fontSize:12,color:"#5A6E6E",lineHeight:1.5}}>{t.d}</div>
                    </div>
                  ))}
                </div>
              </div>}

              {/* STEP 3: Vision + safety */}
              {introStep===3 && <>
                <div style={{...warmCard, animationDelay:"0.1s", border:"1px solid rgba(155,142,196,0.2)", background:"rgba(155,142,196,0.04)"}}>
                  <div style={label("#9B8EC4")}><span style={dot("#9B8EC4")}/> The vision</div>
                  <p style={{fontSize:"0.95rem",lineHeight:1.65,color:"#2C3E3E",margin:"0 0 12px"}}>
                    Right now, this is a prototype — a proof of concept. Where it's going is something different entirely.
                  </p>
                  <p style={{fontSize:"0.93rem",lineHeight:1.65,color:"#5A6E6E",margin:"0 0 14px"}}>
                    The full version of InnerWorlds will be a living, immersive 3D world — landscapes that shift as you heal, kingdoms that transform as you grow. You won't navigate it alone. AI-powered coaches like me will walk beside you, adapting in real time to what you need, remembering where you've been, and meeting you exactly where you are.
                  </p>
                  <div style={{display:"flex",gap:8}}>
                    {[{e:"🌍",t:"Immersive worlds"},{e:"🤖",t:"AI coaches"},{e:"📈",t:"Adaptive growth"}].map(v=>(
                      <div key={v.t} style={{flex:1,textAlign:"center",padding:"10px 6px",background:"rgba(155,142,196,0.08)",borderRadius:10,border:"1px solid rgba(155,142,196,0.12)"}}>
                        <div style={{fontSize:18,marginBottom:3}}>{v.e}</div>
                        <div style={{fontSize:11,color:"#9B8EC4",fontWeight:500}}>{v.t}</div>
                      </div>
                    ))}
                  </div>
                  <p style={{fontSize:"0.82rem",color:"#9B8EC4",margin:"12px 0 0",opacity:0.7}}>What you test today shapes what gets built tomorrow.</p>
                </div>
                <div style={{...warmCard, background:"rgba(212,144,138,0.06)", border:"1px solid rgba(212,144,138,0.2)", animationDelay:"0.25s", marginTop:14}}>
                  <div style={label("#D4908A")}><span style={dot("#D4908A")}/> Your wellbeing</div>
                  <p style={{fontSize:"0.93rem",lineHeight:1.6,color:"#5A6E6E",margin:"0 0 12px"}}>If anything feels too much, step away anytime. If you need support:</p>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    <div style={{padding:"10px 16px",background:"#D4908A",color:"white",fontSize:"0.88rem",fontWeight:600,borderRadius:10,textAlign:"center"}}>
                      988 Suicide & Crisis Lifeline — Call or text 988
                    </div>
                    <div style={{padding:"10px 16px",background:"rgba(212,144,138,0.08)",border:"1px solid rgba(212,144,138,0.2)",borderRadius:10,fontSize:"0.88rem",color:"#D4908A",fontWeight:500,textAlign:"center"}}>
                      Crisis Text Line — Text HOME to 741741
                    </div>
                  </div>
                </div>
              </>}

              {/* STEP 4: Gateway */}
              {introStep===4 && <div style={{textAlign:"center",animation:"warmFadeUp 0.6s ease both"}}>
                <div style={{margin:"10px auto 24px",position:"relative",width:160,height:160}}>
                  <div style={{position:"absolute",inset:0,borderRadius:"50%",background:"radial-gradient(circle, rgba(155,93,229,0.15), rgba(26,74,74,0.05))",animation:"gatewayPulse 3s ease-in-out infinite"}}/>
                  <div style={{position:"absolute",inset:10,borderRadius:"50%",border:"1.5px solid rgba(155,93,229,0.3)",animation:"orbit 10s linear infinite"}}/>
                  <div style={{position:"absolute",inset:20,borderRadius:"50%",border:"1px solid rgba(155,93,229,0.15)",animation:"orbit 15s linear infinite reverse"}}/>
                  <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <span style={{fontSize:48,filter:"drop-shadow(0 0 20px rgba(155,93,229,0.4))",animation:"warmPulse 3s ease-in-out infinite"}}>✧</span>
                  </div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:10,maxWidth:280,margin:"0 auto"}}>
                  <button style={{...warmBtn,width:"100%",background:"linear-gradient(135deg,#1A4A4A,#2a6a6a)"}} onClick={()=>{
                    setFade(true); setShow(false);
                    setTimeout(()=>{
                      setScr("portal"); setIntroStep(0); setFade(false); setTwDone(false);
                      setTimeout(()=>setShow(true),200);
                    },800);
                  }}>Begin the Quest →</button>
                  <p style={{fontSize:"0.82rem",color:"#5A6E6E",opacity:0.6}}>Takes about 5–10 minutes</p>
                </div>
              </div>}

              {/* Continue / Skip (steps 1-3) */}
              {introStep<4 && <div style={{marginTop:16,display:"flex",gap:10,animation:"warmFadeUp 0.5s ease 0.2s both"}}>
                <button style={{...warmBtnSec,flex:1}} onClick={()=>{
                  if(introStep>=3){ setFade(true); setShow(false); setTimeout(()=>{ setScr("portal"); setFade(false); setTwDone(false); setTimeout(()=>setShow(true),200); },600); }
                  else { setIntroStep(4); setTwDone(false); }
                }}>Skip</button>
                <button style={{...warmBtn,flex:2}} onClick={nextIntro}>Continue →</button>
              </div>}
            </>}
          </>}

          {/* Footer */}
          {introStep===0 && <div style={{textAlign:"center",marginTop:"auto",paddingTop:24}}/>}
        </div>

        {/* Fade overlay for transition to dark portal */}
        <div style={{position:"fixed",inset:0,background:"#06020e",zIndex:100,opacity:fade?1:0,pointerEvents:fade?"all":"none",transition:"opacity 0.8s ease"}}/>
      </div>
    );
  }


  // ═══════════════════════════════════════
  // PORTAL
  // ═══════════════════════════════════════
  if(scr==="portal") return (
    <Screen><div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",opacity:fade?0:1,transition:"opacity 0.5s"}}>
      <div style={{textAlign:"center",animation:"fadeUp 0.6s ease 0.1s both"}}>
        <div style={{position:"relative",display:"inline-block"}}>
          <div style={{width:100,height:100,borderRadius:"50%",background:"radial-gradient(circle,rgba(155,93,229,0.2),transparent)",display:"flex",alignItems:"center",justifyContent:"center",animation:"pulse 3s ease-in-out infinite",margin:"0 auto 20px",border:"1px solid rgba(155,93,229,0.2)"}}>
            <span style={{fontSize:44,filter:"drop-shadow(0 0 20px rgba(155,93,229,0.5))"}}>✧</span>
          </div>
          <div style={{position:"absolute",inset:-15,borderRadius:"50%",border:"1px solid rgba(155,93,229,0.1)",animation:"orbit 8s linear infinite"}}/>
        </div>
      </div>
      <div style={{textAlign:"center",animation:"fadeUp 0.6s ease 0.3s both"}}>
        <p style={{fontSize:12,fontFamily:M,color:"rgba(255,255,255,0.35)",letterSpacing:1.5,textTransform:"uppercase",margin:"0 0 6px"}}>InnerWorlds</p>
        <h1 style={{fontFamily:D,fontSize:30,fontWeight:700,letterSpacing:-0.5,margin:"0 0 4px"}}>The Schema Quest</h1>
        <p style={{fontSize:11,color:"rgba(255,255,255,0.2)",fontFamily:M}}>Therapeutic Battle Arena</p>
      </div>
      <div style={{margin:"24px 0 20px"}}>
        <CoachBubble name="Kai" mood="wave" delay={0.6}>
          {show && <Typewriter text={journal.length>0 ? "Hey. Welcome back. What brings you in today?" : "Good. You made it through. This is the portal — your starting point. What brings you in today?"} speed={28} onDone={()=>setTwDone(true)}/>}
        </CoachBubble>
      </div>
      {twDone && <div style={{display:"flex",flexDirection:"column",gap:10,animation:"fadeUp 0.5s ease both"}}>
        <div style={{...card,...(hov==="ep0"?cardHov:{borderColor:"rgba(155,93,229,0.4)",background:"rgba(155,93,229,0.12)"}),display:"flex",alignItems:"center",gap:12,animation:"fadeUp 0.4s ease 0.1s both",cursor:"pointer"}}
          onClick={()=>go("q_emotion")} onMouseEnter={()=>setHov("ep0")} onMouseLeave={()=>setHov(null)}>
          <span style={{fontSize:22}}>💭</span>
          <div><div style={{fontSize:15,fontWeight:600}}>Something's on my mind</div><div style={{fontSize:11,color:"rgba(255,255,255,0.3)",fontFamily:M}}>Full assessment → battle</div></div>
        </div>
      </div>}
    </div></Screen>
  );

  // ═══════════════════════════════════════
  // Q1: EMOTIONS — Statements with adaptive response
  // ═══════════════════════════════════════
  if(scr==="q_emotion") return (
    <Screen><div style={{opacity:fade?0:1,transition:"opacity 0.5s"}}>
      <div style={{fontSize:10,fontFamily:M,color:"rgba(255,255,255,0.15)",letterSpacing:1,marginBottom:16}}>STEP 1 / 10</div>
      <CoachBubble name="Kai" mood={ans.emotions.length?"think":"idle"} delay={0.1}>
        {show && !ans.emotions.length && <Typewriter text="Let's start with what's alive in you right now. Pick what fits — up to three." speed={25}/>}
        {ans.emotions.length>0 && <span>{COACH_RESPONSES.emotion[ans.emotions[ans.emotions.length-1]]?.kai || "That's useful information. Let's keep going."}</span>}
      </CoachBubble>
      {ans.emotions.length>0 && <ScienceNote text={COACH_RESPONSES.emotion[ans.emotions[ans.emotions.length-1]]?.science}/>}
      <p style={{fontSize:18,fontFamily:D,fontWeight:600,margin:"20px 0 4px"}}>What's the strongest feeling right now?</p>
      <p style={{fontSize:12,color:"rgba(255,255,255,0.3)",fontFamily:M,margin:"0 0 12px"}}>Select up to 3</p>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {Object.keys(EMO_S).map((e,i)=>{
          const sel=ans.emotions.includes(e);
          return <div key={e} style={{...card,...(sel?cardSel:hov===`e${i}`?cardHov:{}),display:"flex",alignItems:"center",gap:10,animation:`fadeUp 0.3s ease ${0.04*i}s both`}}
            onClick={()=>setAns(p=>({...p,emotions:sel?p.emotions.filter(x=>x!==e):p.emotions.length<3?[...p.emotions,e]:p.emotions}))}
            onMouseEnter={()=>setHov(`e${i}`)} onMouseLeave={()=>setHov(null)}>
            <span style={{fontSize:14,width:18,textAlign:"center"}}>{sel?"☑":"☐"}</span><span style={{fontSize:15}}>{e}</span>
          </div>;
        })}
      </div>
      <NarrativeBox value={narratives.emotion} onChange={v=>setNarr(p=>({...p,emotion:v}))} placeholder="Want to say more about what you're feeling?"/>
      {ans.emotions.length>0 && <button style={{...btn,marginTop:14}} onClick={()=>go("q_intensity")}>Continue →</button>}
    </div></Screen>
  );

  // ═══════════════════════════════════════
  // Q2: INTENSITY
  // ═══════════════════════════════════════
  if(scr==="q_intensity") return (
    <Screen><div style={{opacity:fade?0:1,transition:"opacity 0.5s"}}>
      <div style={{fontSize:10,fontFamily:M,color:"rgba(255,255,255,0.15)",letterSpacing:1,marginBottom:16}}>STEP 2 / 10</div>
      <CoachBubble name="Kai" mood="idle" delay={0.1}>
        {show && <Typewriter text="How strong is that feeling right now? Not what you think it should be — what it actually is." speed={25}/>}
      </CoachBubble>
      <div style={{textAlign:"center",marginTop:32,animation:"fadeUp 0.5s ease 0.4s both"}}>
        <div style={{fontSize:56,fontFamily:D,fontWeight:700,color:ans.intensity>=80?"#e85d5d":ans.intensity>=50?"#e8a85d":"#9B5DE5",transition:"color 0.3s",textShadow:`0 0 30px ${ans.intensity>=80?"rgba(232,93,93,0.3)":"rgba(155,93,229,0.3)"}`}}>{ans.intensity}</div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"rgba(255,255,255,0.25)",fontFamily:M,margin:"8px 0",maxWidth:300,marginLeft:"auto",marginRight:"auto"}}><span>barely there</span><span>overwhelming</span></div>
        <input type="range" min={0} max={100} value={ans.intensity} onChange={e=>setAns(p=>({...p,intensity:+e.target.value}))}
          style={{width:"100%",maxWidth:300,height:6,WebkitAppearance:"none",background:"rgba(155,93,229,0.2)",borderRadius:4,outline:"none",cursor:"pointer"}}/>
      </div>
      <div style={{marginTop:20}}>
        <CoachBubble name="Kai" mood={ans.intensity>=80?"think":"idle"} showChar={false}>
          {ans.intensity>=80 ? "That's a strong signal. I want to check in with you before we go deeper."
           : ans.intensity>=40 ? "That's definitely present. Enough to work with."
           : "Catching it early is a skill. Let's keep going."}
        </CoachBubble>
      </div>
      <button style={{...btn,marginTop:16}} onClick={()=>ans.intensity>=80?go("arousal"):go("q_trigger")}>Continue →</button>
    </div></Screen>
  );

  // ═══════════════════════════════════════
  // AROUSAL GATE
  // ═══════════════════════════════════════
  if(scr==="arousal") return (
    <Screen><div style={{opacity:fade?0:1,transition:"opacity 0.5s"}}>
      <CoachBubble name="Kai" mood="think" delay={0.1}>
        {show && <Typewriter text="Before we go further — do you want the full arena, or a 90-second grounding round first? Both are real work." speed={22} onDone={()=>setTwDone(true)}/>}
      </CoachBubble>
      {twDone && <div style={{display:"flex",gap:12,marginTop:20,animation:"fadeUp 0.4s ease both"}}>
        <div style={{...card,flex:1,textAlign:"center",...(hov==="af"?cardHov:{}),padding:"18px 12px"}} onClick={()=>go("q_trigger")} onMouseEnter={()=>setHov("af")} onMouseLeave={()=>setHov(null)}>
          <div style={{fontSize:26,marginBottom:6}}>⚔️</div><div style={{fontSize:14,fontWeight:600}}>Full Battle</div><div style={{fontSize:11,color:"rgba(255,255,255,0.3)"}}>"I'm ready"</div>
        </div>
        <div style={{...card,flex:1,textAlign:"center",...(hov==="ag"?cardHov:{}),padding:"18px 12px"}} onClick={()=>{setBreathStep(0);setGroundMode("breathe");setSenseAnswers({see:"",hear:"",touch:"",smell:"",taste:""});setGroundReflect("");go("grounding");}} onMouseEnter={()=>setHov("ag")} onMouseLeave={()=>setHov(null)}>
          <div style={{fontSize:26,marginBottom:6}}>🧘</div><div style={{fontSize:14,fontWeight:600}}>Grounding</div><div style={{fontSize:11,color:"rgba(255,255,255,0.3)"}}>90 seconds</div>
        </div>
      </div>}
    </div></Screen>
  );

  // ═══════════════════════════════════════
  // GROUNDING — immersive breathing + sensory
  // ═══════════════════════════════════════
  if(scr==="grounding") {
    const phaseType = breathStep<1?"ready":breathStep<=6?(breathStep%3===1?"in":breathStep%3===2?"hold":"out"):"sense";
    const circleScale = phaseType==="in"?1.35:phaseType==="hold"?1.35:phaseType==="out"?0.75:1;
    const circleColor = phaseType==="in"?"rgba(93,229,200,0.35)":phaseType==="hold"?"rgba(93,200,229,0.3)":phaseType==="out"?"rgba(155,93,229,0.25)":"rgba(93,229,200,0.2)";

    const sensePrompts = [
      {key:"see",n:5,icon:"👁️",label:"SEE",prompt:"Name 5 things you can see right now."},
      {key:"hear",n:4,icon:"👂",label:"HEAR",prompt:"Name 4 things you can hear."},
      {key:"touch",n:3,icon:"✋",label:"TOUCH",prompt:"Name 3 things you can physically feel."},
      {key:"smell",n:2,icon:"🌸",label:"SMELL",prompt:"Name 2 things you can smell (or imagine smelling)."},
      {key:"taste",n:1,icon:"👅",label:"TASTE",prompt:"Name 1 thing you can taste (or the taste in your mouth now)."},
    ];

    return (
      <Screen><div style={{opacity:fade?0:1,transition:"opacity 0.5s",flex:1,display:"flex",flexDirection:"column"}}>
        <div style={{fontSize:12,fontFamily:M,color:"rgba(93,229,200,0.5)",letterSpacing:1.5,textAlign:"center",marginBottom:16}}>🧘 GROUNDING</div>

        {/* Mode selector */}
        {breathStep===0 && groundMode==="breathe" && <div style={{display:"flex",gap:8,marginBottom:16,animation:"fadeUp 0.4s ease both"}}>
          <div style={{...card,flex:1,textAlign:"center",borderColor:groundMode==="breathe"?"rgba(93,229,200,0.3)":"rgba(255,255,255,0.06)",background:groundMode==="breathe"?"rgba(93,229,200,0.06)":"transparent",cursor:"pointer"}} onClick={()=>setGroundMode("breathe")}>
            <div style={{fontSize:20,marginBottom:4}}>🌊</div>
            <div style={{fontSize:13,fontWeight:600}}>Breathing</div>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.25)",fontFamily:M}}>4-4-6 pattern · 90s</div>
          </div>
          <div style={{...card,flex:1,textAlign:"center",borderColor:groundMode==="sensory"?"rgba(93,229,200,0.3)":"rgba(255,255,255,0.06)",background:groundMode==="sensory"?"rgba(93,229,200,0.06)":"transparent",cursor:"pointer"}} onClick={()=>setGroundMode("sensory")}>
            <div style={{fontSize:20,marginBottom:4}}>🔍</div>
            <div style={{fontSize:13,fontWeight:600}}>5-4-3-2-1 Sensory</div>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.25)",fontFamily:M}}>Grounding technique</div>
          </div>
        </div>}

        {/* BREATHING MODE */}
        {groundMode==="breathe" && <>
          <div style={{textAlign:"center",margin:"8px 0 20px"}}>
            <div style={{width:160,height:160,margin:"0 auto",borderRadius:"50%",border:`2px solid ${circleColor}`,display:"flex",alignItems:"center",justifyContent:"center",background:`radial-gradient(circle,${circleColor},transparent)`,transform:`scale(${circleScale})`,transition:"all 2.5s ease-in-out",boxShadow:`0 0 ${circleScale>1?"50":"20"}px ${circleColor}`}}>
              <span style={{fontSize:14,fontFamily:M,color:"#5de8c4",letterSpacing:0.5,textAlign:"center",padding:16,transition:"opacity 0.5s"}}>
                {groundPhases[breathStep]}
              </span>
            </div>
          </div>
          {/* Progress ring */}
          <div style={{display:"flex",justifyContent:"center",gap:4,marginBottom:16}}>
            {groundPhases.map((_,i)=><div key={i} style={{width:i<=breathStep?8:5,height:i<=breathStep?8:5,borderRadius:"50%",background:i<breathStep?"#5de8c4":i===breathStep?"rgba(93,229,200,0.8)":"rgba(93,229,200,0.12)",transition:"all 0.4s",boxShadow:i===breathStep?"0 0 8px rgba(93,229,200,0.4)":"none"}}/>)}
          </div>
          <CoachBubble name="Zen" mood="idle" showChar={false}>
            {breathStep===0 ? "Choose your grounding technique, or start breathing. Let each breath be slower than the last."
             : breathStep<=3 ? "Follow the circle. Your nervous system is listening."
             : breathStep<=6 ? "Good. Each cycle widens your window of tolerance — the zone where you can think clearly."
             : breathStep<=8 ? "Now anchor to your senses. This pulls you out of the thought loop and into the present."
             : "You're here. Right now. Not in the story — in this moment."}
          </CoachBubble>
          <ScienceNote text={breathStep<=6
            ? "Slow breathing activates the vagus nerve, shifting your nervous system from fight-or-flight (sympathetic) to rest-and-digest (parasympathetic). The extended exhale is key — it directly stimulates vagal tone."
            : "Sensory grounding (5-4-3-2-1) activates the prefrontal cortex and interrupts amygdala hijack. Naming what you perceive pulls attention from internal threat narratives to present-moment reality."}/>
        </>}

        {/* SENSORY MODE */}
        {groundMode==="sensory" && <>
          <CoachBubble name="Zen" mood="idle" showChar={false}>
            <span>The 5-4-3-2-1 technique anchors you to right now. Go through each sense — there's no wrong answer.</span>
          </CoachBubble>
          <ScienceNote text="Sensory grounding activates the prefrontal cortex, interrupting amygdala-driven threat responses. Naming sensory input shifts the brain from rumination mode to present-moment processing."/>
          <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:12}}>
            {sensePrompts.map((s,i)=>(
              <div key={s.key} style={{animation:`fadeUp 0.3s ease ${0.08*i}s both`}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                  <span style={{fontSize:16}}>{s.icon}</span>
                  <span style={{fontSize:10,fontFamily:M,color:"#5de8c4",letterSpacing:1}}>{s.n} — {s.label}</span>
                </div>
                <textarea value={senseAnswers[s.key]} onChange={e=>setSenseAnswers(p=>({...p,[s.key]:e.target.value}))}
                  placeholder={s.prompt} maxLength={200}
                  style={{width:"100%",minHeight:40,background:"rgba(93,229,200,0.04)",border:"1px solid rgba(93,229,200,0.12)",borderRadius:10,padding:"8px 12px",color:"#e8e0f0",fontFamily:F,fontSize:13,resize:"none",outline:"none",lineHeight:1.5,boxSizing:"border-box"}}/>
              </div>
            ))}
          </div>
          {Object.values(senseAnswers).filter(v=>v.trim()).length>=3 && <div style={{marginTop:12,animation:"fadeUp 0.3s ease both"}}>
            <CoachBubble name="Zen" mood="idle" showChar={false}>
              <span>Good — you're arriving in the present. Your nervous system is catching up to the fact that right now, you're okay.</span>
            </CoachBubble>
          </div>}
        </>}

        {/* Reflection journal (both modes) */}
        {(breathStep>=groundPhases.length-1 || (groundMode==="sensory" && Object.values(senseAnswers).filter(v=>v.trim()).length>=3)) && <div style={{marginTop:14,animation:"fadeUp 0.4s ease both"}}>
          <div style={{background:"rgba(93,229,200,0.04)",border:"1px solid rgba(93,229,200,0.12)",borderRadius:14,padding:"12px 14px"}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
              <span style={{fontSize:12,opacity:0.5}}>📝</span>
              <span style={{fontSize:11,fontFamily:M,color:"rgba(93,229,200,0.6)",letterSpacing:0.5}}>REFLECTION</span>
            </div>
            <p style={{fontSize:13,color:"rgba(93,229,200,0.6)",fontStyle:"italic",lineHeight:1.5,margin:"0 0 8px"}}>How are you feeling now compared to a few minutes ago? What shifted?</p>
            <textarea value={groundReflect} onChange={e=>setGroundReflect(e.target.value)} maxLength={300}
              placeholder="Whatever you notice — even 'a little calmer' counts..."
              style={{width:"100%",minHeight:56,background:"rgba(0,0,0,0.15)",border:"1px solid rgba(93,229,200,0.1)",borderRadius:10,padding:"10px 12px",color:"#e8e0f0",fontFamily:F,fontSize:13,resize:"vertical",outline:"none",lineHeight:1.5,boxSizing:"border-box"}}/>
          </div>
          <div style={{display:"flex",gap:10,marginTop:14}}>
            <button style={{...btn,flex:1}} onClick={()=>{
              if(groundReflect.trim()) logPattern("grounding_reflection",groundReflect,{mode:groundMode});
              if(groundMode==="sensory") Object.entries(senseAnswers).forEach(([k,v])=>{if(v.trim()) logPattern("sensory_grounding",v,{sense:k});});
              go("q_trigger");
            }}>Continue to arena →</button>
            <button style={{...btnSec,flex:1}} onClick={()=>{
              if(groundReflect.trim()) logPattern("grounding_reflection",groundReflect,{mode:groundMode});
              go("complete");
            }}>That's enough for now →</button>
          </div>
        </div>}
      </div></Screen>
    );
  }


  // ═══════════════════════════════════════
  // Q3: TRIGGER — Statements + narrative + adaptive response
  // ═══════════════════════════════════════
  if(scr==="q_trigger") return (
    <Screen><div style={{opacity:fade?0:1,transition:"opacity 0.5s"}}>
      <div style={{fontSize:10,fontFamily:M,color:"rgba(255,255,255,0.15)",letterSpacing:1,marginBottom:16}}>STEP 3 / 10</div>
      <CoachBubble name="Kai" mood={ans.trigger?"think":"idle"} delay={0.1}>
        {show && !ans.trigger && <Typewriter text="What happened right before this feeling showed up?" speed={25}/>}
        {ans.trigger && <span>{COACH_RESPONSES.trigger[ans.trigger]}</span>}
      </CoachBubble>
      <p style={{fontSize:18,fontFamily:D,fontWeight:600,margin:"18px 0 12px"}}>What triggered this?</p>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {Object.keys(TRIG_S).map((t,i)=>(
          <div key={t} style={{...card,...(ans.trigger===t?cardSel:hov===`t${i}`?cardHov:{}),fontSize:15,animation:`fadeUp 0.3s ease ${0.04*i}s both`}}
            onClick={()=>setAns(p=>({...p,trigger:t}))} onMouseEnter={()=>setHov(`t${i}`)} onMouseLeave={()=>setHov(null)}>{t}</div>
        ))}
      </div>
      <NarrativeBox value={narratives.trigger} onChange={v=>setNarr(p=>({...p,trigger:v}))} placeholder="What happened? Even a few words helps..."/>
      {ans.trigger && <button style={{...btn,marginTop:14}} onClick={()=>go("q_person")}>Continue →</button>}
    </div></Screen>
  );

  // ═══════════════════════════════════════
  // Q4: PERSON
  // ═══════════════════════════════════════
  if(scr==="q_person") return (
    <Screen><div style={{opacity:fade?0:1,transition:"opacity 0.5s"}}>
      <div style={{fontSize:10,fontFamily:M,color:"rgba(255,255,255,0.15)",letterSpacing:1,marginBottom:16}}>STEP 4 / 10</div>
      <CoachBubble name="Kai" mood="idle" delay={0.1}>
        {show && <Typewriter text="Who was involved — or who comes to mind when you feel this?" speed={25}/>}
      </CoachBubble>
      <p style={{fontSize:18,fontFamily:D,fontWeight:600,margin:"18px 0 12px"}}>Who's connected to this?</p>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {Object.keys(PERS_S).map((p,i)=>(
          <div key={p} style={{...card,...(ans.person===p?cardSel:hov===`p${i}`?cardHov:{}),fontSize:15,animation:`fadeUp 0.3s ease ${0.04*i}s both`}}
            onClick={()=>setAns(prev=>({...prev,person:p}))} onMouseEnter={()=>setHov(`p${i}`)} onMouseLeave={()=>setHov(null)}>{p}</div>
        ))}
      </div>
      {ans.person && <button style={{...btn,marginTop:14}} onClick={()=>go("q_meaning")}>Continue →</button>}
    </div></Screen>
  );

  // ═══════════════════════════════════════
  // Q5: MEANING STATEMENT — Highest yield question
  // ═══════════════════════════════════════
  if(scr==="q_meaning") return (
    <Screen><div style={{opacity:fade?0:1,transition:"opacity 0.5s"}}>
      <div style={{fontSize:10,fontFamily:M,color:"rgba(255,255,255,0.15)",letterSpacing:1,marginBottom:16}}>STEP 5 / 10</div>
      <CoachBubble name="Kai" mood={ans.meaning?"think":"idle"} delay={0.1}>
        {show && !ans.meaning && <Typewriter text="When this feeling hits, it's usually saying something about you. Which of these sounds most familiar?" speed={22}/>}
        {ans.meaning && <span>{COACH_RESPONSES.meaning[ans.meaning]}</span>}
      </CoachBubble>
      <p style={{fontSize:18,fontFamily:D,fontWeight:600,margin:"18px 0 4px"}}>What does this feeling say about you?</p>
      <p style={{fontSize:12,color:"rgba(255,255,255,0.3)",fontFamily:M,margin:"0 0 12px"}}>Pick the one that resonates — even if you know it's not rational</p>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {Object.keys(MEAN_S).map((m,i)=>(
          <div key={m} style={{...card,...(ans.meaning===m?cardSel:hov===`m${i}`?cardHov:{}),fontSize:16,fontStyle:"italic",lineHeight:1.5,animation:`fadeUp 0.3s ease ${0.04*i}s both`}}
            onClick={()=>setAns(p=>({...p,meaning:m}))} onMouseEnter={()=>setHov(`m${i}`)} onMouseLeave={()=>setHov(null)}>"{m}"</div>
        ))}
      </div>
      <NarrativeBox value={narratives.meaning} onChange={v=>setNarr(p=>({...p,meaning:v}))} placeholder="Does this belief show up in specific situations?"/>
      {ans.meaning && <button style={{...btn,marginTop:14}} onClick={()=>go("q_truth")}>Continue →</button>}
    </div></Screen>
  );

  // ═══════════════════════════════════════
  // Q6: TRUTH RATING
  // ═══════════════════════════════════════
  if(scr==="q_truth") return (
    <Screen><div style={{opacity:fade?0:1,transition:"opacity 0.5s"}}>
      <div style={{fontSize:10,fontFamily:M,color:"rgba(255,255,255,0.15)",letterSpacing:1,marginBottom:16}}>STEP 6 / 10</div>
      <CoachBubble name="Kai" mood="idle" delay={0.1}>
        {show && <Typewriter text={`You picked: "${ans.meaning}" — How true does that feel right now? Not what you know logically. What it feels like in your body.`} speed={22}/>}
      </CoachBubble>
      <div style={{background:"rgba(155,93,229,0.06)",border:"1px solid rgba(155,93,229,0.15)",borderRadius:14,padding:"16px 18px",margin:"20px 0",textAlign:"center"}}>
        <p style={{fontSize:16,fontStyle:"italic",color:"rgba(255,255,255,0.6)",margin:"0 0 4px"}}>"{ans.meaning}"</p>
        <div style={{fontSize:48,fontFamily:D,fontWeight:700,color:ans.truthRating>=80?"#e85d5d":ans.truthRating>=50?"#e8a85d":"#5de8c4",margin:"12px 0 8px"}}>{ans.truthRating}%</div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"rgba(255,255,255,0.25)",fontFamily:M,maxWidth:280,margin:"0 auto 8px"}}><span>doesn't feel true</span><span>feels completely true</span></div>
        <input type="range" min={0} max={100} value={ans.truthRating} onChange={e=>setAns(p=>({...p,truthRating:+e.target.value}))}
          style={{width:"100%",maxWidth:280,height:6,WebkitAppearance:"none",background:"rgba(155,93,229,0.2)",borderRadius:4,outline:"none",cursor:"pointer"}}/>
      </div>
      <CoachBubble name="Kai" mood="idle" showChar={false}>
        {ans.truthRating>=80 ? "It feels very true right now. That's important data — the strength of the feeling tells us about the pattern, not about reality."
         : ans.truthRating>=50 ? "Present but not total. That gap between what you feel and what you know — that's where the work happens."
         : "There's space between you and this belief. That space is your leverage."}
      </CoachBubble>
      <ScienceNote text="Schema beliefs feel true because they were learned early, when your brain couldn't evaluate them critically. Felt truth ≠ actual truth."/>
      <button style={{...btn,marginTop:14}} onClick={()=>go("q_familiarity")}>Continue →</button>
    </div></Screen>
  );

  // ═══════════════════════════════════════
  // Q7: FAMILIARITY
  // ═══════════════════════════════════════
  if(scr==="q_familiarity") return (
    <Screen><div style={{opacity:fade?0:1,transition:"opacity 0.5s"}}>
      <div style={{fontSize:10,fontFamily:M,color:"rgba(255,255,255,0.15)",letterSpacing:1,marginBottom:16}}>STEP 7 / 10</div>
      <CoachBubble name="Kai" mood="idle" delay={0.1}>
        {show && <Typewriter text="How familiar is this feeling? Has it been around a while, or is this newer?" speed={25}/>}
      </CoachBubble>
      <p style={{fontSize:18,fontFamily:D,fontWeight:600,margin:"18px 0 12px"}}>How long has this pattern been with you?</p>
      {["This is my story","It happens a lot","It comes and goes","This is new"].map((f,i)=>(
        <div key={f} style={{...card,...(ans.familiarity===f?cardSel:hov===`f${i}`?cardHov:{}),fontSize:15,marginBottom:8,animation:`fadeUp 0.3s ease ${0.04*i}s both`}}
          onClick={()=>setAns(p=>({...p,familiarity:f}))} onMouseEnter={()=>setHov(`f${i}`)} onMouseLeave={()=>setHov(null)}>{f}</div>
      ))}
      {ans.familiarity && <>
        <CoachBubble name="Kai" mood="idle" showChar={false}>
          {ans.familiarity==="This is my story" ? "Long-running patterns often started as protection mechanisms. They made sense once. Let's see if they still do."
           : ans.familiarity==="It happens a lot" ? "Frequency tells us this pattern has roots. It's not random — there's a structure underneath."
           : ans.familiarity==="It comes and goes" ? "Intermittent patterns often have specific triggers. We can map those."
           : "New feelings can be signals of growth — or old patterns surfacing in a new context. Let's find out."}
        </CoachBubble>
        <button style={{...btn,marginTop:14}} onClick={()=>go("q_onset")}>Continue →</button>
      </>}
    </div></Screen>
  );

  // ═══════════════════════════════════════
  // Q8: ONSET
  // ═══════════════════════════════════════
  if(scr==="q_onset") return (
    <Screen><div style={{opacity:fade?0:1,transition:"opacity 0.5s"}}>
      <div style={{fontSize:10,fontFamily:M,color:"rgba(255,255,255,0.15)",letterSpacing:1,marginBottom:16}}>STEP 8 / 10</div>
      <CoachBubble name="Kai" mood="idle" delay={0.1}>
        {show && <Typewriter text="When do you think this pattern started? Not when you named it — when you first felt it." speed={22}/>}
      </CoachBubble>
      <p style={{fontSize:18,fontFamily:D,fontWeight:600,margin:"18px 0 12px"}}>When did this start?</p>
      {["Childhood — as far back as I can remember","Teenage years","Adulthood — specific event","Recently"].map((o,i)=>(
        <div key={o} style={{...card,...(ans.onset===o?cardSel:hov===`o${i}`?cardHov:{}),fontSize:15,marginBottom:8}}
          onClick={()=>setAns(p=>({...p,onset:o}))} onMouseEnter={()=>setHov(`o${i}`)} onMouseLeave={()=>setHov(null)}>{o}</div>
      ))}
      {ans.onset && <>
        <CoachBubble name="Kai" mood="think" showChar={false}>
          {ans.onset.includes("Childhood") ? "Childhood-origin patterns run deepest because they were wired in before you had words for them. That's not weakness — it's neurology."
           : ans.onset.includes("Teenage") ? "Teen years are when identity forms. Patterns from that era often connect to belonging, competence, or self-image."
           : "Later-onset patterns can be just as powerful. Your brain doesn't distinguish between early and late learning — it all becomes automatic."}
        </CoachBubble>
        <ScienceNote text={ans.onset.includes("Childhood") ? "Early maladaptive schemas typically develop before age 6, when the prefrontal cortex hasn't matured enough to evaluate beliefs critically." : "Schema formation can occur at any age through repeated experiences that confirm core beliefs."}/>
        <button style={{...btn,marginTop:14}} onClick={()=>go("q_coping")}>Continue →</button>
      </>}
    </div></Screen>
  );

  // ═══════════════════════════════════════
  // Q9: COPING URGE
  // ═══════════════════════════════════════
  if(scr==="q_coping") return (
    <Screen><div style={{opacity:fade?0:1,transition:"opacity 0.5s"}}>
      <div style={{fontSize:10,fontFamily:M,color:"rgba(255,255,255,0.15)",letterSpacing:1,marginBottom:16}}>STEP 9 / 10</div>
      <CoachBubble name="Kai" mood="idle" delay={0.1}>
        {show && <Typewriter text="When this feeling shows up, what do you want to do? Not the wise choice — the gut reaction." speed={22}/>}
      </CoachBubble>
      <p style={{fontSize:18,fontFamily:D,fontWeight:600,margin:"18px 0 12px"}}>What's the urge?</p>
      {Object.keys(COPE_S).map((c,i)=>(
        <div key={c} style={{...card,...(ans.copingUrge===c?cardSel:hov===`c${i}`?cardHov:{}),fontSize:15,marginBottom:8}}
          onClick={()=>setAns(p=>({...p,copingUrge:c}))} onMouseEnter={()=>setHov(`c${i}`)} onMouseLeave={()=>setHov(null)}>{c}</div>
      ))}
      <NarrativeBox value={narratives.coping} onChange={v=>setNarr(p=>({...p,coping:v}))} placeholder="What does this urge look like for you?"/>
      {ans.copingUrge && <>
        <CoachBubble name="Kai" mood="think" showChar={false}>
          {ans.copingUrge.includes("Withdraw") ? "Withdrawal makes sense — if the world feels unsafe, retreating protects you. But it also prevents the pattern from being tested."
           : ans.copingUrge.includes("reassurance") ? "Seeking reassurance works short-term but can reinforce the belief that you can't trust your own judgment."
           : ans.copingUrge.includes("Push harder") ? "The drive to prove yourself can look like motivation from outside. From inside, it often feels like running from something."
           : ans.copingUrge.includes("angry") ? "Anger can be a boundary or a wall. Let's figure out which one this is."
           : ans.copingUrge.includes("Give in") ? "Going along to keep the peace — that's a survival strategy that costs something over time."
           : ans.copingUrge.includes("Freeze") ? "Freezing is your nervous system saying 'too much.' It's not cowardice — it's neurobiology."
           : "That urge tells us something about how this pattern protects itself."}
        </CoachBubble>
        <button style={{...btn,marginTop:14}} onClick={()=>go("q_need")}>Continue →</button>
      </>}
    </div></Screen>
  );

  // ═══════════════════════════════════════
  // Q10: UNMET NEED
  // ═══════════════════════════════════════
  if(scr==="q_need") return (
    <Screen><div style={{opacity:fade?0:1,transition:"opacity 0.5s"}}>
      <div style={{fontSize:10,fontFamily:M,color:"rgba(255,255,255,0.15)",letterSpacing:1,marginBottom:16}}>STEP 10 / 10</div>
      <CoachBubble name="Kai" mood="idle" delay={0.1}>
        {show && <Typewriter text="Last one. Underneath all of this — what do you most wish someone would do or say right now?" speed={22}/>}
      </CoachBubble>
      <p style={{fontSize:18,fontFamily:D,fontWeight:600,margin:"18px 0 12px"}}>What do you need most right now?</p>
      {Object.keys(NEED_S).map((n,i)=>(
        <div key={n} style={{...card,...(ans.unmetNeed===n?cardSel:hov===`n${i}`?cardHov:{}),fontSize:15,marginBottom:8}}
          onClick={()=>setAns(p=>({...p,unmetNeed:n}))} onMouseEnter={()=>setHov(`n${i}`)} onMouseLeave={()=>setHov(null)}>{n}</div>
      ))}
      <NarrativeBox value={narratives.need} onChange={v=>setNarr(p=>({...p,need:v}))} placeholder="What would that look like for you?"/>
      {ans.unmetNeed && <>
        <CoachBubble name="Kai" mood="happy" showChar={false}>
          <span>That need is real and valid. The fact that you can name it means something — it means you haven't lost touch with what matters to you. Let's see where this leads.</span>
        </CoachBubble>
        <button style={{...btn,marginTop:14}} onClick={()=>{
          // Check safety on all narratives
          const allText = Object.values(narratives).join(" ");
          const sf = checkSafety(allText);
          if(sf!=="OK"){ setSafety(sf); go("safety"); return; }
          // Log assessment narratives to journal
          if(narratives.emotion?.trim()) setJournal(j=>[...j,{moment:"what_im_feeling",text:narratives.emotion.trim(),timestamp:Date.now()}]);
          if(narratives.trigger?.trim()) setJournal(j=>[...j,{moment:"what_happened",text:narratives.trigger.trim(),timestamp:Date.now()}]);
          if(narratives.meaning?.trim()) setJournal(j=>[...j,{moment:"what_it_means",text:narratives.meaning.trim(),timestamp:Date.now()}]);
          if(narratives.coping?.trim()) setJournal(j=>[...j,{moment:"coping_urge",text:narratives.coping.trim(),timestamp:Date.now()}]);
          if(narratives.need?.trim()) setJournal(j=>[...j,{moment:"unmet_need",text:narratives.need.trim(),timestamp:Date.now()}]);
          // Run TPGE
          const r = runTPGE(ans);
          setResult(r);
          if(r.disamb){ setDisambQ(r.disamb); go("disamb"); }
          else go("tpge_scan");
        }}>See what the Lumina finds →</button>
      </>}
    </div></Screen>
  );


  // ═══════════════════════════════════════
  // SAFETY GATE
  // ═══════════════════════════════════════
  if(scr==="safety") return (
    <Screen><div style={{opacity:fade?0:1,transition:"opacity 0.5s",textAlign:"center",flex:1,display:"flex",flexDirection:"column",justifyContent:"center"}}>
      <div style={{fontSize:48,marginBottom:16}}>💛</div>
      <h2 style={{fontFamily:D,fontSize:24,fontWeight:700,marginBottom:12}}>Hold on — this matters</h2>
      {safety==="HARD" ? <>
        <p style={{fontSize:15,lineHeight:1.7,color:"rgba(255,255,255,0.7)",marginBottom:16}}>What you wrote tells me you might be in real pain right now. This tool isn't the right support for that — but there are people who can help.</p>
        <div style={{...card,borderColor:"rgba(232,93,93,0.3)",textAlign:"left",marginBottom:16}}>
          <p style={{fontSize:14,fontWeight:600,marginBottom:8}}>Crisis Support</p>
          <p style={{fontSize:14,color:"rgba(255,255,255,0.6)",lineHeight:1.6,margin:0}}>988 Suicide & Crisis Lifeline: Call or text <strong>988</strong><br/>Crisis Text Line: Text <strong>HOME</strong> to 741741</p>
        </div>
      </> : <>
        <p style={{fontSize:15,lineHeight:1.7,color:"rgba(255,255,255,0.7)",marginBottom:16}}>Some of what you wrote carries a lot of weight. You don't have to carry it alone.</p>
        <div style={{...card,borderColor:"rgba(232,163,93,0.3)",textAlign:"left",marginBottom:16}}>
          <p style={{fontSize:14,color:"rgba(255,255,255,0.6)",lineHeight:1.6,margin:0}}>If you're going through something heavy, talking to someone trained to help can make a real difference. You deserve that support.</p>
        </div>
      </>}
      <button style={btn} onClick={()=>go("portal")}>Return to portal</button>
    </div></Screen>
  );

  // ═══════════════════════════════════════
  // DISAMBIGUATOR
  // ═══════════════════════════════════════
  if(scr==="disamb" && disambQ) return (
    <Screen><div style={{opacity:fade?0:1,transition:"opacity 0.5s"}}>
      <CoachBubble name="Kai" mood="think" delay={0.1}>
        {show && <Typewriter text="The Lumina is seeing two possible patterns. One more question will help it focus." speed={22}/>}
      </CoachBubble>
      <p style={{fontSize:18,fontFamily:D,fontWeight:600,margin:"20px 0 12px"}}>{disambQ.q}</p>
      {disambQ.opts.map((o,i)=>(
        <div key={i} style={{...card,...(hov===`dq${i}`?cardHov:{}),fontSize:15,marginBottom:10,lineHeight:1.5}}
          onClick={()=>{
            const boosted = {...result.scores};
            Object.entries(o.b).forEach(([k,v])=>boosted[k]+=v);
            const r = runTPGE({...ans, _boost: o.b});
            // Apply boost manually
            Object.entries(o.b).forEach(([k,v])=>{r.scores[k]+=v;});
            const top = Object.entries(r.scores).sort((a,b)=>b[1]-a[1]).filter(x=>x[1]>0).map(([code,score])=>({code,score,schema:SCHEMAS[code]}));
            r.top=top; r.pk=top[0]?.code||"DF"; r.kingdom=KINGDOMS[r.pk];
            setResult(r);
            go("tpge_scan");
          }}
          onMouseEnter={()=>setHov(`dq${i}`)} onMouseLeave={()=>setHov(null)}>{o.t}</div>
      ))}
    </div></Screen>
  );

  // ═══════════════════════════════════════
  // TPGE SCAN ANIMATION
  // ═══════════════════════════════════════
  if(scr==="tpge_scan") {
    return (
      <Screen kingdom={K}><div style={{opacity:fade?0:1,transition:"opacity 0.5s"}}>
        <div style={{textAlign:"center",marginBottom:20}}><KaiChar mood="think" size={80} style={{margin:"0 auto"}}/></div>
        <div style={{background:"rgba(10,6,18,0.9)",border:"1px solid rgba(155,93,229,0.25)",borderRadius:18,padding:0,overflow:"hidden",boxShadow:scanStep<5?"0 0 30px rgba(155,93,229,0.15)":"none"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 14px",borderBottom:"1px solid rgba(155,93,229,0.12)",background:"rgba(155,93,229,0.04)"}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:scanStep<5?"#9B5DE5":"#4ade80",animation:scanStep<5?"scanPulse 1s ease-in-out infinite":"none"}}/>
              <span style={{fontSize:9,fontFamily:M,color:"rgba(255,255,255,0.4)",letterSpacing:1.5}}>LUMINA</span>
            </div>
            <span style={{fontSize:9,fontFamily:M,color:"rgba(155,93,229,0.4)"}}>{scanStep<5?"SCANNING...":"MATCH FOUND"}</span>
          </div>
          <div style={{padding:"14px 16px"}}>
            <div style={{height:3,background:"rgba(155,93,229,0.12)",borderRadius:2,overflow:"hidden",marginBottom:14}}>
              <div style={{height:"100%",background:"linear-gradient(90deg,#5d9ce8,#9B5DE5)",borderRadius:2,transition:"width 0.5s ease",width:`${(scanStep+1)/scanSteps.length*100}%`}}/>
            </div>
            {scanSteps.map((s,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,opacity:i<=scanStep?1:0.15,transition:"all 0.4s",transform:i<=scanStep?"translateX(0)":"translateX(8px)"}}>
                <span style={{fontSize:11,fontFamily:M,color:i<scanStep?"#4ade80":i===scanStep?"#e8e0f0":"rgba(255,255,255,0.2)"}}>{i<scanStep?"✓":i===scanStep?"▸":"·"}</span>
                <span style={{fontSize:12,fontFamily:M,color:i<scanStep?"rgba(74,222,128,0.7)":i===scanStep?"#e8e0f0":"rgba(255,255,255,0.2)"}}>{s}</span>
              </div>
            ))}
            {scanStep>=3 && <div style={{marginTop:10,padding:"8px 10px",background:"rgba(155,93,229,0.04)",borderRadius:6,fontSize:10,fontFamily:M,color:"rgba(155,93,229,0.4)",lineHeight:1.7}}>
              {scanStep>=3 && <div>schema.primary: {result?.pk?.toLowerCase()} — {SCHEMAS[result?.pk]?.name}</div>}
              {scanStep>=4 && <div>mode.active: {result?.tm?.toLowerCase()} — {MODES[result?.tm]?.name}</div>}
              {scanStep>=5 && <div style={{color:"rgba(74,222,128,0.6)"}}>confidence: {result?.conf}% → routing confirmed</div>}
            </div>}
          </div>
        </div>
      </div></Screen>
    );
  }

  // ═══════════════════════════════════════
  // FIT CHECK
  // ═══════════════════════════════════════
  if(scr==="fit_check") return (
    <Screen kingdom={K}><div style={{opacity:fade?0:1,transition:"opacity 0.5s"}}>
      <CoachBubble name="Kai" mood="idle" delay={0.1}>
        {show && <Typewriter text={`The Lumina is pointing toward ${K.name}. The pattern it's seeing: "${K.boss.belief}" — Does that feel right?`} speed={20} onDone={()=>setTwDone(true)}/>}
      </CoachBubble>
      {twDone && <div style={{margin:"16px 0"}}>
        {/* Kingdom preview */}
        <div style={{...card,borderColor:`${K.accent}33`,marginBottom:16,textAlign:"center",padding:20}}>
          <BossChar type={K.boss.icon} color={K.accent} size={70} hp={100} style={{margin:"0 auto 12px"}}/>
          <div style={{fontSize:18,fontFamily:D,fontWeight:600,marginBottom:4}}>{K.name}</div>
          <div style={{fontSize:12,fontFamily:M,color:"rgba(255,255,255,0.35)"}}>{K.sub} Kingdom</div>
          <div style={{fontSize:13,color:"rgba(255,255,255,0.4)",fontStyle:"italic",marginTop:8}}>"{K.boss.belief}"</div>
        </div>
        <div style={{display:"flex",gap:12,animation:"fadeUp 0.4s ease both"}}>
          <div style={{...card,flex:1,textAlign:"center",...(hov==="fy"?cardHov:{})}} onClick={()=>go("externalize")} onMouseEnter={()=>setHov("fy")} onMouseLeave={()=>setHov(null)}>
            <div style={{fontSize:18,marginBottom:4}}>✅</div><div style={{fontSize:14,fontWeight:600}}>That fits</div>
          </div>
          <div style={{...card,flex:1,textAlign:"center",...(hov==="fn"?cardHov:{})}} onClick={()=>go("fit_alt")} onMouseEnter={()=>setHov("fn")} onMouseLeave={()=>setHov(null)}>
            <div style={{fontSize:18,marginBottom:4}}>🔄</div><div style={{fontSize:14,fontWeight:600}}>Not quite</div>
          </div>
        </div>
      </div>}
    </div></Screen>
  );

  // FIT_CHECK alternates
  if(scr==="fit_alt") return (
    <Screen><div style={{opacity:fade?0:1,transition:"opacity 0.5s"}}>
      <CoachBubble name="Kai" mood="idle"><span>No problem. What feels closer?</span></CoachBubble>
      <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:16}}>
        {Object.entries(KINGDOMS).map(([code,k],i)=>(
          <div key={code} style={{...card,...(hov===`k${i}`?cardHov:{}),display:"flex",alignItems:"center",gap:12,animation:`fadeUp 0.3s ease ${0.06*i}s both`}}
            onClick={()=>{setResult(r=>({...r,pk:code,kingdom:k}));go("externalize");}}
            onMouseEnter={()=>setHov(`k${i}`)} onMouseLeave={()=>setHov(null)}>
            <MinionChar type={k.minions[0].icon} color={k.accent} size={36}/>
            <div><div style={{fontSize:14,fontWeight:600}}>{k.sub}</div><div style={{fontSize:12,color:"rgba(255,255,255,0.35)",fontStyle:"italic"}}>"{k.boss.belief}"</div></div>
          </div>
        ))}
      </div>
    </div></Screen>
  );


  // ═══════════════════════════════════════
  // EXTERNALIZATION
  // ═══════════════════════════════════════
  if(scr==="externalize") return (
    <Screen kingdom={K}><div style={{opacity:fade?0:1,transition:"opacity 0.5s"}}>
      <div style={{textAlign:"center",marginTop:16}}>
        <div style={{fontSize:10,fontFamily:M,color:`${K.accent}88`,letterSpacing:1.5,marginBottom:12}}>⚠️ DISTURBANCE DETECTED</div>
        <div style={{position:"relative",width:160,height:160,margin:"0 auto 20px"}}>
          <div style={{position:"absolute",inset:0,borderRadius:"50%",border:`2px solid ${K.accent}33`,animation:"orbit 6s linear infinite"}}/>
          <div style={{position:"absolute",inset:20,borderRadius:"50%",border:`1px solid ${K.accent}22`,animation:"orbit 4s linear reverse infinite"}}/>
          <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <BossChar type={K.boss.icon} color={K.accent} size={80} hp={100}/>
          </div>
        </div>
        <h2 style={{fontFamily:D,fontSize:24,fontWeight:700,marginBottom:4}}>{K.name}</h2>
        <p style={{fontSize:12,fontFamily:M,color:`${K.accent}88`}}>{K.sub} Kingdom</p>
        <p style={{fontSize:12,color:"rgba(255,255,255,0.25)",fontStyle:"italic",margin:"4px 0 0"}}>{K.env}</p>
      </div>
      <div style={{marginTop:20}}>
        <CoachBubble name="Kai" mood="idle" delay={0.5}>
          {show && <Typewriter text="That voice in there? It's not you. It's a pattern that learned to speak a long time ago. It got loud because it thought it was protecting you. But it's not you. You're the one walking in." speed={20} onDone={()=>setTwDone(true)}/>}
        </CoachBubble>
      </div>
      {twDone && <div style={{animation:"fadeUp 0.4s ease both"}}>
        <ScienceNote text="Externalization is a core technique in narrative therapy and schema therapy. Separating yourself from the pattern creates cognitive distance — the first step in changing your relationship to it."/>
        <button style={{...btn,marginTop:16}} onClick={()=>{setMIdx(0);setMStep("appear");go("minion");}}>Enter Kingdom →</button>
      </div>}
    </div></Screen>
  );

  // ═══════════════════════════════════════
  // MINION ENCOUNTERS — 2D characters + adaptive responses
  // ═══════════════════════════════════════
  if(scr==="minion") {
    const m = K.minions[mIdx];
    const distortionOpts = [m.distortion, ...K.minions.filter((_,i)=>i!==mIdx).map(x=>x.distortion)].filter((v,i,a)=>a.indexOf(v)===i);
    if(distortionOpts.length<3) distortionOpts.push("Emotional Reasoning");
    const isLast = mIdx===2;

    return (
      <Screen kingdom={K}><div style={{opacity:fade?0:1,transition:"opacity 0.5s"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <span style={{fontSize:10,fontFamily:M,color:"rgba(255,255,255,0.15)",letterSpacing:1}}>MINION {mIdx+1} / 3</span>
          <span style={xpBadge}>+{xp} XP</span>
        </div>

        <div style={{textAlign:"center",marginBottom:20}}>
          <MinionChar type={m.icon} color={K.accent} size={mStep==="resolved"?70:100} defeated={mStep==="resolved"} style={{margin:"0 auto"}}/>
          <div style={{fontFamily:D,fontSize:18,fontWeight:600,marginTop:8,marginBottom:4}}>{m.name}</div>
          {mStep!=="appear" && (
            <div style={{background:"rgba(255,50,80,0.08)",border:"1px solid rgba(255,50,80,0.25)",borderRadius:12,padding:"10px 16px",fontSize:15,fontStyle:"italic",color:"#ff8a9e",animation:"fadeUp 0.4s ease both"}}>
              "{m.thought}"
            </div>
          )}
        </div>

        {mStep==="appear" && <div style={{animation:"fadeUp 0.4s ease both"}}>
          <CoachBubble name="Kai" mood="idle" showChar={false}><span>A thought-echo materializes. Let's hear what it's saying before we respond.</span></CoachBubble>
          <button style={btn} onClick={()=>setMStep("speaks")}>Face it →</button>
        </div>}

        {mStep==="speaks" && <div style={{animation:"fadeUp 0.4s ease both"}}>
          <CoachBubble name="Kai" mood="idle" showChar={false}><span>Before we engage with the content, let's create some distance. This is called <strong>defusion</strong> — the skill of noticing a thought without becoming it.</span></CoachBubble>

          <ScienceNote text="Cognitive defusion (ACT) reduces the literal impact of thoughts. Adding 'I notice I'm having the thought that...' activates the observer self — the part of you that can watch thoughts without being consumed by them."/>

          {/* Defusion practice space */}
          <div style={{marginTop:14}}>
            <div style={{background:`${K.accent}06`,border:`1px solid ${K.accent}20`,borderRadius:14,padding:"12px 14px"}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                <span style={{fontSize:12,opacity:0.5}}>✍️</span>
                <span style={{fontSize:11,fontFamily:M,color:`${K.accent}66`,letterSpacing:0.5}}>DEFUSION PRACTICE</span>
              </div>
              <p style={{fontSize:13,color:`${K.accent}88`,fontStyle:"italic",lineHeight:1.5,margin:"0 0 8px"}}>
                Try it yourself — restate the thought in your own words with some distance. Or write the same thought and notice how it lands differently when you see it as words on a screen.
              </p>
              <textarea value={battleNarr.defuse} onChange={e=>setBattleNarr(p=>({...p,defuse:e.target.value}))} maxLength={500}
                placeholder={`"I notice I'm having the thought that..." or write whatever comes to mind`}
                style={{width:"100%",minHeight:72,background:"rgba(0,0,0,0.15)",border:`1px solid ${K.accent}15`,borderRadius:10,padding:"10px 12px",color:"#e8e0f0",fontFamily:F,fontSize:14,resize:"vertical",outline:"none",lineHeight:1.6,boxSizing:"border-box"}}/>
              <span style={{fontSize:10,fontFamily:M,color:"rgba(255,255,255,0.12)"}}>{(battleNarr.defuse||"").length}/500</span>
            </div>
          </div>

          {/* Journal for thoughts/fears */}
          <JournalBox value={battleNarr.defuseJournal||""} onChange={v=>setBattleNarr(p=>({...p,defuseJournal:v}))}
            prompt={DEFUSE_PROMPTS[result?.pk]?.prompt || "What thoughts, fears, or feelings are running through your mind right now?"} accent={K.accent}/>

          {(battleNarr.defuse?.trim()?.length>20 || battleNarr.defuseJournal?.trim()?.length>20) && <div style={{marginTop:8,animation:"fadeUp 0.3s ease both"}}>
            <CoachBubble name="Kai" mood="think" showChar={false}><span>{(()=>{
              const txt = ((battleNarr.defuse||"")+" "+(battleNarr.defuseJournal||"")).toLowerCase();
              return txt.includes("always") || txt.includes("never")
                ? "I notice some absolute words in there — 'always' or 'never.' Those are often the schema talking, not the facts. Schemas love absolutes because they shut down thinking."
              : txt.includes("think") || txt.includes("thought") || txt.includes("believe") || txt.includes("tell myself")
                ? "You're catching the thought patterns — that's exactly the skill. The moment you can describe the thought, you're no longer inside it."
              : txt.includes("afraid") || txt.includes("scared") || txt.includes("fear") || txt.includes("worry") || txt.includes("anxious")
                ? "Fear is underneath this one. That tells us the pattern is wired to your threat system — your mind learned to treat this thought as dangerous. It's not. It's just loud."
              : txt.includes("angry") || txt.includes("frustrat") || txt.includes("unfair")
                ? "There's anger here. Anger often protects something more vulnerable underneath — hurt, helplessness, or a need that went unmet."
              : txt.includes("remember") || txt.includes("childhood") || txt.includes("kid") || txt.includes("young") || txt.includes("parent")
                ? "A memory surfaced. That makes sense — schemas are anchored in early experience. That younger part of you learned this before you had words for it."
              : txt.includes("sad") || txt.includes("lonely") || txt.includes("alone") || txt.includes("empty")
                ? "There's grief or loneliness in what you wrote. That emotion is real and valid — and it tells us something important about what you need."
              : txt.includes("stupid") || txt.includes("worthless") || txt.includes("broken") || txt.includes("wrong with me")
                ? "Those are the schema's words, not yours. Notice how harsh and absolute they are — that's how you know it's the pattern, not the truth."
              : txt.length > 80
                ? "You went deep there. That level of honesty is where real shifts happen. The pattern can't stay hidden when you name it this clearly."
                : "Thank you for writing that down. Putting thoughts into words is itself a form of defusion — you're already doing the work.";
            })()}</span></CoachBubble>
          </div>}

          <button style={{...btn,marginTop:12,background:"linear-gradient(135deg,#5d9ce8,#3a7bd5)"}} onClick={()=>{
            addXp(5);
            if(battleNarr.defuse?.trim())addXp(5);
            logPattern("defusion",battleNarr.defuse||"",{minion:m.name,thought:m.thought});
            if(battleNarr.defuseJournal?.trim()) logPattern("defusion_journal",battleNarr.defuseJournal,{minion:m.name});
            setMStep("name_trap");
          }}>
            🛡️ I've defused it — what's the thinking trap?
          </button>
        </div>}

        {mStep==="name_trap" && <div style={{animation:"fadeUp 0.4s ease both"}}>
          <CoachBubble name="Kai" mood="think" showChar={false}><span>It flickered. Now — what kind of thinking trap is this? Naming the distortion weakens its grip.</span></CoachBubble>
          <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:8}}>
            {distortionOpts.map((d,i)=>(
              <div key={i} style={{...card,...(selDist===d?(d===m.distortion?{...cardSel,borderColor:"#4ade80",background:"rgba(74,222,128,0.08)"}:{...cardSel,borderColor:"#f87171",background:"rgba(248,113,113,0.08)"}):hov===`d${i}`?cardHov:{}),cursor:"pointer"}}
                onClick={()=>{setSelDist(d);if(d===m.distortion){addXp(15);logPattern("trap_naming",battleNarr.trap||"",{minion:m.name,distortion:m.distortion});setTimeout(()=>setMStep("reframe"),700);}else setTimeout(()=>setSelDist(null),500);}}
                onMouseEnter={()=>setHov(`d${i}`)} onMouseLeave={()=>setHov(null)}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <span style={{fontSize:14,fontWeight:600}}>{d}</span>
                  {selDist===d && <span>{d===m.distortion?"✅":"✗"}</span>}
                </div>
                <p style={{fontSize:12,color:"rgba(255,255,255,0.35)",margin:"4px 0 0",lineHeight:1.4}}>{DISTORTION_DEFS[d] || "A pattern that distorts how you interpret events"}</p>
              </div>
            ))}
          </div>
          <JournalBox value={battleNarr.trap} onChange={v=>setBattleNarr(p=>({...p,trap:v}))}
            prompt={DEFUSE_PROMPTS[result?.pk]?.deeper || "What does this thought really want you to believe? What fears does it feed?"} accent={K.accent}/>
        </div>}

        {mStep==="reframe" && <div style={{animation:"fadeUp 0.4s ease both"}}>
          <div style={{...tag,borderColor:"#4ade80",color:"#4ade80",background:"rgba(74,222,128,0.08)",marginBottom:12}}>✓ {m.distortion} identified</div>
          <CoachBubble name="Kai" mood="happy" showChar={false}><span>Now respond to it. Which reframe feels most honest — not most positive, most accurate?</span></CoachBubble>
          <ScienceNote text="Cognitive restructuring works best when the alternative thought is believable, not just optimistic. Accuracy > positivity."/>
          <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:10}}>
            {m.reframes.map((r,i)=>(
              <div key={i} style={{...card,...(selRef===i?cardSel:hov===`r${i}`?cardHov:{}),fontSize:14,lineHeight:1.5}}
                onClick={()=>{setSelRef(i);addXp(10);logPattern("reframe_response",battleNarr.reframe||"",{minion:m.name,chosen:r});setTimeout(()=>setMStep("resolved"),600);}}
                onMouseEnter={()=>setHov(`r${i}`)} onMouseLeave={()=>setHov(null)}>"{r}"</div>
            ))}
          </div>
          <JournalBox value={battleNarr.reframe} onChange={v=>setBattleNarr(p=>({...p,reframe:v}))}
            prompt={REFRAME_PROMPTS[result?.pk] || "What thoughts or feelings come up as you read these reframes?"} accent={K.accent}/>
        </div>}

        {mStep==="resolved" && <div style={{animation:"fadeUp 0.4s ease both"}}>
          <div style={{textAlign:"center"}}><div style={{...xpBadge,fontSize:14,padding:"6px 16px",marginBottom:12}}>+{battleNarr.defuse?.trim()?35:30} XP earned</div></div>
          <CoachBubble name="Kai" mood="happy" showChar={false}>
            <span>{isLast ? "That was the last surface thought. But they were all circling something deeper. Can you feel it?" : "That's a skill you're building — each time you name it, it gets a little easier."}</span>
          </CoachBubble>
          <JournalBox value={battleNarr.resolved} onChange={v=>setBattleNarr(p=>({...p,resolved:v}))}
            prompt={RESOLVED_PROMPTS[result?.pk] || "What thoughts, fears, or emotions are running through your mind right now?"} accent={K.accent}/>
          <button style={{...btn,marginTop:12}} onClick={()=>{
            if(battleNarr.resolved?.trim()){addXp(5);logPattern("post_minion",battleNarr.resolved,{minion:m.name});}
            if(isLast){go("boss");setBossHp(100);setBossPhase("entry");setTwDone(false);}
            else{setMIdx(mIdx+1);setMStep("appear");setSelDist(null);setSelRef(null);setBattleNarr(p=>({...p,defuse:"",defuseJournal:"",trap:"",reframe:"",resolved:""}));}
          }}>{isLast?"⚔️ Face the Boss →":"Next thought-echo →"}</button>
        </div>}
      </div></Screen>
    );
  }


  // ═══════════════════════════════════════
  // BOSS BATTLE — 2D animated boss + adaptive responses
  // ═══════════════════════════════════════
  if(scr==="boss") {
    const B = K.boss;
    const evidence = result?.thoughts?.slice(0,3) || ["I've been criticized for things about myself","I've felt different from others","Sometimes I hide parts of myself"];
    return (
      <Screen kingdom={K}><div style={{opacity:fade?0:1,transition:"opacity 0.5s"}}>
        {/* HP bar */}
        <div style={{marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
            <span style={{fontSize:10,fontFamily:M,color:"rgba(255,255,255,0.3)",letterSpacing:1}}>{bossPhase==="transform"?B.transformed:B.name}</span>
            <span style={{fontSize:10,fontFamily:M,color:"rgba(255,255,255,0.3)"}}>{bossHp}%</span>
          </div>
          <div style={{height:7,background:"rgba(155,93,229,0.12)",borderRadius:4,overflow:"hidden"}}>
            <div style={hpBar(bossHp, bossHp>50?K.accent:bossHp>20?"#e8a85d":"#4ade80")}/>
          </div>
        </div>

        <div style={{textAlign:"center",marginBottom:16}}>
          <BossChar type={B.icon} color={K.accent} size={bossPhase==="transform"?100:110} hp={bossHp} transformed={bossPhase==="transform"} style={{margin:"0 auto"}}/>
          {bossPhase!=="transform" && (
            <div style={{background:"rgba(255,30,60,0.06)",border:"1px solid rgba(255,30,60,0.2)",borderRadius:12,padding:"10px 16px",fontSize:16,fontFamily:D,fontWeight:600,color:"#ff6b7f",marginTop:8}}>"{B.belief}"</div>
          )}
        </div>

        {bossPhase==="entry" && <div style={{animation:"fadeUp 0.4s ease both"}}>
          <CoachBubble name="Aria" mood="idle" showChar={false}>
            {show && <Typewriter text="This is the deeper belief. It's been running underneath for a long time. We're going to examine it together — not with force, but with evidence." speed={20} onDone={()=>setTwDone(true)}/>}
          </CoachBubble>
          <ScienceNote text="Core beliefs are examined using Socratic questioning — the gold standard in CBT. The goal isn't to disprove the belief, but to test its accuracy."/>
          {twDone && <>
            <JournalBox value={battleNarr.bossEntry} onChange={v=>{setBattleNarr(p=>({...p,bossEntry:v}));}}
              prompt={BOSS_ENTRY_PROMPTS[result?.pk] || "What comes up when you see this belief written out?"} accent={K.accent}/>
            <button style={{...btn,marginTop:12}} onClick={()=>{if(battleNarr.bossEntry?.trim()){addXp(5);logPattern("boss_encounter",battleNarr.bossEntry,{boss:B.name,belief:B.belief});}setBossPhase("prosecution");setTwDone(false);}}>Begin the examination →</button>
          </>}
        </div>}

        {bossPhase==="prosecution" && <div style={{animation:"fadeUp 0.4s ease both"}}>
          <CoachBubble name="Aria" mood="idle" showChar={false}>
            <span>First, honesty. This belief has power because it connects to real experiences. What evidence does it point to? Select what resonates.</span>
          </CoachBubble>
          {evidence.map((e,i)=>{const sel=evSel.includes(i); return (
            <div key={i} style={{...card,...(sel?cardSel:hov===`ev${i}`?cardHov:{}),fontSize:14,lineHeight:1.5,marginBottom:8}}
              onClick={()=>setEvSel(sel?evSel.filter(x=>x!==i):[...evSel,i])}
              onMouseEnter={()=>setHov(`ev${i}`)} onMouseLeave={()=>setHov(null)}>
              <span style={{opacity:0.4,marginRight:8}}>{sel?"☑":"☐"}</span>"{e}"
            </div>
          );})}
          {evSel.length>0 && <>
            <CoachBubble name="Aria" mood="idle" showChar={false}>
              <span>Brave. You're being honest with it — and that takes courage. Now here's where we test it.</span>
            </CoachBubble>
            <ScienceNote text="Schema therapy uses 'prosecution then defense' — acknowledging the evidence for a belief before challenging it creates genuine cognitive restructuring, not superficial positive thinking."/>
            <button style={btn} onClick={()=>setBossPhase("defense")}>⚔️ Enter the Defense →</button>
          </>}
        </div>}

        {bossPhase==="defense" && !activeSoc && <div style={{animation:"fadeUp 0.4s ease both"}}>
          <CoachBubble name="Aria" mood="idle" showChar={false}>
            <span>{socUsed.length===0?"Choose your approach. Each challenges the belief differently."
              : bossHp<=20?"The belief is cracking. Time for the final move."
              : "Keep going. Each answer chips away at the foundation."}</span>
          </CoachBubble>
          {bossHp<=20 ? <button style={{...btn,background:"linear-gradient(135deg,#4ade80,#22c55e)"}} onClick={()=>setBossPhase("forge")}>🔨 Forge the Balanced Thought →</button>
          : <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:8}}>
            {SOCRATIC.filter(s=>!socUsed.includes(s.id)).map((s,i)=>(
              <div key={s.id} style={{...card,...(hov===s.id?cardHov:{}),animation:`fadeUp 0.3s ease ${0.08*i}s both`}}
                onClick={()=>setActiveSoc(s)} onMouseEnter={()=>setHov(s.id)} onMouseLeave={()=>setHov(null)}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:14,fontWeight:600}}>{s.icon} {s.name}</span>
                  <span style={{fontSize:10,fontFamily:M,color:s.damage>=32?"#4ade80":"#e8a85d"}}>DMG: {"█".repeat(Math.floor(s.damage/8))}{"░".repeat(5-Math.floor(s.damage/8))}</span>
                </div>
              </div>
            ))}
          </div>}
        </div>}

        {bossPhase==="defense" && activeSoc && <div style={{animation:"fadeUp 0.4s ease both"}}>
          <CoachBubble name="Aria" mood="idle" showChar={false}><span>{activeSoc.q}</span></CoachBubble>
          <NarrativeBox value={narratives[`soc_${activeSoc.id}`]||""} onChange={v=>setNarr(p=>({...p,[`soc_${activeSoc.id}`]:v}))} placeholder="Take your time with this one..."/>
          <div style={{display:"flex",gap:10,marginTop:14}}>
            <button style={{...btn,flex:1}} onClick={()=>{
              const socText = narratives[`soc_${activeSoc.id}`];
              if(socText?.trim()) logPattern("socratic_evidence",socText,{boss:K.boss.name,question:activeSoc.name});
              const newHp=Math.max(0,bossHp-activeSoc.damage);
              setBossHp(newHp);setSocUsed([...socUsed,activeSoc.id]);setActiveSoc(null);addXp(12);
              if(newHp<=20&&newHp>0) setTimeout(()=>setBossPhase("counter"),400);
            }}>⚔️ Answer with evidence →</button>
            <button style={{...btnSec,flex:1}} onClick={()=>setActiveSoc(null)}>← Back</button>
          </div>
        </div>}

        {bossPhase==="counter" && <div style={{animation:"fadeUp 0.4s ease both"}}>
          <div style={{background:"rgba(255,30,60,0.06)",border:"1px solid rgba(255,30,60,0.2)",borderRadius:14,padding:"14px 16px",marginBottom:14,animation:"shake 0.4s ease"}}>
            <p style={{fontSize:10,fontFamily:M,color:"#ff6b7f",letterSpacing:1,marginBottom:6}}>⚡ COUNTERATTACK</p>
            <p style={{margin:0,fontSize:15,fontStyle:"italic",color:"#ff8a9e",lineHeight:1.5}}>"Just accept it. You've always known. Stop fighting."</p>
          </div>
          <CoachBubble name="Aria" mood="idle" showChar={false}><span>It's trying to get you to surrender. But feeling something doesn't make it true — and you've already proven that.</span></CoachBubble>
          <ScienceNote text="Schema 'counterattacks' mimic the schema maintenance cycle — old beliefs fight back when challenged. This is expected and temporary."/>
          <button style={{...btn,background:"linear-gradient(135deg,#5d9ce8,#3a7bd5)"}} onClick={()=>{addXp(10);setBossHp(Math.max(0,bossHp-10));setBossPhase("defense");}}>
            🛡️ Stand Firm — "I don't have to accept this."
          </button>
        </div>}

        {bossPhase==="forge" && <div style={{animation:"fadeUp 0.4s ease both"}}>
          <CoachBubble name="Aria" mood="idle" showChar={false}>
            <span>You've gathered evidence on both sides. What's the most accurate thing you can say? Not the most positive — the most true.</span>
          </CoachBubble>
          <div style={{background:"rgba(74,222,128,0.04)",border:"1px solid rgba(74,222,128,0.15)",borderRadius:14,padding:18,marginTop:12}}>
            <p style={{fontSize:10,fontFamily:M,color:"#4ade80",letterSpacing:1,marginBottom:14}}>🔨 THE REFRAME FORGE</p>
            {[
              `I have real struggles AND real strengths. ${B.belief.replace(/\./,"")} is a pattern, not a verdict.`,
              `The evidence isn't all one-sided. Some of what ${B.name} says connects to real pain — but it leaves out everything that contradicts it.`,
              `I can hold this honestly: I've been hurt, and I've also survived, adapted, and grown. Both are true.`
            ].map((r,i)=>(
              <div key={i} style={{...card,marginBottom:8,...(hov===`forge${i}`?cardHov:{}),fontSize:14,lineHeight:1.5,borderColor:"rgba(74,222,128,0.15)"}}
                onClick={()=>{addXp(25);setBossHp(0);setBossPhase("transform");}}
                onMouseEnter={()=>setHov(`forge${i}`)} onMouseLeave={()=>setHov(null)}>"{r}"</div>
            ))}
          </div>
        </div>}

        {bossPhase==="transform" && <div style={{animation:"fadeUp 0.5s ease both",textAlign:"center"}}>
          <div style={{background:"rgba(155,93,229,0.04)",border:"1px solid rgba(155,93,229,0.15)",borderRadius:18,padding:"24px 20px",marginBottom:20}}>
            <p style={{fontSize:14,fontStyle:"italic",color:"rgba(255,255,255,0.45)",marginBottom:16,lineHeight:1.6}}>"{B.transformLine}"</p>
            <div style={{width:50,height:1,background:"rgba(155,93,229,0.25)",margin:"0 auto 16px"}}/>
            <p style={{fontSize:10,fontFamily:M,color:"#9B5DE5",letterSpacing:1,marginBottom:8}}>TRANSFORMED</p>
            <BossChar type={B.tIcon} color="#9B5DE5" size={80} hp={0} transformed={true} style={{margin:"0 auto 8px"}}/>
            <h3 style={{fontFamily:D,fontSize:22,fontWeight:700,marginBottom:6}}>{B.transformed}</h3>
            <p style={{fontSize:15,color:"rgba(255,255,255,0.6)",lineHeight:1.6,fontStyle:"italic"}}>"{B.wisdom}"</p>
          </div>
          <CoachBubble name="Aria" mood="idle" showChar={false}>
            <span>This voice wasn't your enemy. It was a protection that outgrew its purpose. You don't need it to be this loud anymore.</span>
          </CoachBubble>
          <ScienceNote text="Schema transformation doesn't mean deleting the belief — it means reducing its emotional charge and creating a balanced alternative that acknowledges both pain and resilience."/>
          <div style={{textAlign:"left"}}>
            <JournalBox value={battleNarr.bossForge} onChange={v=>{setBattleNarr(p=>({...p,bossForge:v}));}}
              prompt={POST_TRANSFORM_PROMPTS[result?.pk] || "What would change if you carried this wisdom forward?"} accent="#9B5DE5"/>
          </div>
          <div style={{marginTop:10}}><span style={{...tag,borderColor:"#ffc832",color:"#ffc832"}}>🃏 Wisdom Card Unlocked</span></div>
          <button style={{...btn,marginTop:14}} onClick={()=>{if(battleNarr.bossForge?.trim()){addXp(10);logPattern("boss_transform",battleNarr.bossForge,{boss:B.name,transformed:B.transformed,wisdom:B.wisdom});}go("rerate");}}>Continue →</button>
        </div>}

        <div style={{textAlign:"right",marginTop:8}}><span style={xpBadge}>+{xp} XP</span></div>
      </div></Screen>
    );
  }

  // ═══════════════════════════════════════
  // POST RE-RATE
  // ═══════════════════════════════════════
  if(scr==="rerate") return (
    <Screen kingdom={K}><div style={{opacity:fade?0:1,transition:"opacity 0.5s"}}>
      <CoachBubble name="Kai" mood="idle" delay={0.1}>
        {show && <Typewriter text={`Before we started, that feeling was at ${ans.intensity}. Where is it now?`} speed={25}/>}
      </CoachBubble>
      <div style={{textAlign:"center",marginTop:28,animation:"fadeUp 0.5s ease 0.4s both"}}>
        <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:24,marginBottom:20}}>
          <div style={{textAlign:"center"}}><div style={{fontSize:12,fontFamily:M,color:"rgba(255,255,255,0.35)",marginBottom:4}}>BEFORE</div><div style={{fontSize:32,fontFamily:D,fontWeight:700,color:"#e85d5d"}}>{ans.intensity}</div></div>
          <div style={{fontSize:22,color:"rgba(255,255,255,0.2)"}}>→</div>
          <div style={{textAlign:"center"}}><div style={{fontSize:12,fontFamily:M,color:"rgba(255,255,255,0.35)",marginBottom:4}}>NOW</div><div style={{fontSize:32,fontFamily:D,fontWeight:700,color:"#4ade80"}}>{postInt}</div></div>
        </div>
        <input type="range" min={0} max={100} value={postInt} onChange={e=>setPostInt(+e.target.value)}
          style={{width:"100%",maxWidth:280,height:6,WebkitAppearance:"none",background:"rgba(155,93,229,0.2)",borderRadius:4,outline:"none",cursor:"pointer"}}/>
      </div>
      {ans.intensity-postInt>0 && <CoachBubble name="Kai" mood="happy" showChar={false} delay={0.6}>
        <span>{ans.intensity-postInt>=20 ? "That's a real shift. Not because you pretended it away — because you looked at it honestly."
         : "Movement. Even a small shift means something connected."}</span>
      </CoachBubble>}
      <ScienceNote text="Pre/post intensity ratings measure Subjective Units of Distress (SUDs). Even small reductions indicate schema processing has occurred."/>
      <JournalBox value={battleNarr.rerate} onChange={v=>{setBattleNarr(p=>({...p,rerate:v}));}}
        prompt={RERATE_PROMPTS[result?.pk] || "Looking back on this session — what stands out? What will you carry with you?"} accent={K.accent} expandable={false}/>
      <button style={{...btn,marginTop:14}} onClick={()=>{if(battleNarr.rerate?.trim()){addXp(10);logPattern("session_reflection",battleNarr.rerate,{delta:ans.intensity-postInt});}go("summary");}}>See Results →</button>
    </div></Screen>
  );

  // ═══════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════
  if(scr==="summary") return (
    <Screen kingdom={K}><div style={{opacity:fade?0:1,transition:"opacity 0.5s"}}>
      <div style={{textAlign:"center",animation:"fadeUp 0.4s ease 0.1s both"}}>
        <div style={{fontSize:12,fontFamily:M,color:`${K.accent}88`,letterSpacing:1,marginBottom:6}}>⚔️ BATTLE COMPLETE</div>
        <h2 style={{fontFamily:D,fontSize:22,fontWeight:700,marginBottom:4}}>{K.name}</h2>
        <p style={{fontSize:13,color:"rgba(255,255,255,0.35)",margin:"0 0 20px"}}>{K.boss.name} → {K.boss.transformed}</p>
      </div>
      <div style={{...card,borderColor:"rgba(74,222,128,0.15)",marginBottom:14,animation:"fadeUp 0.4s ease 0.3s both"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          {[{l:"Thoughts Reframed",v:"4"},{l:"Emotion Delta",v:`${ans.intensity} → ${postInt}`},{l:"Distortions Found",v:"3"},{l:"Socratic Moves",v:`${socUsed.length}`}].map((s,i)=>(
            <div key={i}><div style={{fontSize:10,fontFamily:M,color:"rgba(255,255,255,0.3)",marginBottom:3}}>{s.l}</div><div style={{fontSize:15,fontWeight:600}}>{s.v}</div></div>
          ))}
        </div>
      </div>
      {/* Schema scores */}
      <div style={{animation:"fadeUp 0.4s ease 0.5s both",marginBottom:14}}>
        <div style={{fontSize:10,fontFamily:M,color:"rgba(255,255,255,0.3)",marginBottom:8}}>SCHEMA PROFILE</div>
        {result?.top?.slice(0,4).map((s,i)=>(
          <div key={s.code} style={{marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3}}>
              <span>{SCHEMAS[s.code].icon} {SCHEMAS[s.code].name}</span>
              <span style={{fontFamily:M,color:i===0?K.accent:"rgba(255,255,255,0.4)"}}>{s.score}</span>
            </div>
            <div style={{height:5,background:"rgba(155,93,229,0.1)",borderRadius:3,overflow:"hidden"}}>
              <div style={{...hpBar(Math.round(s.score/(result.maxScore||1)*100),i===0?K.accent:"rgba(155,93,229,0.5)"),animation:`growBar 0.8s ease ${0.2+i*0.15}s both`}}/>
            </div>
          </div>
        ))}
      </div>
      {/* PATTERNS OBSERVED — full journal entries from this session */}
      {journal.length > 0 && <div style={{animation:"fadeUp 0.4s ease 0.6s both",marginBottom:16}}>
        <div style={{fontSize:10,fontFamily:M,color:"rgba(155,93,229,0.5)",letterSpacing:1,marginBottom:10}}>📝 YOUR JOURNAL ({journal.length} {journal.length===1?"entry":"entries"})</div>
        <div style={{background:"rgba(155,93,229,0.04)",border:"1px solid rgba(155,93,229,0.12)",borderRadius:14,padding:"14px 16px",maxHeight:320,overflowY:"auto"}}>
          {journal.map((entry,i) => (
            <div key={i} style={{marginBottom:i<journal.length-1?14:0,paddingBottom:i<journal.length-1?14:0,borderBottom:i<journal.length-1?"1px solid rgba(155,93,229,0.08)":"none"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <span style={{fontSize:9,fontFamily:M,color:"rgba(155,93,229,0.4)",letterSpacing:0.5,textTransform:"uppercase"}}>{entry.moment?.replace(/_/g," ")}</span>
                {entry.minion && <span style={{fontSize:9,fontFamily:M,color:"rgba(255,255,255,0.15)"}}>{entry.minion}</span>}
                {entry.boss && <span style={{fontSize:9,fontFamily:M,color:"rgba(255,255,255,0.15)"}}>{entry.boss}</span>}
              </div>
              <p style={{fontSize:14,lineHeight:1.6,color:"rgba(255,255,255,0.6)",margin:0,fontStyle:"italic"}}>{entry.text}</p>
            </div>
          ))}
        </div>
        {journal.length>=2 && <div style={{marginTop:8,padding:"8px 12px",background:"rgba(74,222,128,0.03)",border:"1px solid rgba(74,222,128,0.08)",borderRadius:10}}>
          <p style={{fontSize:11,fontFamily:M,color:"rgba(74,222,128,0.45)",margin:0,lineHeight:1.5}}>
            🧠 {journal.length} reflections captured. These entries build a picture of your thinking patterns over time.
          </p>
        </div>}
        {/* Export actions */}
        <div style={{display:"flex",gap:8,marginTop:8}}>
          <button onClick={()=>exportJournal("copy")} style={{flex:1,padding:"8px 12px",background:"rgba(155,93,229,0.06)",border:"1px solid rgba(155,93,229,0.15)",borderRadius:10,color:"#c4a8e8",fontFamily:M,fontSize:11,cursor:"pointer",transition:"all 0.2s"}}>📋 Copy Journal</button>
          <button onClick={()=>exportJournal("download")} style={{flex:1,padding:"8px 12px",background:"rgba(155,93,229,0.06)",border:"1px solid rgba(155,93,229,0.15)",borderRadius:10,color:"#c4a8e8",fontFamily:M,fontSize:11,cursor:"pointer",transition:"all 0.2s"}}>📥 Download .txt</button>
        </div>
        {exportMsg && <div style={{padding:"6px 10px",background:"rgba(74,222,128,0.08)",borderRadius:8,marginTop:6,fontSize:11,color:"#4ade80",textAlign:"center",animation:"fadeUp 0.3s ease both"}}>{exportMsg}</div>}
      </div>}
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:20,animation:"fadeUp 0.4s ease 0.7s both"}}>
        <span style={xpBadge}>🏆 {xp+25} XP Total</span>
        <span style={{...tag,borderColor:"rgba(74,222,128,0.25)",color:"#4ade80"}}>💎 3 Fragments</span>
        <span style={{...tag,borderColor:"rgba(255,200,50,0.25)",color:"#ffc832"}}>🃏 Wisdom Card</span>
        {journal.length>0 && <span style={{...tag,borderColor:"rgba(155,93,229,0.25)",color:"#c4a8e8"}}>📝 {journal.length} Patterns</span>}
      </div>
      <button style={btn} onClick={()=>go("mission")}>Continue →</button>
    </div></Screen>
  );

  // ═══════════════════════════════════════
  // MISSION — behavioral experiments + goal setting
  // ═══════════════════════════════════════
  if(scr==="mission") {
    const pk = result?.pk || "DF";
    const missions = {
      AB: [
        { name: "The Presence Practice", desc: "Notice one moment today where someone is still here. Text them or tell them it mattered.", cat: "short" },
        { name: "The Evidence Log", desc: "Each evening this week, write one piece of evidence that someone cares about you. Small counts.", cat: "short" },
        { name: "The Reaching Out", desc: "Initiate contact with someone you've been avoiding because you 'know' they'll leave. Notice what happens vs. what you predicted.", cat: "medium" },
        { name: "The Secure Base Inventory", desc: "Make a list of 3 relationships that have lasted despite difficulty. Reflect on what sustained them.", cat: "medium" },
      ],
      ED: [
        { name: "The Ask", desc: "Ask one person for something small today. Notice what happens — not what you predicted.", cat: "short" },
        { name: "The Need Statement", desc: "Practice saying 'I need...' to someone safe this week. Start small. Track how it felt.", cat: "short" },
        { name: "The Receiving Practice", desc: "When someone offers help this week, say yes instead of 'I'm fine.' Journal what comes up.", cat: "medium" },
        { name: "The Self-Care Audit", desc: "Identify one area where you consistently deprioritize your own needs. Make one concrete change.", cat: "medium" },
      ],
      DF: [
        { name: "The Visibility Practice", desc: "Share one genuine opinion with someone today. Even a small one. Notice what happens.", cat: "short" },
        { name: "The Mirror Exercise", desc: "Write 3 things about yourself that are true — not perfect, just true. Read them aloud.", cat: "short" },
        { name: "The Imperfection Share", desc: "Tell someone one thing you usually hide about yourself this week. Track their actual response.", cat: "medium" },
        { name: "The Shame Inventory", desc: "Identify your top 3 shame triggers. For each, write what a compassionate friend would say.", cat: "medium" },
      ],
      FA: [
        { name: "The Good Enough Challenge", desc: "Complete one task today and call it done at 80%. Notice the urge to keep perfecting.", cat: "short" },
        { name: "The Attempt Log", desc: "Try something you might fail at this week. Afterwards, write what you learned — not whether you succeeded.", cat: "short" },
        { name: "The Growth Reframe", desc: "Review a past 'failure.' Write 3 things it taught you that you couldn't have learned any other way.", cat: "medium" },
        { name: "The Competence Map", desc: "Ask 2 people what they see as your strengths. Compare their answers to your self-assessment.", cat: "medium" },
      ],
      SI: [
        { name: "The Initiation", desc: "Start one conversation today. It doesn't have to be deep — just initiated by you.", cat: "short" },
        { name: "The Belonging Scan", desc: "In your next group setting, notice one moment where you contributed something. Write it down.", cat: "short" },
        { name: "The Connection Experiment", desc: "Join one group activity this week where you don't know everyone. Observe: did the feared rejection happen?", cat: "medium" },
        { name: "The Similarity Search", desc: "In conversations this week, actively notice shared experiences instead of differences.", cat: "medium" },
      ],
      MS: [
        { name: "The Small Trust", desc: "Share one small piece of information with someone you're testing trust with. Notice the impulse to retract.", cat: "short" },
        { name: "The Vulnerability Dose", desc: "Let someone see one imperfection this week — arriving late, not knowing an answer. Track what happens.", cat: "short" },
        { name: "The Trust Thermometer", desc: "Rate your trust in 3 key relationships (1-10). For the lowest, identify one small step to test if more trust is warranted.", cat: "medium" },
        { name: "The Control Release", desc: "Delegate one task you normally control this week. Notice the anxiety, then notice the outcome.", cat: "medium" },
      ],
      SJ: [
        { name: "The Gentle No", desc: "Decline one request today — even a tiny one. 'Not right now' counts.", cat: "short" },
        { name: "The Needs Inventory", desc: "Write down 3 things you need this week that you haven't asked for. Pick one and voice it.", cat: "short" },
        { name: "The Boundary Practice", desc: "Identify one relationship where you consistently over-give. Set one small boundary this week.", cat: "medium" },
        { name: "The Anger Journal", desc: "When you feel resentment this week, write what need went unmet. Practice seeing anger as information.", cat: "medium" },
      ],
      US: [
        { name: "The Imperfect Submit", desc: "Send or submit one thing today without your final review pass. Let it be imperfect on purpose.", cat: "short" },
        { name: "The Rest Experiment", desc: "Take a 20-minute break today with no productivity. Journal the thoughts and feelings that arise.", cat: "short" },
        { name: "The Enough Inventory", desc: "Write down everything you accomplished this week. Read the list without adding what you 'should' have done.", cat: "medium" },
        { name: "The Standard Audit", desc: "Identify your top 3 'rules' for yourself. For each, ask: who set this standard? Is it serving me?", cat: "medium" },
      ],
    };
    const mList = missions[pk] || missions.DF;
    const toggleCal = (task) => setCalTasks(prev => prev.some(t=>t.name===task.name) ? prev.filter(t=>t.name!==task.name) : [...prev,task]);
    const isInCal = (task) => calTasks.some(t=>t.name===task.name);

    return (
      <Screen kingdom={K}><div style={{opacity:fade?0:1,transition:"opacity 0.5s"}}>
        <CoachBubble name="Aria" mood="idle" showChar={false} delay={0.1}>
          {show && <Typewriter text="You've done the work in here. Now — what will you carry out there? Behavioral experiments are how schemas actually change." speed={20} onDone={()=>setTwDone(true)}/>}
        </CoachBubble>

        {twDone && <div style={{animation:"fadeUp 0.4s ease both"}}>
        <ScienceNote text="Behavioral experiments are the single most effective technique for schema change (Young et al., 2003). Real-world testing generates emotional evidence your brain can't dismiss as 'just thinking.'"/>

        {/* Suggested experiments */}
        <div style={{marginTop:14}}>
          <div style={{fontSize:10,fontFamily:M,color:`${K.accent}88`,letterSpacing:1,marginBottom:10}}>📋 SUGGESTED EXPERIMENTS</div>
          {mList.map((mi,i)=>(
            <div key={i} style={{...card,marginBottom:8,borderColor:isInCal(mi)?`${K.accent}44`:"rgba(255,255,255,0.06)",background:isInCal(mi)?"rgba(74,222,128,0.04)":"rgba(255,255,255,0.02)",transition:"all 0.3s",animation:`fadeUp 0.3s ease ${0.05*i}s both`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                    <span style={{fontSize:9,fontFamily:M,padding:"2px 8px",borderRadius:8,background:mi.cat==="short"?"rgba(93,156,232,0.1)":"rgba(155,93,229,0.1)",color:mi.cat==="short"?"#5d9ce8":"#9B5DE5",letterSpacing:0.5}}>{mi.cat==="short"?"THIS WEEK":"THIS MONTH"}</span>
                  </div>
                  <h4 style={{fontFamily:D,fontSize:15,fontWeight:600,marginBottom:4}}>{mi.name}</h4>
                  <p style={{fontSize:13,lineHeight:1.55,color:"rgba(255,255,255,0.5)",margin:0}}>{mi.desc}</p>
                </div>
                <button onClick={()=>toggleCal(mi)} style={{flexShrink:0,width:36,height:36,borderRadius:10,border:`1px solid ${isInCal(mi)?"#4ade80":K.accent+"33"}`,background:isInCal(mi)?"rgba(74,222,128,0.1)":"transparent",color:isInCal(mi)?"#4ade80":"rgba(255,255,255,0.3)",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s"}}>
                  {isInCal(mi)?"✓":"+"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Wisdom reminder */}
        <div style={{...card,borderColor:"rgba(155,93,229,0.12)",marginTop:4,textAlign:"center",fontSize:13,color:"rgba(255,255,255,0.4)",fontStyle:"italic"}}>
          💡 {K.boss.transformed} says: "{K.boss.wisdom}"
        </div>

        {/* Custom goals */}
        <div style={{marginTop:18}}>
          <div style={{fontSize:10,fontFamily:M,color:`${K.accent}88`,letterSpacing:1,marginBottom:10}}>✍️ YOUR OWN INTENTIONS</div>
          {[
            {key:"short",label:"Today or this week",placeholder:"One small thing I want to try...",color:"#5d9ce8"},
            {key:"medium",label:"This month",placeholder:"A pattern I want to work on...",color:"#9B5DE5"},
            {key:"long",label:"Longer term",placeholder:"Who I'm growing toward...",color:"#4ade80"},
          ].map(g=>(
            <div key={g.key} style={{marginBottom:10}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:g.color}}/>
                <span style={{fontSize:11,fontFamily:M,color:g.color,letterSpacing:0.5}}>{g.label}</span>
              </div>
              <textarea value={missionGoals[g.key]} onChange={e=>setMissionGoals(p=>({...p,[g.key]:e.target.value}))} maxLength={300}
                placeholder={g.placeholder}
                style={{width:"100%",minHeight:48,background:"rgba(0,0,0,0.15)",border:`1px solid ${g.color}20`,borderRadius:10,padding:"10px 12px",color:"#e8e0f0",fontFamily:F,fontSize:13,resize:"vertical",outline:"none",lineHeight:1.5,boxSizing:"border-box"}}/>
            </div>
          ))}
        </div>

        {/* Calendar / Reminder actions */}
        <div style={{marginTop:14,padding:"16px 18px",background:"rgba(74,222,128,0.03)",border:"1px solid rgba(74,222,128,0.1)",borderRadius:14}}>
          <div style={{fontSize:10,fontFamily:M,color:"#4ade80",letterSpacing:1,marginBottom:10}}>📅 SAVE TO CALENDAR & REMINDERS</div>
          <p style={{fontSize:12,color:"rgba(255,255,255,0.4)",lineHeight:1.5,margin:"0 0 12px"}}>
            {calTasks.length>0 || Object.values(missionGoals).some(v=>v.trim())
              ? `${calTasks.length} experiment${calTasks.length!==1?"s":""} selected${Object.values(missionGoals).some(v=>v.trim())?" + your personal intentions":""}. Save them so you remember.`
              : "Select experiments above or write your own — then save them here."}
          </p>
          {exportMsg && <div style={{padding:"8px 12px",background:"rgba(74,222,128,0.1)",border:"1px solid rgba(74,222,128,0.2)",borderRadius:8,marginBottom:10,fontSize:12,color:"#4ade80",textAlign:"center",animation:"fadeUp 0.3s ease both"}}>{exportMsg}</div>}
          <div style={{display:"flex",gap:8}}>
            <button style={{...btn,flex:1,fontSize:13,padding:"12px 10px",background:calTasks.length||Object.values(missionGoals).some(v=>v.trim())?"linear-gradient(135deg,#5d9ce8,#3a7bd5)":"rgba(255,255,255,0.05)",opacity:calTasks.length||Object.values(missionGoals).some(v=>v.trim())?1:0.4}} onClick={()=>{
              if(missionGoals.short?.trim()) logPattern("goal_short_term",missionGoals.short,{});
              if(missionGoals.medium?.trim()) logPattern("goal_medium_term",missionGoals.medium,{});
              if(missionGoals.long?.trim()) logPattern("goal_long_term",missionGoals.long,{});
              calTasks.forEach(t=>logPattern("experiment_selected",t.name+": "+t.desc,{category:t.cat}));
              addToCalendar();
            }}>📅 Add to Calendar</button>
            <button style={{...btn,flex:1,fontSize:13,padding:"12px 10px",background:calTasks.length||Object.values(missionGoals).some(v=>v.trim())?"linear-gradient(135deg,#9B5DE5,#7b3db5)":"rgba(255,255,255,0.05)",opacity:calTasks.length||Object.values(missionGoals).some(v=>v.trim())?1:0.4}} onClick={()=>{
              if(missionGoals.short?.trim()) logPattern("goal_short_term",missionGoals.short,{});
              if(missionGoals.medium?.trim()) logPattern("goal_medium_term",missionGoals.medium,{});
              if(missionGoals.long?.trim()) logPattern("goal_long_term",missionGoals.long,{});
              calTasks.forEach(t=>logPattern("experiment_selected",t.name+": "+t.desc,{category:t.cat}));
              addToReminders();
            }}>🔔 Add to Reminders</button>
          </div>
          <button style={{...btn,width:"100%",marginTop:8,fontSize:13,padding:"10px",background:"rgba(255,255,255,0.04)"}} onClick={()=>go("complete")}>Continue →</button>
        </div>

        <button style={{...btnSec,marginTop:12,width:"100%"}} onClick={()=>{
          if(missionGoals.short?.trim()) logPattern("goal_short_term",missionGoals.short,{});
          if(missionGoals.medium?.trim()) logPattern("goal_medium_term",missionGoals.medium,{});
          if(missionGoals.long?.trim()) logPattern("goal_long_term",missionGoals.long,{});
          go("complete");
        }}>Skip for now →</button>
        </div>}
      </div></Screen>
    );
  }

  // ═══════════════════════════════════════
  // SESSION COMPLETE
  // ═══════════════════════════════════════
  if(scr==="complete") return (
    <Screen><div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center",opacity:fade?0:1,transition:"opacity 0.5s",paddingTop:20}}>
      <div style={{animation:"fadeUp 0.5s ease 0.2s both"}}>
        <BossChar type={K?.boss?.tIcon||"discerner"} color="#9B5DE5" size={80} hp={0} transformed={true} style={{margin:"0 auto 20px"}}/>
      </div>
      <h2 style={{fontFamily:D,fontSize:26,fontWeight:700,marginBottom:6,animation:"fadeUp 0.5s ease 0.4s both"}}>Session Complete</h2>
      <p style={{fontSize:14,color:"rgba(255,255,255,0.4)",lineHeight:1.6,maxWidth:300,marginBottom:6,animation:"fadeUp 0.5s ease 0.5s both"}}>{K?.boss?.transformed||"The Discerner"} has taken its place in {K?.name||"the Kingdom"}.</p>
      <p style={{fontSize:14,fontStyle:"italic",color:"rgba(155,93,229,0.6)",maxWidth:280,marginBottom:20,animation:"fadeUp 0.5s ease 0.6s both"}}>"{K?.boss?.wisdom||"I can see myself clearly."}"</p>
      <div style={{display:"flex",flexWrap:"wrap",justifyContent:"center",gap:6,marginBottom:20,animation:"fadeUp 0.5s ease 0.8s both"}}>
        <span style={xpBadge}>🏆 {xp+25} XP</span>
        <span style={tag}>🔥 Streak: 1</span>
        <span style={tag}>🃏 Cards: 1</span>
        {journal.length>0 && <span style={{...tag,borderColor:"rgba(155,93,229,0.25)",color:"#c4a8e8"}}>📝 {journal.length} Journal Entries</span>}
        {calTasks.length>0 && <span style={{...tag,borderColor:"rgba(74,222,128,0.25)",color:"#4ade80"}}>🧪 {calTasks.length} Experiments</span>}
      </div>

      {/* Session takeaway */}
      {journal.length>0 && <div style={{width:"100%",maxWidth:380,animation:"fadeUp 0.5s ease 0.9s both"}}>
        <div style={{background:"rgba(155,93,229,0.04)",border:"1px solid rgba(155,93,229,0.12)",borderRadius:14,padding:"14px 16px",marginBottom:12,textAlign:"left"}}>
          <div style={{fontSize:10,fontFamily:M,color:"rgba(155,93,229,0.5)",letterSpacing:1,marginBottom:8}}>📝 YOUR JOURNAL</div>
          <div style={{maxHeight:180,overflowY:"auto"}}>
            {journal.slice(-5).map((entry,i)=>(
              <div key={i} style={{marginBottom:i<Math.min(journal.length,5)-1?8:0,paddingBottom:i<Math.min(journal.length,5)-1?8:0,borderBottom:i<Math.min(journal.length,5)-1?"1px solid rgba(155,93,229,0.06)":"none"}}>
                <span style={{fontSize:9,fontFamily:M,color:"rgba(155,93,229,0.35)",letterSpacing:0.5,textTransform:"uppercase"}}>{entry.moment?.replace(/_/g," ")}</span>
                <p style={{fontSize:12,lineHeight:1.5,color:"rgba(255,255,255,0.5)",margin:"2px 0 0",fontStyle:"italic"}}>{entry.text.length>120?entry.text.slice(0,120)+"…":entry.text}</p>
              </div>
            ))}
            {journal.length>5 && <p style={{fontSize:10,color:"rgba(155,93,229,0.3)",fontFamily:M,margin:"6px 0 0"}}>+ {journal.length-5} more entries</p>}
          </div>
        </div>
        {/* Export bar */}
        <div style={{display:"flex",gap:6,marginBottom:16}}>
          <button onClick={()=>exportJournal("copy")} style={{flex:1,padding:"8px 10px",background:"rgba(155,93,229,0.06)",border:"1px solid rgba(155,93,229,0.15)",borderRadius:10,color:"#c4a8e8",fontFamily:M,fontSize:11,cursor:"pointer"}}>📋 Copy</button>
          <button onClick={()=>exportJournal("download")} style={{flex:1,padding:"8px 10px",background:"rgba(155,93,229,0.06)",border:"1px solid rgba(155,93,229,0.15)",borderRadius:10,color:"#c4a8e8",fontFamily:M,fontSize:11,cursor:"pointer"}}>📥 Download</button>
          {calTasks.length>0 && <button onClick={addToCalendar} style={{flex:1,padding:"8px 10px",background:"rgba(93,156,232,0.06)",border:"1px solid rgba(93,156,232,0.15)",borderRadius:10,color:"#5d9ce8",fontFamily:M,fontSize:11,cursor:"pointer"}}>📅 Calendar</button>}
        </div>
        {exportMsg && <div style={{padding:"6px 10px",background:"rgba(74,222,128,0.08)",borderRadius:8,marginBottom:12,fontSize:11,color:"#4ade80",textAlign:"center",animation:"fadeUp 0.3s ease both"}}>{exportMsg}</div>}
      </div>}

      <button style={{...btn,maxWidth:260,animation:"fadeUp 0.5s ease 1s both",background:"linear-gradient(135deg,#e8a849,#d4783a)"}} onClick={()=>{setSurveySection(0);setSurveyFade(true);go("survey");}}>
        📋 Share Your Feedback →
      </button>
      <button style={{...btnSec,maxWidth:260,marginTop:8,animation:"fadeUp 0.5s ease 1.1s both"}} onClick={()=>{
        setScr("portal");setFade(false);setAns({emotions:[],intensity:50,trigger:null,person:null,meaning:null,truthRating:50,familiarity:null,onset:null,copingUrge:null,unmetNeed:null});
        setNarr({emotion:"",trigger:"",meaning:"",coping:"",need:""});setEntry(null);setResult(null);setDisambQ(null);setSafety("OK");
        setMIdx(0);setMStep("appear");setSelDist(null);setSelRef(null);setBossHp(100);setBossPhase("entry");
        setEvSel([]);setSocUsed([]);setActiveSoc(null);setPostInt(3);setXp(0);setTwDone(false);setBreathStep(0);
        setBattleNarr({defuse:"",defuseJournal:"",trap:"",reframe:"",resolved:"",bossEntry:"",bossForge:"",postBattle:"",rerate:""});
        setMissionGoals({short:"",medium:"",long:""});setCalTasks([]);setExportMsg("");
        setGroundMode("breathe");setSenseAnswers({see:"",hear:"",touch:"",smell:"",taste:""});setGroundReflect("");
        setTimeout(()=>setShow(true),300);
      }}>Return to Portal →</button>
      <p style={{fontSize:11,color:"rgba(255,255,255,0.15)",fontFamily:M,marginTop:16,animation:"fadeUp 0.5s ease 1.2s both"}}>No penalties for being human.</p>
    </div></Screen>
  );

  // ═══════════════════════════════════════
  // SURVEY — Full feedback collection
  // ═══════════════════════════════════════
  if(scr==="survey") {
    const ss=surveySection;
    const sf=surveyFade;
    const sUp=surveyUpdate;
    const sNext=()=>surveyNav(Math.min(ss+1,SURVEY_SECTIONS.length-1));
    const sPrev=()=>surveyNav(Math.max(ss-1,0));
    const sBtnP={padding:"14px 36px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#7b4fcf,#9b5de5)",color:"#fff",fontSize:16,fontWeight:700,fontFamily:"'Nunito',sans-serif",cursor:"pointer",boxShadow:"0 4px 20px rgba(123,79,207,0.3)"};
    const sBtnS={padding:"14px 28px",borderRadius:12,border:"1px solid #2a2a4a",background:"transparent",color:"#8892b0",fontSize:15,fontWeight:600,fontFamily:"'Nunito',sans-serif",cursor:"pointer"};
    const sTitle=(icon,title,sub)=>(<div style={{marginBottom:32}}>
      <div style={{fontSize:32,marginBottom:8}}>{icon}</div>
      <h2 style={{fontSize:26,fontWeight:800,margin:"0 0 8px 0",background:"linear-gradient(135deg,#e8a849,#e8d5b0)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",fontFamily:"'Playfair Display',serif"}}>{title}</h2>
      <p style={{fontSize:14,color:"#6d7a9c",margin:0,lineHeight:1.6}}>{sub}</p>
    </div>);
    const sNav=(showBack=true,nextLabel="Continue",onNext=sNext)=>(<div style={{display:"flex",justifyContent:showBack?"space-between":"flex-end",marginTop:32,gap:12}}>
      {showBack&&<button onClick={sPrev} style={sBtnS}>← Back</button>}
      <button onClick={onNext} style={sBtnP}>{nextLabel} →</button>
    </div>);
    const sPct=Math.round((ss/(SURVEY_SECTIONS.length-1))*100);

    const sCard={maxWidth:680,margin:"0 auto",padding:"36px 32px",borderRadius:20,
      background:"linear-gradient(145deg,rgba(18,18,40,0.92),rgba(12,12,28,0.96))",
      border:"1px solid rgba(123,79,207,0.2)",boxShadow:"0 20px 60px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.04)",
      backdropFilter:"blur(20px)",opacity:sf?1:0,transform:sf?"translateY(0)":"translateY(12px)",transition:"opacity 0.3s ease, transform 0.3s ease"};

    return (
      <div style={{width:"100%",minHeight:"100vh",fontFamily:"'Nunito',sans-serif",color:"#d0d8f0",padding:"40px 20px 60px",
        background:"#0a0a1a url('') no-repeat",position:"relative",
        backgroundImage:"radial-gradient(ellipse at 20% 20%,rgba(123,79,207,0.08),transparent 60%),radial-gradient(ellipse at 80% 80%,rgba(232,168,73,0.06),transparent 60%)"}}>

        <div style={{maxWidth:680,margin:"0 auto",position:"relative",zIndex:1}}>
          {ss>0&&ss<SURVEY_SECTIONS.length-1&&<div style={{marginBottom:24}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <span style={{fontSize:12,color:"#6d7a9c"}}>{SURVEY_SECTIONS[ss]}</span>
              <span style={{fontSize:12,color:"#6d7a9c"}}>{sPct}%</span>
            </div>
            <div style={{height:4,borderRadius:2,background:"#1a1a35",overflow:"hidden"}}>
              <div style={{height:"100%",width:`${sPct}%`,borderRadius:2,background:"linear-gradient(90deg,#7b4fcf,#e8a849)",transition:"width 0.5s ease"}}/>
            </div>
          </div>}

          <div style={sCard}>
            {/* S0: Welcome */}
            {ss===0&&<div style={{textAlign:"center",padding:"20px 0"}}>
              <div style={{fontSize:56,marginBottom:16}}>🌌</div>
              <h1 style={{fontSize:34,fontWeight:800,margin:"0 0 8px 0",background:"linear-gradient(135deg,#e8a849,#d4783a,#e8d5b0)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",fontFamily:"'Playfair Display',serif",lineHeight:1.2}}>InnerWorlds: The Schema Quest</h1>
              <p style={{fontSize:16,color:"#9b5de5",fontWeight:600,margin:"0 0 20px 0",letterSpacing:2,textTransform:"uppercase"}}>Prototype Feedback Survey</p>
              <div style={{background:"rgba(123,79,207,0.08)",borderRadius:16,padding:"24px 20px",border:"1px solid rgba(123,79,207,0.15)",marginBottom:24,textAlign:"left"}}>
                <p style={{fontSize:15,color:"#b0bcd8",margin:"0 0 14px 0",lineHeight:1.7}}>Thank you for exploring our prototype! Your feedback is invaluable in shaping the future of InnerWorlds — a therapeutic experience where you explore your inner thought patterns through guided, interactive exercises.</p>
                <p style={{fontSize:15,color:"#b0bcd8",margin:"0 0 14px 0",lineHeight:1.7}}>This survey takes about <strong style={{color:"#e8a849"}}>8–10 minutes</strong> and covers your experience, what resonated, what could improve, and your interest in the full version.</p>
                <p style={{fontSize:13,color:"#6d7a9c",margin:0,lineHeight:1.6}}>All responses are anonymous and confidential. There are no right or wrong answers.</p>
              </div>
              <button onClick={sNext} style={{...sBtnP,padding:"16px 48px",fontSize:18}}>Begin Survey →</button>
            </div>}

            {/* S1: About You */}
            {ss===1&&<>{sTitle("👤","About You","Help us understand who you are so we can better interpret your feedback.")}
              <SQ label="What is your age range?"><SurveySelect value={surveyData.age} onChange={v=>sUp("age",v)} placeholder="Select your age range" options={["Under 18","18–24","25–34","35–44","45–54","55–64","65+"]}/></SQ>
              <SQ label="How would you describe your gender?" sublabel="Optional"><SurveySelect value={surveyData.gender} onChange={v=>sUp("gender",v)} placeholder="Select or skip" options={["Female","Male","Non-binary","Prefer to self-describe","Prefer not to say"]}/></SQ>
              <SQ label="How familiar are you with mental health or wellness apps?"><SurveySelect value={surveyData.mentalHealthFamiliarity} onChange={v=>sUp("mentalHealthFamiliarity",v)} placeholder="Select one" options={["Never used one","Tried one briefly","Use one occasionally","Use one regularly","I've tried many different ones"]}/></SQ>
              <SQ label="Which mental health or self-improvement tools have you used?" sublabel="Select all that apply"><SurveyCheckboxes options={["Therapy apps (e.g. BetterHelp, Talkspace)","Meditation apps (e.g. Headspace, Calm)","Journaling apps","In-person therapy","Self-help books","Support groups or peer communities","Wellness games or gamified tools","None of the above"]} selected={surveyData.currentTools} onChange={v=>sUp("currentTools",v)}/></SQ>
              {sNav(false)}
            </>}

            {/* S2: First Impressions */}
            {ss===2&&<>{sTitle("✨","First Impressions","Think back to the moment you first opened the prototype.")}
              <SQ label="What was your very first reaction when you saw InnerWorlds?" required><SurveyText value={surveyData.firstReaction} onChange={v=>sUp("firstReaction",v)} placeholder="Describe your initial gut feeling — what did you think and feel?"/></SQ>
              <SQ label="The concept of exploring and reframing thought patterns through interactive exercises was clear to me." required><SurveyLikert value={surveyData.conceptClarity} onChange={v=>sUp("conceptClarity",v)}/></SQ>
              <SQ label="The concept behind InnerWorlds appeals to me personally." required><SurveyLikert value={surveyData.conceptAppeal} onChange={v=>sUp("conceptAppeal",v)}/></SQ>
              <SQ label="What stood out to you most — positively or negatively?"><SurveyText value={surveyData.whatStoodOut} onChange={v=>sUp("whatStoodOut",v)} placeholder="A visual, a feature, a feeling, an idea — anything that stuck with you"/></SQ>
              {sNav()}
            </>}

            {/* S3: Experience & Usability */}
            {ss===3&&<>{sTitle("🎮","Experience & Usability","How did it feel to actually use the prototype?")}
              <SQ label="The prototype was easy to understand and navigate." required><SurveyLikert value={surveyData.easeOfUse} onChange={v=>sUp("easeOfUse",v)}/></SQ>
              <SQ label="I knew where to go and what to do at each step." required><SurveyLikert value={surveyData.navigationClarity} onChange={v=>sUp("navigationClarity",v)}/></SQ>
              <SQ label="Rate the visual design and overall look of the prototype." required><SurveyStarRating value={surveyData.visualAppeal} onChange={v=>sUp("visualAppeal",v)} labels={["Poor","Below Average","Average","Good","Excellent"]}/></SQ>
              <SQ label="Were there any moments where you felt confused, lost, or frustrated?"><SurveyText value={surveyData.confusingElements} onChange={v=>sUp("confusingElements",v)} placeholder="Describe any points of confusion, even small ones"/></SQ>
              {sNav()}
            </>}

            {/* S4: Strengths & Value */}
            {ss===4&&<>{sTitle("💎","Strengths & Value","What did InnerWorlds do well? We want to double down on what works.")}
              <SQ label="Which features or elements did you enjoy the most?" sublabel="Select all that apply" required><SurveyCheckboxes options={["The thought pattern reframing exercises","The AI-guided coaching (Kai)","The journaling system","The visual design and atmosphere","The schema therapy concepts presented","The onboarding experience","The adaptive coach prompts","The overall narrative and framing"]} selected={surveyData.favoriteFeatures} onChange={v=>sUp("favoriteFeatures",v)}/></SQ>
              <SQ label="Why did those features resonate with you?"><SurveyText value={surveyData.favoriteFeatureWhy} onChange={v=>sUp("favoriteFeatureWhy",v)} placeholder="What made them compelling, useful, or enjoyable?"/></SQ>
              <SQ label="InnerWorlds offers something unique compared to other wellness/therapy tools I've seen." required><SurveyLikert value={surveyData.uniqueValue} onChange={v=>sUp("uniqueValue",v)}/></SQ>
              <SQ label="I would recommend this concept to a friend dealing with difficult thoughts or emotions." required><SurveyLikert value={surveyData.wouldRecommend} onChange={v=>sUp("wouldRecommend",v)}/></SQ>
              {sNav()}
            </>}

            {/* S5: Areas to Improve */}
            {ss===5&&<>{sTitle("🔧","Areas to Improve","Honest critique helps us build something truly great. Nothing is off limits.")}
              <SQ label="What frustrated you or didn't work well?" required><SurveyText value={surveyData.frustratingParts} onChange={v=>sUp("frustratingParts",v)} placeholder="Bugs, confusing flows, things that fell flat..." rows={4}/></SQ>
              <SQ label="Was there anything you expected to find but didn't?"><SurveyText value={surveyData.missingFeatures} onChange={v=>sUp("missingFeatures",v)} placeholder="Features, information, or interactions you were looking for"/></SQ>
              <SQ label="Which areas need the most improvement?" sublabel="Select your top priorities"><SurveyCheckboxes options={["Visual design and polish","Clarity of instructions / onboarding","Depth of therapeutic content","Variety of activities and interactions","Personalization to my needs","Speed and performance","Emotional safety and tone","Length or pacing of sessions"]} selected={surveyData.improvementPriority} onChange={v=>sUp("improvementPriority",v)}/></SQ>
              {sNav()}
            </>}

            {/* S6: Feature Ideas */}
            {ss===6&&<>{sTitle("💡","Feature Ideas","Help us dream bigger. What would make InnerWorlds something you'd love to use?")}
              <SQ label="Which potential features excite you the most?" sublabel="Select all that interest you"><SurveyCheckboxes options={["Immersive 3D worlds to explore","Battle mechanics for confronting thought patterns","Multiplayer / co-op therapeutic quests","Voice-guided meditation experiences","Customizable avatar that reflects your growth","Progress tracking with visual journey maps","Daily challenges and streak rewards","Integration with a real therapist","Community forums and peer support","Mood-responsive environments that adapt to you"]} selected={surveyData.desiredFeatures} onChange={v=>sUp("desiredFeatures",v)}/></SQ>
              <SQ label="Any feature ideas of your own?" sublabel="No idea is too wild"><SurveyText value={surveyData.featureIdeas} onChange={v=>sUp("featureIdeas",v)} placeholder="What would make this your dream app? What would keep you coming back?" rows={4}/></SQ>
              {sNav()}
            </>}

            {/* S7: Therapeutic Impact */}
            {ss===7&&<>{sTitle("🌿","Therapeutic Impact","This is the heart of InnerWorlds — how it makes you feel.")}
              <SQ label="The therapeutic concepts (thought patterns, reframing) felt relevant to my real life." required><SurveyLikert value={surveyData.therapeuticRelevance} onChange={v=>sUp("therapeuticRelevance",v)}/></SQ>
              <SQ label="I felt engaged and drawn in while using the prototype." required><SurveyLikert value={surveyData.engagementLevel} onChange={v=>sUp("engagementLevel",v)}/></SQ>
              <SQ label="The experience felt emotionally safe and supportive." required><SurveyLikert value={surveyData.safetyComfort} onChange={v=>sUp("safetyComfort",v)}/></SQ>
              <SQ label="I can see a quest-based approach being more appealing than traditional therapy apps." required><SurveyLikert value={surveyData.preferOverTraditional} onChange={v=>sUp("preferOverTraditional",v)}/></SQ>
              <SQ label="Any other thoughts on the therapeutic elements?"><SurveyText value={surveyData.therapeuticFeedback} onChange={v=>sUp("therapeuticFeedback",v)} placeholder="Did anything feel too clinical? Not clinical enough? Just right?"/></SQ>
              {sNav()}
            </>}

            {/* S8: Pricing & Interest */}
            {ss===8&&<>{sTitle("💰","Pricing & Interest","Help us understand how you'd value a finished version.")}
              <SQ label="How likely are you to use a completed version of InnerWorlds?" required><SurveyLikert value={surveyData.purchaseIntent} onChange={v=>sUp("purchaseIntent",v)} labels={likelihoodLabels}/></SQ>
              <SQ label="What would you expect a monthly subscription to cost?" sublabel="Think about the full experience: AI coaching, journaling, therapeutic exercises, schema-based quests."><SurveySelect value={surveyData.priceExpectation} onChange={v=>sUp("priceExpectation",v)} placeholder="Select a price range" options={["Free with ads","$1 – $4.99/month","$5 – $9.99/month","$10 – $14.99/month","$15 – $19.99/month","$20+/month","I'd prefer a one-time purchase"]}/></SQ>
              <SQ label="At what monthly price would it start to feel too expensive?"><SurveyInput value={surveyData.priceTooExpensive} onChange={v=>sUp("priceTooExpensive",v)} placeholder="e.g. $15/month"/></SQ>
              <SQ label="At what price would it feel like a great deal?"><SurveyInput value={surveyData.priceBargain} onChange={v=>sUp("priceBargain",v)} placeholder="e.g. $5/month"/></SQ>
              <SQ label="Which payment model appeals to you most?"><SurveySelect value={surveyData.subscriptionPreference} onChange={v=>sUp("subscriptionPreference",v)} placeholder="Select your preference" options={["Free version with optional premium upgrade","Monthly subscription","Annual subscription (with discount)","One-time purchase","Pay-per-module / per-quest","Covered by insurance or employer"]}/></SQ>
              <SQ label="What would increase your willingness to pay?" sublabel="Select all that apply"><SurveyCheckboxes options={["Proven clinical effectiveness","Personalized AI that learns my patterns","Regular new content and worlds","Integration with my therapist","Community and social features","Offline access","Family plan or sharing option","Recommendation from a trusted source"]} selected={surveyData.paymentFactors} onChange={v=>sUp("paymentFactors",v)}/></SQ>
              {sNav()}
            </>}

            {/* S9: Final Thoughts */}
            {ss===9&&<>{sTitle("🎯","Final Thoughts","Last questions — then you're done!")}
              <SQ label="Rate your overall experience with the InnerWorlds prototype." required><SurveyStarRating value={surveyData.overallRating} onChange={v=>sUp("overallRating",v)} labels={["Very Poor","Poor","Okay","Good","Excellent"]}/></SQ>
              <SQ label="Describe InnerWorlds in one word or phrase." required><SurveyInput value={surveyData.oneWordReaction} onChange={v=>sUp("oneWordReaction",v)} placeholder="The first thing that comes to mind..."/></SQ>
              <SQ label="How likely are you to recommend InnerWorlds to someone you care about?" required>
                <div style={{display:"flex",gap:0,borderRadius:12,overflow:"hidden",border:"1px solid #2a2a4a"}}>
                  {[0,1,2,3,4,5,6,7,8,9,10].map(n=>(
                    <button key={n} type="button" onClick={()=>sUp("recommendLikelihood",n)}
                      style={{flex:1,padding:"12px 0",fontSize:14,fontWeight:surveyData.recommendLikelihood===n?700:400,
                        color:surveyData.recommendLikelihood===n?"#0d0d1a":"#6d7a9c",
                        background:surveyData.recommendLikelihood===n?(n<=6?"#e85d5d":n<=8?"#e8a849":"#5de87b"):"rgba(20,20,40,0.6)",
                        border:"none",cursor:"pointer",fontFamily:"'Nunito',sans-serif",
                        borderRight:n<10?"1px solid #2a2a4a":"none"}}>{n}</button>
                  ))}
                </div>
                <div style={{display:"flex",justifyContent:"space-between",marginTop:6,fontSize:11,color:"#4d5775"}}><span>Not at all likely</span><span>Extremely likely</span></div>
              </SQ>
              <SQ label="Is there anything else you'd like to share?" sublabel="Dreams, concerns, ideas, critiques — all welcome"><SurveyText value={surveyData.additionalFeedback} onChange={v=>sUp("additionalFeedback",v)} placeholder="Anything goes here..." rows={4}/></SQ>
              <div style={{background:"rgba(123,79,207,0.08)",borderRadius:14,padding:"20px 18px",border:"1px solid rgba(123,79,207,0.15)",marginTop:8,marginBottom:8}}>
                <SQ label="Want to stay in the loop?" sublabel="Leave your email for updates on InnerWorlds. Completely optional."><SurveyInput value={surveyData.contactEmail} onChange={v=>sUp("contactEmail",v)} placeholder="your@email.com" type="email"/></SQ>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:32,gap:12}}>
                <button onClick={sPrev} style={sBtnS}>← Back</button>
                <button onClick={()=>submitSurvey("webhook")} style={{...sBtnP,background:"linear-gradient(135deg,#e8a849,#d4783a)"}}>Submit Survey ✨</button>
              </div>
            </>}

            {/* S10: Thank You */}
            {ss===10&&<div style={{textAlign:"center",padding:"30px 0"}}>
              <div style={{fontSize:64,marginBottom:16}}>🌟</div>
              <h2 style={{fontSize:32,fontWeight:800,margin:"0 0 12px 0",background:"linear-gradient(135deg,#5de87b,#e8a849)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",fontFamily:"'Playfair Display',serif"}}>Thank You, Adventurer!</h2>
              <p style={{fontSize:16,color:"#b0bcd8",lineHeight:1.7,maxWidth:480,margin:"0 auto 20px"}}>Your feedback lights the path forward for InnerWorlds. Every response helps us build a more meaningful, engaging, and healing experience.</p>
              <div style={{background:"rgba(93,232,123,0.08)",borderRadius:14,padding:"20px",border:"1px solid rgba(93,232,123,0.15)",maxWidth:420,margin:"0 auto 24px"}}>
                <p style={{fontSize:14,color:"#8892b0",margin:0,lineHeight:1.6}}>Your response has been recorded. {surveyData.contactEmail?"We'll keep you updated on our progress. ":""}Together, we're building worlds that heal. 🌍✨</p>
              </div>
              <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
                <button onClick={()=>submitSurvey("download")} style={{...sBtnS,fontSize:13,padding:"10px 20px"}}>📥 Download my response</button>
                <button onClick={()=>{go("portal");setSurveySection(0);}} style={{...sBtnP,fontSize:14,padding:"12px 28px"}}>Return to Portal →</button>
              </div>
            </div>}
          </div>

          {ss>0&&ss<SURVEY_SECTIONS.length-1&&<p style={{textAlign:"center",fontSize:12,color:"#3a3a5c",marginTop:20}}>Section {ss} of {SURVEY_SECTIONS.length-2} · Your progress is saved as you go</p>}
        </div>
      </div>
    );
  }

  return null;
}



// ══════════════════════════════════════════════════════════════
// GLOBAL STYLES
// ══════════════════════════════════════════════════════════════
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500&family=Playfair+Display:wght@700;0,800&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;0,9..144,700;1,9..144,400&family=DM+Sans:wght@400;500;600&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @keyframes warmDrift { 0% { transform: translate(0,0) scale(1); } 50% { transform: translate(30px,-20px) scale(1.05); } 100% { transform: translate(-20px,30px) scale(0.95); } }
  @keyframes warmFadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  @keyframes warmPulse { 0%,100% { opacity:0.3; } 50% { opacity:0.5; } }
  @keyframes warmGlow { 0%,100% { box-shadow: 0 0 40px rgba(123,166,142,0.15); } 50% { box-shadow: 0 0 60px rgba(123,166,142,0.25); } }
  @keyframes gatewayOpen { 0% { transform:scale(0.2); opacity:0; filter:blur(20px); } 60% { transform:scale(1.1); opacity:0.8; filter:blur(2px); } 100% { transform:scale(1); opacity:1; filter:blur(0); } }
  @keyframes gatewayPulse { 0%,100% { transform:scale(1); box-shadow: 0 0 40px rgba(155,93,229,0.3); } 50% { transform:scale(1.03); box-shadow: 0 0 60px rgba(155,93,229,0.5); } }
  @keyframes warmKaiBg { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
  @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
  @keyframes floatP { 0% { transform:translateY(0) translateX(0) rotate(0deg); opacity:0; } 10% { opacity:0.2; } 90% { opacity:0.2; } 100% { transform:translateY(-100vh) translateX(25px) rotate(360deg); opacity:0; } }
  @keyframes pulse { 0%,100% { transform:scale(1); opacity:1; } 50% { transform:scale(1.05); opacity:0.85; } }
  @keyframes orbit { 0% { transform:rotate(0deg); } 100% { transform:rotate(360deg); } }
  @keyframes blink { 50% { opacity:0; } }
  @keyframes shake { 0%,100% { transform:translateX(0); } 25% { transform:translateX(-3px) rotate(-1deg); } 75% { transform:translateX(3px) rotate(1deg); } }
  @keyframes growBar { from { width:0; } }
  @keyframes scanPulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.5; transform:scale(1.3); } }
  @keyframes orbFloat { 0%,100% { transform:translateY(0); opacity:0.6; } 50% { transform:translateY(-4px); opacity:1; } }
  @keyframes handWave { 0%,100% { transform:rotate(0deg); } 25% { transform:rotate(-15deg); } 75% { transform:rotate(15deg); } }
  @keyframes kaiBreathe { 0%,100% { transform:scaleY(1); } 50% { transform:scaleY(1.015); } }
  @keyframes kaiBlink { 0%,42%,44%,100% { transform:scaleY(1); } 43% { transform:scaleY(0.1); } }
  @keyframes kaiThinkEye { 0%,100% { transform:scaleY(1) translateX(0); } 50% { transform:scaleY(0.9) translateX(1px); } }
  @keyframes kaiHappyEye { 0%,100% { transform:scaleY(0.7); } 50% { transform:scaleY(0.5); } }
  @keyframes kaiLean { 0%,100% { transform:rotate(0deg); } 50% { transform:rotate(1.5deg) translateX(1px); } }
  @keyframes kaiWaveBody { 0%,100% { transform:rotate(0deg); } 25% { transform:rotate(-2deg); } 75% { transform:rotate(2deg); } }
  @keyframes minionFloat { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-6px); } }
  @keyframes minionBlink { 0%,45%,47%,100% { transform:scaleY(1); } 46% { transform:scaleY(0.15); } }
  @keyframes bossFloat { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-5px); } }
  @keyframes bossShake { 0%,100% { transform:translateX(0); } 25% { transform:translateX(-2px) rotate(-0.5deg); } 75% { transform:translateX(2px) rotate(0.5deg); } }
  @keyframes bossTransform { 0% { transform:scale(1) rotate(0deg); filter:drop-shadow(0 0 15px rgba(232,93,93,0.4)); } 50% { transform:scale(0.6) rotate(180deg); filter:drop-shadow(0 0 30px rgba(155,93,229,0.8)) brightness(2); } 100% { transform:scale(1) rotate(360deg); filter:drop-shadow(0 0 15px rgba(155,93,229,0.5)); } }
  @keyframes bossAura { 0%,100% { transform:scale(1); opacity:0.4; } 50% { transform:scale(1.05); opacity:0.6; } }
  @keyframes bossBlink { 0%,48%,50%,100% { transform:scaleY(1); } 49% { transform:scaleY(0.2); } }
  input[type="range"]::-webkit-slider-thumb { -webkit-appearance:none; width:22px; height:22px; border-radius:50%; background:#9B5DE5; cursor:pointer; box-shadow:0 0 10px rgba(155,93,229,0.4); }
  input[type="range"]::-moz-range-thumb { width:22px; height:22px; border-radius:50%; border:none; background:#9B5DE5; cursor:pointer; box-shadow:0 0 10px rgba(155,93,229,0.4); }
  textarea::placeholder { color:rgba(255,255,255,0.2); }
  textarea:focus { border-color:rgba(155,93,229,0.4); }
`;
document.head.appendChild(styleSheet);
