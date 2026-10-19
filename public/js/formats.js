// The five lesson formats: colours, artwork, planning prompts and time-plan templates.
// plan: [name, hint, share of the time]; core: which part absorbs rounding;
// descFrom: which prompt answer describes each part of the outline (null = use the hint).

export const ORDER = ['talk', 'demo', 'disc', 'show', 'read'];

export const FORMATS = {
  talk: {
    label: 'Talk', legend: 'Talk', cardLabel: 'Talk', planLabel: 'talk', icon: 'mic',
    blurb: 'Share one big idea, out loud. No slides needed.',
    bg: '#E4EEFB', fg: '#1D4F8F', dot: '#3A7BD5', heroInk: '#26405F',
    art: '<svg width="60" height="60" viewBox="0 0 64 64" aria-hidden="true"><path d="M12 12h36a8 8 0 0 1 8 8v14a8 8 0 0 1-8 8H28l-10 8v-8h-6a8 8 0 0 1-8-8V20a8 8 0 0 1 8-8z" fill="#3A7BD5"/><path d="M15 24h28M15 31h18" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round"/><circle cx="56" cy="10" r="4" fill="#9CC0EE"/><circle cx="8" cy="54" r="3" fill="#9CC0EE"/></svg>',
    heading: 'Shape your talk',
    prompts: [
      { q: "What's the one big idea?", hint: 'If people remember one sentence, what is it?', ph: 'e.g. Every flat map has to stretch something.', rows: 2 },
      { q: 'A story or example', hint: 'Something real makes it stick.', ph: 'e.g. The day I learned Greenland is smaller than it looks', rows: 2 },
      { q: 'What do people get wrong?', hint: 'A common myth you can gently fix.', ph: "e.g. That there's one 'correct' map", rows: 2 }
    ],
    plan: [['Intro', 'Hook them, then say the big idea', 0.15], ['Core idea', 'Walk through it, step by step', 0.6], ['Example', 'Tell your story', 0.15], ['Check-in', 'Questions and one takeaway', 0.1]],
    core: 1, ramp: ['#7FAAE6', '#1D4F8F', '#3A7BD5', '#BCD3F3'], descFrom: [0, null, 1, null]
  },
  demo: {
    label: 'Live demo', legend: 'Demo', cardLabel: 'Live demo', planLabel: 'live demo', icon: 'screen',
    blurb: 'Make or do something while everyone watches.',
    bg: '#DDF2EA', fg: '#11684F', dot: '#1F9A78', heroInk: '#2F4A40',
    art: '<svg width="60" height="60" viewBox="0 0 64 64" aria-hidden="true"><rect x="6" y="10" width="52" height="36" rx="8" fill="#1F9A78"/><path d="M27 20v16l13-8z" fill="#FFFFFF"/><rect x="20" y="51" width="24" height="5" rx="2.5" fill="#8FD3BE"/><circle cx="56" cy="8" r="4" fill="#8FD3BE"/></svg>',
    heading: 'Plan your demo',
    prompts: [
      { q: 'What will you make or do?', hint: 'Name the finished thing.', ph: 'e.g. A bubbly sourdough starter', rows: 2 },
      { q: 'The steps, in order', hint: 'A few words each, one per line.', ph: '1. Mix flour and water\n2. Wait a day\n3. Feed it', rows: 4 },
      { q: 'What could go wrong?', hint: 'Name it now so it is not scary later.', ph: "e.g. It might not bubble on day one, and that's fine", rows: 2 }
    ],
    plan: [['Intro', 'What we are making today', 0.15], ['Show it', 'Do it slowly, out loud', 0.4], ['Your turn', 'Everyone has a go', 0.3], ['Wrap-up', 'What went wrong and why that is fine', 0.15]],
    core: 1, ramp: ['#62C3A5', '#11684F', '#1F9A78', '#AEE3D2'], descFrom: [0, 1, null, 2]
  },
  disc: {
    label: 'Discussion', legend: 'Discussion', cardLabel: 'Discussion / workshop', planLabel: 'discussion', icon: 'bubbles',
    blurb: 'Bring good questions and think it through together.',
    bg: '#ECE6FA', fg: '#5232A3', dot: '#7B5AD4', heroInk: '#3D2F66',
    art: '<svg width="60" height="60" viewBox="0 0 64 64" aria-hidden="true"><rect x="4" y="8" width="36" height="26" rx="10" fill="#7B5AD4"/><path d="M12 33l-2 9 10-8z" fill="#7B5AD4"/><rect x="24" y="26" width="36" height="26" rx="10" fill="#BCA9EC"/><path d="M52 51l2 9-10-8z" fill="#BCA9EC"/><circle cx="15" cy="21" r="2.5" fill="#FFFFFF"/><circle cx="22" cy="21" r="2.5" fill="#FFFFFF"/><circle cx="29" cy="21" r="2.5" fill="#FFFFFF"/></svg>',
    heading: 'Plan the conversation',
    prompts: [
      { q: 'Your opening question', hint: 'Something everyone can answer.', ph: "e.g. What's the best question anyone has asked you?", rows: 2 },
      { q: '2 or 3 follow-ups', hint: 'For when it goes quiet. One per line.', ph: 'What made it good?\nWho asks the best questions you know?', rows: 3 },
      { q: 'The hoped-for takeaway', hint: 'Where would you love the room to land?', ph: 'e.g. Good questions are curious, not clever', rows: 2 }
    ],
    plan: [['Opening question', 'Everyone answers, briefly', 0.15], ['Follow-ups', 'Dig in together', 0.5], ['Takeaways', 'What did we land on?', 0.25], ['Check-in', 'One word each', 0.1]],
    core: 1, ramp: ['#A68EE3', '#3E2585', '#7B5AD4', '#D3C7F3'], descFrom: [0, 1, 2, null]
  },
  show: {
    label: 'Show-and-tell', legend: 'Show-and-tell', cardLabel: 'Show-and-tell', planLabel: 'show-and-tell', icon: 'gift',
    blurb: 'Bring a few things you love and tell their story.',
    bg: '#FBEFD0', fg: '#744F00', dot: '#D99A12', heroInk: '#4D3A0B',
    art: '<svg width="60" height="60" viewBox="0 0 64 64" aria-hidden="true"><rect x="10" y="30" width="44" height="28" rx="5" fill="#D99A12"/><rect x="6" y="22" width="52" height="11" rx="4" fill="#F0C455"/><path d="M32 22v36" stroke="#FFFFFF" stroke-width="3.5"/><path d="M32 3l2.4 5 5.5.8-4 3.9.9 5.4-4.8-2.6-4.9 2.6 1-5.4-4-3.9 5.5-.8z" fill="#D99A12"/></svg>',
    heading: 'Pick what to show',
    prompts: [
      { q: 'What are you bringing?', hint: 'Two or three things is plenty. One per line.', ph: 'An old film camera\nA roll of negatives', rows: 3 },
      { q: 'Why does each one matter?', hint: 'A line of story per item.', ph: 'e.g. My grandad took it on every holiday', rows: 2 },
      { q: 'What should people notice?', hint: "The detail you'd point at.", ph: 'e.g. The tiny scratches on the lens', rows: 2 }
    ],
    plan: [['Intro', 'Why you brought these', 0.1], ['Item by item', 'Story and the detail to notice', 0.6], ['Questions', 'Pass things around', 0.2], ['Check-in', 'Favourite item, anyone?', 0.1]],
    core: 1, ramp: ['#EDC15A', '#744F00', '#D99A12', '#F7DFA0'], descFrom: [1, 0, 2, null]
  },
  read: {
    label: 'Read-and-react', legend: 'Read-and-react', cardLabel: 'Read-and-react', planLabel: 'read-and-react', icon: 'book',
    blurb: 'Share a short piece, then unpack it together.',
    bg: '#FAE3EB', fg: '#962553', dot: '#D24E7C', heroInk: '#5C2238',
    art: '<svg width="60" height="60" viewBox="0 0 64 64" aria-hidden="true"><path d="M4 16c9-5 19-5 28 2v36c-9-6-19-6-28-2z" fill="#D24E7C"/><path d="M60 16c-9-5-19-5-28 2v36c9-6 19-6 28-2z" fill="#F0A3BF"/><path d="M38 26c5-2 10-2 15 0M38 34c5-2 10-2 15 0" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/></svg>',
    heading: 'Set up the reading',
    prompts: [
      { q: 'Link to share', hint: 'An article, poem, page or post. Short is best.', ph: 'https://', rows: 1 },
      { q: 'What to look for', hint: 'Give people something to hunt for while reading.', ph: 'e.g. Notice where the writer changes their mind', rows: 2 },
      { q: 'Questions to unpack it', hint: 'Two or three, one per line.', ph: 'Did you agree?\nWhat would you add?', rows: 3 }
    ],
    plan: [['Read together', 'Quiet reading or read aloud', 0.3], ['What to look for', 'Point people at the good bit', 0.1], ['Unpack it', 'Work through your questions', 0.45], ['Check-in', 'What stuck with you?', 0.15]],
    core: 2, ramp: ['#E58AAB', '#F4C5D6', '#962553', '#D24E7C'], descFrom: [null, 1, 2, null]
  }
};

export function suggestPlan(format, len) {
  const t = FORMATS[format];
  const mins = t.plan.map((s) => Math.max(1, Math.round(s[2] * len)));
  const others = mins.reduce((sum, m, i) => sum + (i === t.core ? 0 : m), 0);
  mins[t.core] = Math.max(1, len - others);
  return mins;
}

export const REACTIONS = ['Thank you!', 'Learned something new', 'Want a part two', 'Made me laugh'];
