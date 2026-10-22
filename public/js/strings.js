// Every piece of text in the app, in English and Arabic.
// {name} style placeholders are filled in by t(). Plurals use Intl.PluralRules categories.
// Newer words live in strings-more.js and are merged in at the bottom.

import { MORE } from './strings-more.js';
import { VIDEOS } from './strings-videos.js';

export const STRINGS = {
  en: {
    langName: 'English',
    common: {
      back: 'Back', close: 'Close', cancel: 'Cancel', save: 'Save', edit: 'Edit', remove: 'Remove',
      optional: 'Optional', you: 'You', and: ' and ', loading: 'Loading…',
      oops: "Hmm, that didn't work", backToCalendar: 'Back to the calendar',
      offlineTitle: "You're offline", offlineBody: 'Teach Club needs the internet to show lessons. Check your connection and try again.',
      tryAgain: 'Try again', somethingWrong: 'Something went wrong. Please try again.',
      network: "Couldn't reach Teach Club. Check your connection and try again.",
      date: 'Date', time: 'Time', length: 'Length', saving: 'Saving…'
    },
    plural: {
      lessons: { zero: 'no lessons', one: '{n} lesson', other: '{n} lessons' },
      friends: { one: '{n} friend', other: '{n} friends' },
      min: { one: '{n} min', other: '{n} min' },
      minLong: { one: '{n} minute', other: '{n} minutes' },
      thanks: { one: '{n} thank-you', other: '{n} thank-yous' },
      notes: { one: '{n} note', other: '{n} notes' },
      days: { one: '{n} day', other: '{n} days' },
      members: { one: '{n} member', other: '{n} members' },
      votes: { one: '{n} vote', other: '{n} votes' },
      wantPartTwo: { one: '{n} friend wants a part two!', other: '{n} friends want a part two!' }
    },
    club: {
      startTitle: 'Your club', startHeading: 'Find your club', startLede: 'Teach Club works in small private clubs. Start one for your friends, or join one with an invite link.',
      createTitle: 'Start a club', namePh: 'e.g. Thursday Nerds', create: 'Create my club', creating: 'Creating…',
      joinTitle: 'Have an invite link?', joinPh: 'Paste the link or code', join: 'Join', joining: 'Joining…', badCode: "That doesn't look like an invite link.",
      title: 'Club', invite: 'Invite friends', inviteBody: 'Anyone with this link can join {club}.', copy: 'Copy link', share: 'Share', copied: 'Invite link copied!',
      shareText: 'Join {club} on Teach Club', newLink: 'Make a new link', newLinkConfirm: 'Make a new invite link? The old one will stop working.', newLinkDone: 'New invite link ready.',
      members: 'Members', admin: 'Admin', youTag: '(you)', makeAdmin: 'Make admin', removeAdmin: 'Remove admin', remove: 'Remove',
      removeConfirm: 'Remove {name} from {club}? Their upcoming lessons here will be cancelled.', removed: 'Removed from the club.',
      leave: 'Leave this club', leaveConfirm: 'Leave {club}? Your upcoming lessons here will be cancelled.', left: 'You left the club.',
      rename: 'Rename', renamePrompt: 'New club name', renamed: 'Club renamed.', yourClubs: 'Your clubs', current: 'Current', switchTo: 'Switch',
      switched: 'Switched to {club}.', another: 'Start or join another club', reports: 'Reports', noReports: 'No open reports. All calm.',
      reportBy: 'Reported by {name}', reportOn: 'Lesson: “{title}”', reportOnMember: 'Member: {name}', resolve: 'Mark as handled', resolved: 'Report handled.',
      deleteLesson: 'Delete lesson', deleteLessonConfirm: 'Delete this lesson for everyone?', wrapped: 'See {year} Wrapped', manage: 'Manage',
      joinTitlePage: 'Join a club', joinHeading: 'Join {club}', joinLede: '{members} already. Friends teaching friends, a few minutes at a time.',
      joinButton: 'Join the club', joined: "You're in! Welcome to {club}.", badInvite: "Hmm, that invite link doesn't work", needAccount: "Make an account first and you'll join right after.",
      signup: 'Create my account', login: 'I have an account'
    },
    wishes: {
      title: 'Teach me…', lede: 'What would you love to learn? Add it here, and someone in the club might teach it.',
      addTitle: "I'd love to learn…", titlePh: 'e.g. How to make really good coffee', detailsPh: 'Anything specific? (optional)', add: 'Add my wish', adding: 'Adding…', added: 'Wish added!',
      empty: 'No wishes yet. Be the first to ask!', by: 'Asked by {name}', vote: 'Me too', voted: 'Voted', teach: "I'll teach this",
      taught: '{name} is teaching this', seeLesson: 'See the lesson', remove: 'Delete', removeConfirm: 'Delete this wish?', open: 'Open wishes', done: 'Being taught'
    },
    present: {
      title: 'Presenting', start: 'Start', pause: 'Pause', resume: 'Resume', next: 'Next part', prev: 'Previous part', plus: '+1 min', minus: '−1 min',
      finish: 'Finish', upNext: 'Up next: {name}', last: 'Last part!', overtime: 'Over time', done: "That's a wrap! Nice teaching.", back: 'Back to lesson',
      noPlan: 'This lesson has no time plan yet.', awake: 'Your screen stays on while presenting.', partOf: 'Part {n} of {total}', total: '{done} of {total} done'
    },
    report: {
      title: 'Report', lessonHeading: 'Report this lesson', memberHeading: 'Report {name}', lede: "Only this club's admins will see your report.",
      reasons: { spam: 'Spam or advertising', offensive: 'Rude or offensive', unsafe: 'Unsafe or harmful', other: 'Something else' },
      detailsPh: 'Tell the admins what happened (optional)', send: 'Send report', sending: 'Sending…', sent: 'Thanks. The club admins will take a look.', pick: 'Pick a reason.'
    },
    account: {
      title: 'Delete account', heading: 'Delete your account?', lede: "This removes your profile, lessons, notes, questions and wishes for good. It can't be undone.",
      clubsNote: 'If you run a club, another member becomes its admin.', password: 'Type your password to confirm', remove: 'Delete my account forever',
      removing: 'Deleting…', done: 'Your account has been deleted. Take care!'
    },
    privacy: {
      title: 'Privacy', heading: 'Privacy, in plain words', updated: 'Last updated: October 2026',
      sections: [
        { h: 'What we keep', p: 'Your name, email, password (scrambled, never readable, not even by us), the photo and bio you add, and what you do in the app: lessons, RSVPs, notes, questions, wishes and reports.' },
        { h: 'Who sees it', p: 'Only members of the clubs you are in. Your email is never shown to other members. Club admins see reports made in their club.' },
        { h: 'Emails', p: 'We email you only for password resets and lesson reminders. You can turn reminders off in Edit profile. Emails are sent through Resend.' },
        { h: 'Where it lives', p: 'The app and its database run on Cloudflare. Your data is never sold or shared, and there are no ads or trackers. One cookie keeps you logged in.' },
        { h: 'Your choices', p: 'Edit your profile any time, leave clubs, or delete your account from Edit profile. Deleting removes your data from the app straight away.' }
      ]
    },
    wrapped: {
      title: 'Wrapped', heading: '{year} Wrapped', soFar: '{club} · so far this year', clubTitle: 'The club', youTitle: 'You',
      lessons: '{lessons} taught', minutes: '{minutes} of learning together', teachers: '{friends} took a turn teaching',
      topTeacher: 'Most lessons: {name} ({lessons})', topLesson: 'Most thanked: “{title}”', topFormat: 'Favourite format: {format}', busiest: 'Busiest month: {month}',
      taught: 'You taught {lessons}', taughtMin: '{minutes} of teaching', attended: 'You joined {lessons}', learned: '{minutes} of learning',
      myFormat: 'Your go-to format: {format}', fan: 'Your biggest fan: {name}', thanks: 'You got {thanks}',
      empty: 'Nothing yet this year. Teach something and come back!', share: 'Share', shareText: 'Our {year} on Teach Club: {lessons} and {minutes}.'
    },
    badges: {
      title: 'Badges', count: '{n} of {total}',
      first_lesson: ['First lesson', 'Taught a lesson'], five_lessons: ['High five', 'Taught 5 lessons'], all_formats: ['Full set', 'Tried all 5 formats'],
      regular: ['Regular', 'Went to 5 lessons'], thanks_magnet: ['Thank-you magnet', 'Got 10 thank-you notes'], night_owl: ['Night owl', 'Taught after 10 pm'],
      early_bird: ['Early bird', 'Taught before 8 am'], curious: ['Curious mind', 'Asked 3 questions'], wish_granter: ['Wish granter', "Taught someone's wish"],
      sequel: ['Sequel', 'Made a part two']
    },
    dates: {
      months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      mon: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      wdShort: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      wdLong: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      am: 'am', pm: 'pm', time: '{h}:{m} {ap}', short: '{wd} {d} {m}', long: '{wd} {d} {m}', monthYear: '{m} {y}',
      rangeSame: '{m} {a} – {b}', rangeDiff: '{ma} {a} – {mb} {b}', minShort: '{n}m'
    },
    nav: { main: 'Main', calendar: 'Calendar', profile: 'Profile', teach: 'Teach something', myLessons: 'My lessons', yourProfile: 'Your profile', wishes: 'Wishes', club: 'Club' },
    intro: {
      title: 'Welcome', skip: 'Skip', next: 'Next', join: 'Join the club', haveAccount: 'I already have an account', done: 'Back to the app',
      slideOf: 'Slide {n} of {total}', slides: 'Introduction',
      s1t: 'Welcome to Teach Club', s1b: 'A small club where friends teach each other the things they love, a few minutes at a time.',
      s2t: 'Short lessons, big fun', s2b: 'Every lesson is 5 to 30 minutes. A talk, a live demo, a show-and-tell… if you love it, it counts.',
      s3t: 'Plan it in a minute', s3b: 'Pick a day, choose a format and answer a few prompts. We split your time for you.',
      s4t: 'Say “I’m in”, then say thanks', s4b: "Join your friends' lessons, hop on the call, and leave a thank-you note afterwards.",
      s5t: 'Full honesty', s5b: 'Teach Club was made for one group of friends. And honestly? It started as a joke. Then we actually started using it.',
      s5c: 'No experts. No grades. No pressure.'
    },
    login: {
      title: 'Log in', heading: 'Welcome back', lede: 'Good to see you. Your friends have been busy.',
      forgot: 'Forgot it?', passwordPh: 'Your password', submit: 'Log in', busy: 'Logging in…',
      missing: 'Enter your email and password.', forgotToast: "Password reset isn't available yet, sorry.",
      newHere: 'New here?', join: 'Join the club', whatIs: "What's Teach Club?"
    },
    forgot: {
      title: 'Reset your password', heading: 'Forgot your password?', lede: "No worries. Type your email and we'll send you a link to choose a new one.",
      submit: 'Send me a link', busy: 'Sending…', sentTitle: 'Check your email',
      sentBody: "If there's an account for {email}, a link is on its way. It works once, for 1 hour.", spam: "Can't find it? Check your spam folder.",
      again: 'Send it again', back: 'Back to log in', errEmail: 'Type the email you signed up with.'
    },
    reset: {
      title: 'New password', heading: 'Choose a new password', lede: "Make it at least 8 characters. You'll be logged in straight after.",
      field: 'New password', submit: 'Save my new password', busy: 'Saving…', done: 'Password changed. Welcome back!',
      noToken: 'This link is missing its code. Ask for a new one.', newLink: 'Ask for a new link'
    },
    field: {
      email: 'Email', emailPh: 'you@example.com', password: 'Password', name: 'Your name', namePh: 'What friends call you',
      bio: 'What are you good at?', bioPh: 'Baking bread, chess openings, fixing bikes, bad puns…'
    },
    signup: {
      title: 'Join the club', lede: 'Friends teaching friends, a few minutes at a time. No experts required.',
      addPhoto: 'Add a photo', addPhotoHint: "Totally optional. Skip it and we'll use your initials.",
      photoGood: 'Looking good!', photoGoodHint: 'Tap the camera to change it.',
      previewAlt: 'Your profile photo preview', initialsAlt: 'Default avatar with your initials',
      upload: 'Upload a profile photo', change: 'Change your profile photo',
      passwordPh: 'At least 8 characters', show: 'Show', hide: 'Hide',
      bioHint: 'A line or two is perfect. It helps friends know what to ask you about.',
      submit: 'Create my account', busy: 'Creating your account…', already: 'Already a member?', login: 'Log in',
      errName: 'Tell us what friends call you.', errEmail: 'Add your email so you can log in later.', errPw: 'Your password needs at least 8 characters.'
    },
    welcome: {
      title: 'Welcome', heading: "You're in, {name}!", lede: "Here's the whole idea, in three easy bits.",
      i1t: 'Lessons are short', i1b: "5 to 30 minutes. That's it, never longer.",
      i2t: 'We help you plan', i2b: 'Pick a format, answer a few prompts, get a time plan.',
      i3t: 'Friends, not an audience', i3b: 'No slides, no grades. Just share what you love.',
      see: "See what's coming up", idea: 'I already have an idea'
    },
    home: {
      title: 'Calendar', hi: "Hi {name}, here's what's coming up", teachSub: "5 to 30 minutes. We'll help you plan it.",
      prev: 'Previous month', next: 'Next month', today: 'Today', todayPrefix: 'Today, ', outside: 'Outside this month',
      emptyTitle: 'Nothing planned yet', emptyPast: 'Nothing happened this day', emptyWide: 'This day is wide open.',
      emptyBody: 'This day is wide open. Got 10 minutes of something you love?', emptyPastBody: 'Pick another day to see what friends taught.',
      teachOnDay: 'Teach on this day', going: 'Going', summary: '{lessons} from {friends} this month', summaryEmpty: 'No lessons this month yet. Be the first!',
      more: '+{n} more', promoTitle: 'Know something small and fun?', promoBody: "That's a lesson. Ten minutes on how you fold a fitted sheet counts."
    },
    create: {
      titleNew: 'Teach something', titleEdit: 'Edit lesson', step: 'Step {n} of 6', editing: 'Editing · ',
      s1: 'When works for you?', s1sub: 'Pick a slot. You can always move it later.', day: 'Day', earlier: 'Earlier days', later: 'Later days',
      noneThatDay: 'Nothing else on that day yet. All yours.', oneThatDay: '{who} is teaching that day too. Cozy!', manyThatDay: '{who} are teaching that day too. Cozy!',
      startTime: 'Start time', otherTime: 'Or another time', howLong: 'How long?',
      tips: { 5: 'A quick spark.', 10: 'One idea, done well.', 15: 'Room for an example.', 20: 'A proper little lesson.', 25: 'Time to try it together.', 30: 'Plenty of room.' },
      tipTail: '30 minutes is the max. Short is the whole point.', next1: 'Next: name it',
      s2: "What's it called?", s2sub: 'A title and one line to make friends curious.', fieldTitle: 'Title', titlePh: 'Keep it short and plain', stuck: 'Stuck? Try',
      openers: [{ label: 'How I…', text: 'How I ' }, { label: 'The trick to…', text: 'The trick to ' }, { label: 'Why … matters', text: 'Why  matters', caret: 4 }, { label: 'Everything I know about…', text: 'Everything I know about ' }],
      pitch: 'One-line pitch', pitchPh: 'Why should a friend come along?', pitchHint: 'Finish this: “You’ll leave knowing…”',
      titleErr: 'Give it a title first. A few plain words is perfect.', preview: 'Preview on the calendar', yourTitle: 'Your title', yourPitch: 'Your one-line pitch', youOn: 'You · {date}', next2: 'Next: pick a format',
      s3: 'How do you want to share it?', s3sub: 'Pick the one that feels most like you.', formatGroup: 'Lesson format', notSure: 'Not sure? Talk is the easiest place to start.', next3: 'Next: shape it',
      s4sub: 'Three quick nudges. A few words each is plenty.', change: '{label} · change', skipAny: 'Skip anything. These are nudges, not homework.', next4: 'Next: time plan',
      s5: "Here's your time plan", s5sub: 'We split your {len} for a {format}. Nudge anything you like.', reset: 'Reset',
      fits: 'Fits perfectly. Nice and relaxed.', over: 'A little over: trim {mins} to fit.', spare: '{mins} spare. Room to breathe, or add it somewhere.',
      less: 'Less time for {name}', more: 'More time for {name}', next5: 'Next: review',
      s6: 'Looks great. Ready?', s6edit: 'Looking good. Save it?', s6sub: 'One last look before your friends can see it.', s6subEdit: 'Friends will see your changes right away.',
      untitled: 'Untitled lesson', classLink: 'Class link', linkPh: 'Paste your Zoom, Google Meet, or any video call link', linkHelp: 'You can add or change this later.',
      noLink: 'No link? No problem.', noLinkBody: "We'll make a free video room for this lesson automatically. You can add your own link any time.", linkAdded: 'Link added. Friends will see it once they RSVP.',
      outline: 'Your outline', whoSees: 'Who sees the outline?', showIt: 'Show it', showItSub: 'Friends can peek ahead', surprise: 'Surprise', surpriseSub: 'Keep it under wraps',
      prep: 'Anything to prep?', prepPh: 'e.g. Bring a phone with a map app open', prepHint: 'Something to read, bring or think about first.',
      publish: 'Publish to the calendar', saveChanges: 'Save changes', noPressure: 'You can edit or cancel any time. No pressure.',
      publishing: 'Publishing…', needTitle: 'Give your lesson a title first.', badLink: 'Class links start with https:// — try copying it again.',
      published: "Published! It's on the calendar.", saved: 'Changes saved.',
      roulette: 'Surprise me', fromWish: 'From the wishlist', partTwoSuffix: ' (part 2)',
      ideas: ['My favourite phone shortcut', 'The best thing I learned from a grandparent', 'How to make the perfect cup of tea', 'A 5-minute card trick',
        'Why I love this one song', 'How to fold a fitted sheet', 'My go-to 10-minute recipe', 'Better photos with your phone', 'Budgeting basics',
        'A word from another language I love', 'How to procrastinate a little less', 'Three useful knots', 'How a plane actually flies',
        'My favourite board game, explained', 'How to start running', 'One habit that changed my week', 'How to give a good compliment',
        'The story behind a famous painting', 'How to keep a plant alive', 'Chess openings for beginners', 'How to write a better message',
        'A tiny bit of astronomy', 'My favourite keyboard shortcuts', 'A paper plane that really flies']
    },
    lesson: {
      backCal: 'Back to calendar', share: 'Share lesson', whenHow: 'When and how long',
      openCall: 'Open the call', joinCall: 'Join the call', addLink: 'Add a link', linkSoon: 'Link coming soon', afterRsvp: 'Shown after you RSVP',
      taughtBy: 'Taught by', youSuffix: '{name} (you)', seeProfile: "See {name}'s profile", before: 'Before you come', readFirst: 'Read this first:', theReading: 'The reading:',
      hostNote: "You're teaching this one. Friends who RSVP show up here.", finished: 'This lesson has finished.',
      youreGoing: "You're going", cantMake: "Can't make it", imIn: "I'm in!", goingN: '{n} going', nobody: 'Nobody RSVPed', beFirst: 'Be the first to say yes',
      yourPlan: 'Your plan', theirPlan: "{name}'s plan", surpriseTitle: "It's a surprise!", surpriseBody: '{name} is keeping the outline under wraps.', openMind: ' Just bring an open mind.',
      surpriseHost: 'Friends see this as a surprise. Only you can see the outline.',
      thanksTitle: 'Thank-you notes', thanksSome: '{notes} from your group.', thanksNone: 'Notes from your group will show up here after the lesson.',
      sayThanks: 'Say thanks to {name}', sentAlready: 'You sent a note. You can change it any time.', leaveNote: 'Leave {name} a quick thank-you note.',
      afterTitle: 'After the lesson', afterBody: "You'll be able to leave {name} a thank-you note here.",
      edit: 'Edit lesson', cancel: 'Cancel it', confirmCancel: 'Cancel “{title}”? It will be removed from the calendar for everyone.',
      cancelling: 'Cancelling…', cancelled: 'Lesson cancelled.', shareText: 'Come to “{title}” on Teach Club', copied: 'Link copied. Paste it to a friend!',
      joined: "You're in! See you there.", left: "No worries. We've taken you off the list.",
      addCal: 'Add to calendar', google: 'Google Calendar', ics: 'Apple / Outlook', present: 'Start presenting',
      autoRoom: 'A free Jitsi video room was made for this lesson. The first person to join may be asked to sign in with Google or GitHub.',
      hostTime: "Host's time: {time} ({tz})", questions: 'Questions for {name}', questionsHost: 'Questions from friends',
      askPh: 'Ask {name} something before the lesson…', ask: 'Ask', asked: 'Question sent.', noQuestions: 'No questions yet.',
      reply: 'Reply', replyPh: 'Your answer…', saveReply: 'Save', replied: '{name} replied:', deleteQ: 'Delete',
      extras: 'From the lesson', recapPh: 'Share a summary, links, or something people should try…', saveRecap: 'Save', recapSaved: 'Saved.',
      addPhotos: 'Add photos', photosLimit: 'Up to 4 photos.', photoAdded: 'Photo added.', removePhoto: 'Remove photo', uploading: 'Uploading…',
      partTwoOf: 'Part two of “{title}”', followUps: 'Follow-up lessons', planPartTwo: 'Plan part two', report: 'Report this lesson', adminDelete: 'Delete (admin)'
    },
    thanks: {
      title: 'Thanks · {title}', backLesson: 'Back to lesson', comingUp: 'Coming up {date}',
      today: 'Happened today', yesterday: 'Happened yesterday', ago: 'Happened {days} ago', on: 'Happened {date}',
      fromYourGroup: 'Notes from your group', lock: "You can leave {name} a note once the lesson is over. It's on {date} at {time}.",
      sentTitle: "Sent! That'll make {name}'s day.", sentBody: 'Fancy teaching something back? Turns are what keep the club going.', editNote: 'Edit note',
      quick: 'Quick reactions', learned: 'What I learned', learnedPh: 'One thing that stuck with you…', learnedHint: 'A sentence is plenty. {name} will see it on their profile.',
      send: 'Send my note', sending: 'Sending…', needReaction: 'Pick a reaction or write a line first.', fromGroup: 'From the group', noNotes: 'No notes yet.', notesAfter: 'Notes show up here after the lesson.'
    },
    reactions: ['Thank you!', 'Learned something new', 'Want a part two', 'Made me laugh'],
    profile: {
      yourProfile: 'Your profile', edit: 'Edit profile', addBio: "Add a line about what you're good at.", memberSince: 'Member since {date}',
      stats: 'Stats', taught: 'Taught', attended: 'Attended', thanks: 'Thank-yous', lessons: 'Lessons', tabTaught: 'Lessons taught', tabAttended: 'Attended',
      emptyTaughtMe: "You haven't taught anything yet.", emptyTaughtOther: "{name} hasn't taught anything yet.", emptyAttendMe: 'Lessons you RSVP to show up here.', emptyAttendOther: 'Nothing here yet.',
      notes: 'Notes from friends', noNotesMe: 'Thank-you notes from friends show up here after you teach.', noNotesOther: 'No notes for {name} yet.', noteOn: '{name}, on',
      metaComing: 'Coming up · {len}', metaThanks: '{len} · {thanks}', metaWent: '{len} · {n} went', metaWith: 'with {name}', withYou: 'you', comingTail: ' · coming up', report: 'Report', wrapped: 'Your {year} Wrapped'
    },
    install: {
      title: 'Get Teach Club on your phone', button: 'Install the app', ios: 'In Safari, tap {icon} {share}, then {add}.', share: 'Share', add: 'Add to Home Screen',
      other: "In your browser's menu, choose {install} or {add}.", installOpt: 'Install app', addOpt: 'Add to Home screen', done: 'Installed! Look for Teach Club on your home screen.'
    },
    edit: {
      title: 'Edit profile', photoAlt: 'Your profile photo', change: 'Change photo', add: 'Add a photo', photoHint: 'Square photos work best. We crop to a circle.',
      noPhotoHint: 'No photo? No problem. Your initials look great.', name: 'Name', language: 'Language', logout: 'Log out', about: "What's Teach Club?",
      nameEmpty: "Your name can't be empty.", saved: 'Profile saved.',
      reminders: 'Email reminders', remindersHint: 'A day before and 15 minutes before lessons you are in.', privacy: 'Privacy', remove: 'Delete my account'
    },
    photo: { notImage: 'Pick an image file (JPEG or PNG).', cantOpen: "That image couldn't be opened. Try a JPEG or PNG." },
    formats: {
      talk: {
        label: 'Talk', legend: 'Talk', cardLabel: 'Talk', planLabel: 'talk', blurb: 'Share one big idea, out loud. No slides needed.', heading: 'Shape your talk',
        prompts: [
          { q: "What's the one big idea?", hint: 'If people remember one sentence, what is it?', ph: 'e.g. Every flat map has to stretch something.' },
          { q: 'A story or example', hint: 'Something real makes it stick.', ph: 'e.g. The day I learned Greenland is smaller than it looks' },
          { q: 'What do people get wrong?', hint: 'A common myth you can gently fix.', ph: "e.g. That there's one 'correct' map" }
        ],
        plan: [['Intro', 'Hook them, then say the big idea'], ['Core idea', 'Walk through it, step by step'], ['Example', 'Tell your story'], ['Check-in', 'Questions and one takeaway']]
      },
      demo: {
        label: 'Live demo', legend: 'Demo', cardLabel: 'Live demo', planLabel: 'live demo', blurb: 'Make or do something while everyone watches.', heading: 'Plan your demo',
        prompts: [
          { q: 'What will you make or do?', hint: 'Name the finished thing.', ph: 'e.g. A bubbly sourdough starter' },
          { q: 'The steps, in order', hint: 'A few words each, one per line.', ph: '1. Mix flour and water\n2. Wait a day\n3. Feed it' },
          { q: 'What could go wrong?', hint: 'Name it now so it is not scary later.', ph: "e.g. It might not bubble on day one, and that's fine" }
        ],
        plan: [['Intro', 'What we are making today'], ['Show it', 'Do it slowly, out loud'], ['Your turn', 'Everyone has a go'], ['Wrap-up', 'What went wrong and why that is fine']]
      },
      disc: {
        label: 'Discussion', legend: 'Discussion', cardLabel: 'Discussion / workshop', planLabel: 'discussion', blurb: 'Bring good questions and think it through together.', heading: 'Plan the conversation',
        prompts: [
          { q: 'Your opening question', hint: 'Something everyone can answer.', ph: "e.g. What's the best question anyone has asked you?" },
          { q: '2 or 3 follow-ups', hint: 'For when it goes quiet. One per line.', ph: 'What made it good?\nWho asks the best questions you know?' },
          { q: 'The hoped-for takeaway', hint: 'Where would you love the room to land?', ph: 'e.g. Good questions are curious, not clever' }
        ],
        plan: [['Opening question', 'Everyone answers, briefly'], ['Follow-ups', 'Dig in together'], ['Takeaways', 'What did we land on?'], ['Check-in', 'One word each']]
      },
      show: {
        label: 'Show-and-tell', legend: 'Show-and-tell', cardLabel: 'Show-and-tell', planLabel: 'show-and-tell', blurb: 'Bring a few things you love and tell their story.', heading: 'Pick what to show',
        prompts: [
          { q: 'What are you bringing?', hint: 'Two or three things is plenty. One per line.', ph: 'An old film camera\nA roll of negatives' },
          { q: 'Why does each one matter?', hint: 'A line of story per item.', ph: 'e.g. My grandad took it on every holiday' },
          { q: 'What should people notice?', hint: "The detail you'd point at.", ph: 'e.g. The tiny scratches on the lens' }
        ],
        plan: [['Intro', 'Why you brought these'], ['Item by item', 'Story and the detail to notice'], ['Questions', 'Pass things around'], ['Check-in', 'Favourite item, anyone?']]
      },
      read: {
        label: 'Read-and-react', legend: 'Read-and-react', cardLabel: 'Read-and-react', planLabel: 'read-and-react', blurb: 'Share a short piece, then unpack it together.', heading: 'Set up the reading',
        prompts: [
          { q: 'Link to share', hint: 'An article, poem, page or post. Short is best.', ph: 'https://' },
          { q: 'What to look for', hint: 'Give people something to hunt for while reading.', ph: 'e.g. Notice where the writer changes their mind' },
          { q: 'Questions to unpack it', hint: 'Two or three, one per line.', ph: 'Did you agree?\nWhat would you add?' }
        ],
        plan: [['Read together', 'Quiet reading or read aloud'], ['What to look for', 'Point people at the good bit'], ['Unpack it', 'Work through your questions'], ['Check-in', 'What stuck with you?']]
      }
    }
  },

  ar: {
    langName: 'العربية',
    common: {
      back: 'رجوع', close: 'إغلاق', cancel: 'إلغاء', save: 'حفظ', edit: 'تعديل', remove: 'إزالة',
      optional: 'اختياري', you: 'أنت', and: ' و', loading: 'جارٍ التحميل…',
      oops: 'عذرًا، حدث خطأ', backToCalendar: 'العودة إلى التقويم',
      offlineTitle: 'أنت غير متصل', offlineBody: 'يحتاج Teach Club إلى الإنترنت لعرض الدروس. تحقّق من اتصالك وحاول مرة أخرى.',
      tryAgain: 'حاول مرة أخرى', somethingWrong: 'حدث خطأ ما. حاول مرة أخرى.',
      network: 'تعذّر الوصول إلى Teach Club. تحقّق من اتصالك وحاول مرة أخرى.',
      date: 'التاريخ', time: 'الوقت', length: 'المدة', saving: 'جارٍ الحفظ…'
    },
    plural: {
      lessons: { zero: 'لا دروس', one: 'درس واحد', two: 'درسان', few: '{n} دروس', many: '{n} درسًا', other: '{n} درس' },
      friends: { zero: 'لا أصدقاء', one: 'صديق واحد', two: 'صديقين', few: '{n} أصدقاء', many: '{n} صديقًا', other: '{n} صديق' },
      min: { zero: '{n} دقيقة', one: 'دقيقة', two: 'دقيقتان', few: '{n} دقائق', many: '{n} دقيقة', other: '{n} دقيقة' },
      minLong: { zero: '{n} دقيقة', one: 'دقيقة واحدة', two: 'دقيقتان', few: '{n} دقائق', many: '{n} دقيقة', other: '{n} دقيقة' },
      thanks: { zero: 'لا رسائل شكر', one: 'رسالة شكر واحدة', two: 'رسالتا شكر', few: '{n} رسائل شكر', many: '{n} رسالة شكر', other: '{n} رسالة شكر' },
      notes: { zero: 'لا رسائل', one: 'رسالة واحدة', two: 'رسالتان', few: '{n} رسائل', many: '{n} رسالة', other: '{n} رسالة' },
      days: { zero: '{n} يوم', one: 'يوم واحد', two: 'يومين', few: '{n} أيام', many: '{n} يومًا', other: '{n} يوم' },
      members: { zero: 'لا أعضاء', one: 'عضو واحد', two: 'عضوان', few: '{n} أعضاء', many: '{n} عضوًا', other: '{n} عضو' },
      votes: { zero: 'لا أصوات', one: 'صوت واحد', two: 'صوتان', few: '{n} أصوات', many: '{n} صوتًا', other: '{n} صوت' },
      wantPartTwo: { one: 'صديق واحد يريد جزءًا ثانيًا!', two: 'صديقان يريدان جزءًا ثانيًا!', few: '{n} أصدقاء يريدون جزءًا ثانيًا!', many: '{n} صديقًا يريدون جزءًا ثانيًا!', other: '{n} صديق يريدون جزءًا ثانيًا!' }
    },
    club: {
      startTitle: 'ناديك', startHeading: 'ابحث عن ناديك', startLede: 'يعمل Teach Club في أندية صغيرة خاصة. أنشئ ناديًا لأصدقائك، أو انضم إلى نادٍ برابط دعوة.',
      createTitle: 'أنشئ ناديًا', namePh: 'مثال: نادي الخميس', create: 'أنشئ ناديي', creating: 'جارٍ الإنشاء…',
      joinTitle: 'لديك رابط دعوة؟', joinPh: 'الصق الرابط أو الرمز', join: 'انضم', joining: 'جارٍ الانضمام…', badCode: 'هذا لا يبدو رابط دعوة.',
      title: 'النادي', invite: 'ادعُ أصدقاءك', inviteBody: 'أي شخص لديه هذا الرابط يستطيع الانضمام إلى {club}.', copy: 'انسخ الرابط', share: 'مشاركة', copied: 'تم نسخ رابط الدعوة!',
      shareText: 'انضم إلى {club} على Teach Club', newLink: 'أنشئ رابطًا جديدًا', newLinkConfirm: 'إنشاء رابط دعوة جديد؟ سيتوقف الرابط القديم عن العمل.', newLinkDone: 'رابط الدعوة الجديد جاهز.',
      members: 'الأعضاء', admin: 'مشرف', youTag: '(أنت)', makeAdmin: 'اجعله مشرفًا', removeAdmin: 'إلغاء الإشراف', remove: 'إزالة',
      removeConfirm: 'إزالة {name} من {club}؟ ستُلغى دروسه القادمة هنا.', removed: 'تمت الإزالة من النادي.',
      leave: 'غادر هذا النادي', leaveConfirm: 'مغادرة {club}؟ ستُلغى دروسك القادمة هنا.', left: 'غادرت النادي.',
      rename: 'إعادة تسمية', renamePrompt: 'الاسم الجديد للنادي', renamed: 'تمت إعادة تسمية النادي.', yourClubs: 'أنديتك', current: 'الحالي', switchTo: 'انتقل',
      switched: 'انتقلت إلى {club}.', another: 'أنشئ ناديًا آخر أو انضم إلى واحد', reports: 'البلاغات', noReports: 'لا توجد بلاغات مفتوحة. كل شيء هادئ.',
      reportBy: 'أبلغ عنه {name}', reportOn: 'الدرس: «{title}»', reportOnMember: 'العضو: {name}', resolve: 'تمت المعالجة', resolved: 'تمت معالجة البلاغ.',
      deleteLesson: 'احذف الدرس', deleteLessonConfirm: 'حذف هذا الدرس للجميع؟', wrapped: 'ملخّص عام {year}', manage: 'إدارة',
      joinTitlePage: 'الانضمام إلى نادٍ', joinHeading: 'انضم إلى {club}', joinLede: 'فيه {members} بالفعل. أصدقاء يعلّمون أصدقاءهم، بضع دقائق في كل مرة.',
      joinButton: 'انضم إلى النادي', joined: 'أهلًا بك في {club}!', badInvite: 'عذرًا، رابط الدعوة هذا لا يعمل', needAccount: 'أنشئ حسابًا أولًا وستنضم مباشرة بعدها.',
      signup: 'أنشئ حسابي', login: 'لديّ حساب'
    },
    wishes: {
      title: 'علّمني…', lede: 'ما الذي تحب أن تتعلّمه؟ أضفه هنا، وقد يعلّمه أحد أعضاء النادي.',
      addTitle: 'أحب أن أتعلّم…', titlePh: 'مثال: كيف أحضّر قهوة لذيذة فعلًا', detailsPh: 'هل من تفاصيل؟ (اختياري)', add: 'أضف أمنيتي', adding: 'جارٍ الإضافة…', added: 'تمت إضافة الأمنية!',
      empty: 'لا أمنيات بعد. كن أول من يطلب!', by: 'طلبها {name}', vote: 'وأنا أيضًا', voted: 'صوّتّ', teach: 'سأعلّم هذا',
      taught: '{name} يعلّم هذا', seeLesson: 'عرض الدرس', remove: 'حذف', removeConfirm: 'حذف هذه الأمنية؟', open: 'أمنيات مفتوحة', done: 'قيد التعليم'
    },
    present: {
      title: 'وضع العرض', start: 'ابدأ', pause: 'إيقاف مؤقت', resume: 'متابعة', next: 'الجزء التالي', prev: 'الجزء السابق', plus: '+1 دقيقة', minus: '−1 دقيقة',
      finish: 'إنهاء', upNext: 'التالي: {name}', last: 'الجزء الأخير!', overtime: 'تجاوز الوقت', done: 'انتهى الدرس! أحسنت.', back: 'العودة إلى الدرس',
      noPlan: 'لا توجد خطة زمنية لهذا الدرس بعد.', awake: 'ستبقى الشاشة مضاءة أثناء العرض.', partOf: 'الجزء {n} من {total}', total: 'أُنجز {done} من {total}'
    },
    report: {
      title: 'إبلاغ', lessonHeading: 'الإبلاغ عن هذا الدرس', memberHeading: 'الإبلاغ عن {name}', lede: 'لن يرى بلاغك إلا مشرفو هذا النادي.',
      reasons: { spam: 'رسائل مزعجة أو إعلانات', offensive: 'محتوى مسيء أو غير لائق', unsafe: 'محتوى خطير أو مؤذٍ', other: 'شيء آخر' },
      detailsPh: 'أخبر المشرفين بما حدث (اختياري)', send: 'أرسل البلاغ', sending: 'جارٍ الإرسال…', sent: 'شكرًا. سيطّلع مشرفو النادي على الأمر.', pick: 'اختر سببًا.'
    },
    account: {
      title: 'حذف الحساب', heading: 'حذف حسابك؟', lede: 'سيؤدي هذا إلى حذف ملفك ودروسك ورسائلك وأسئلتك وأمنياتك نهائيًا. لا يمكن التراجع عن ذلك.',
      clubsNote: 'إن كنت تدير ناديًا، سيصبح عضو آخر مشرفًا عليه.', password: 'اكتب كلمة المرور للتأكيد', remove: 'احذف حسابي نهائيًا',
      removing: 'جارٍ الحذف…', done: 'تم حذف حسابك. نتمنى لك كل خير!'
    },
    privacy: {
      title: 'الخصوصية', heading: 'الخصوصية بكلمات بسيطة', updated: 'آخر تحديث: أكتوبر 2026',
      sections: [
        { h: 'ما الذي نحتفظ به', p: 'اسمك، وبريدك الإلكتروني، وكلمة المرور (مشفّرة ولا يمكن قراءتها، حتى من قِبلنا)، والصورة والنبذة التي تضيفها، وما تفعله في التطبيق: الدروس وتأكيدات الحضور والرسائل والأسئلة والأمنيات والبلاغات.' },
        { h: 'من يرى ذلك', p: 'أعضاء الأندية التي أنت فيها فقط. لا يظهر بريدك الإلكتروني للأعضاء الآخرين. يرى مشرفو النادي البلاغات المقدَّمة في ناديهم.' },
        { h: 'الرسائل', p: 'نراسلك فقط لاستعادة كلمة المرور ولتذكيرات الدروس، ويمكنك إيقاف التذكيرات من «تعديل الملف». تُرسل الرسائل عبر خدمة Resend.' },
        { h: 'أين تُحفظ البيانات', p: 'يعمل التطبيق وقاعدة بياناته على Cloudflare. لا نبيع بياناتك ولا نشاركها، ولا توجد إعلانات أو أدوات تتبّع. ملف تعريف ارتباط واحد يُبقيك مسجّل الدخول.' },
        { h: 'خياراتك', p: 'عدّل ملفك متى شئت، وغادر الأندية، أو احذف حسابك من «تعديل الملف». الحذف يزيل بياناتك من التطبيق فورًا.' }
      ]
    },
    wrapped: {
      title: 'الملخّص السنوي', heading: 'ملخّص {year}', soFar: '{club} · حتى الآن هذا العام', clubTitle: 'النادي', youTitle: 'أنت',
      lessons: 'قُدّم {lessons}', minutes: '{minutes} من التعلّم معًا', teachers: 'تناوب {friends} على التعليم',
      topTeacher: 'أكثر من قدّم دروسًا: {name} ({lessons})', topLesson: 'الأكثر شكرًا: «{title}»', topFormat: 'الشكل المفضّل: {format}', busiest: 'أنشط شهر: {month}',
      taught: 'قدّمت {lessons}', taughtMin: '{minutes} من التعليم', attended: 'حضرت {lessons}', learned: '{minutes} من التعلّم',
      myFormat: 'شكلك المفضّل: {format}', fan: 'أكبر معجبيك: {name}', thanks: 'تلقّيت {thanks}',
      empty: 'لا شيء بعد هذا العام. علّم شيئًا وعد لاحقًا!', share: 'مشاركة', shareText: 'عامنا {year} على Teach Club: {lessons} و{minutes}.'
    },
    badges: {
      title: 'الأوسمة', count: '{n} من {total}',
      first_lesson: ['الدرس الأول', 'قدّم درسًا'], five_lessons: ['خمسة نجوم', 'قدّم 5 دروس'], all_formats: ['المجموعة الكاملة', 'جرّب الأشكال الخمسة'],
      regular: ['من الحضور الدائم', 'حضر 5 دروس'], thanks_magnet: ['مغناطيس الشكر', 'تلقّى 10 رسائل شكر'], night_owl: ['بومة الليل', 'قدّم درسًا بعد 10 مساءً'],
      early_bird: ['الطائر المبكر', 'قدّم درسًا قبل 8 صباحًا'], curious: ['عقل فضولي', 'طرح 3 أسئلة'], wish_granter: ['محقّق الأمنيات', 'علّم أمنية أحدهم'],
      sequel: ['الجزء الثاني', 'أضاف جزءًا ثانيًا']
    },
    dates: {
      months: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
      mon: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
      wdShort: ['إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت', 'أحد'],
      wdLong: ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'],
      am: 'ص', pm: 'م', time: '{h}:{m} {ap}', short: '{wd} {d} {m}', long: '{wd} {d} {m}', monthYear: '{m} {y}',
      rangeSame: '{a} – {b} {m}', rangeDiff: '{a} {ma} – {b} {mb}', minShort: '{n}د'
    },
    nav: { main: 'الرئيسية', calendar: 'التقويم', profile: 'ملفي', teach: 'علّم شيئًا', myLessons: 'دروسي', yourProfile: 'ملفك الشخصي', wishes: 'الأمنيات', club: 'النادي' },
    intro: {
      title: 'أهلًا بك', skip: 'تخطٍّ', next: 'التالي', join: 'انضم إلى النادي', haveAccount: 'لديّ حساب بالفعل', done: 'العودة إلى التطبيق',
      slideOf: 'الشريحة {n} من {total}', slides: 'تعريف بالتطبيق',
      s1t: 'أهلًا بك في Teach Club', s1b: 'نادٍ صغير يعلّم فيه الأصدقاء بعضهم بعضًا ما يحبّونه، بضع دقائق في كل مرة.',
      s2t: 'دروس قصيرة ومتعة كبيرة', s2b: 'كل درس من 5 إلى 30 دقيقة. حديث، أو عرض مباشر، أو «اعرض واحكِ»… إن كنت تحبه فهو يستحق.',
      s3t: 'خطّط له في دقيقة', s3b: 'اختر يومًا وشكلًا للدرس وأجب عن بضعة أسئلة، ونحن نقسّم وقتك.',
      s4t: 'قل «أنا قادم»، ثم قل شكرًا', s4b: 'احضر دروس أصدقائك، وانضم إلى المكالمة، واترك رسالة شكر بعدها.',
      s5t: 'بكل صراحة', s5b: 'صُنع Teach Club لمجموعة واحدة من الأصدقاء. وبصراحة؟ بدأ كمزحة… ثم صرنا نستخدمه فعلًا.',
      s5c: 'لا خبراء. لا درجات. لا ضغط.'
    },
    login: {
      title: 'تسجيل الدخول', heading: 'أهلًا بعودتك', lede: 'سعداء برؤيتك. أصدقاؤك كانوا مشغولين.',
      forgot: 'نسيتها؟', passwordPh: 'كلمة مرورك', submit: 'دخول', busy: 'جارٍ الدخول…',
      missing: 'أدخل بريدك الإلكتروني وكلمة المرور.', forgotToast: 'استعادة كلمة المرور غير متاحة بعد، عذرًا.',
      newHere: 'جديد هنا؟', join: 'انضم إلى النادي', whatIs: 'ما هو Teach Club؟'
    },
    forgot: {
      title: 'استعادة كلمة المرور', heading: 'نسيت كلمة المرور؟', lede: 'لا بأس. اكتب بريدك الإلكتروني وسنرسل لك رابطًا لاختيار كلمة مرور جديدة.',
      submit: 'أرسل لي رابطًا', busy: 'جارٍ الإرسال…', sentTitle: 'تفقّد بريدك',
      sentBody: 'إن كان هناك حساب مرتبط بـ {email}، فالرابط في الطريق إليك. يعمل مرة واحدة ولمدة ساعة.', spam: 'لم تجده؟ تفقّد مجلد الرسائل غير المرغوب فيها.',
      again: 'أرسله مرة أخرى', back: 'العودة إلى تسجيل الدخول', errEmail: 'اكتب البريد الإلكتروني الذي سجّلت به.'
    },
    reset: {
      title: 'كلمة مرور جديدة', heading: 'اختر كلمة مرور جديدة', lede: 'اجعلها 8 أحرف على الأقل. ستدخل إلى حسابك مباشرة بعدها.',
      field: 'كلمة المرور الجديدة', submit: 'احفظ كلمة المرور الجديدة', busy: 'جارٍ الحفظ…', done: 'تم تغيير كلمة المرور. أهلًا بعودتك!',
      noToken: 'هذا الرابط ناقص. اطلب رابطًا جديدًا.', newLink: 'اطلب رابطًا جديدًا'
    },
    field: {
      email: 'البريد الإلكتروني', emailPh: 'you@example.com', password: 'كلمة المرور', name: 'اسمك', namePh: 'الاسم الذي يناديك به أصدقاؤك',
      bio: 'ما الذي تجيده؟', bioPh: 'خَبز الخبز، افتتاحيات الشطرنج، تصليح الدراجات، النكت السخيفة…'
    },
    signup: {
      title: 'انضم إلى النادي', lede: 'أصدقاء يعلّمون أصدقاءهم، بضع دقائق في كل مرة. لا حاجة لأن تكون خبيرًا.',
      addPhoto: 'أضف صورة', addPhotoHint: 'اختياري تمامًا. تخطَّها وسنستخدم الأحرف الأولى من اسمك.',
      photoGood: 'تبدو رائعًا!', photoGoodHint: 'اضغط على الكاميرا لتغييرها.',
      previewAlt: 'معاينة صورتك الشخصية', initialsAlt: 'صورة افتراضية بالأحرف الأولى من اسمك',
      upload: 'ارفع صورة شخصية', change: 'غيّر صورتك الشخصية',
      passwordPh: '8 أحرف على الأقل', show: 'إظهار', hide: 'إخفاء',
      bioHint: 'سطر أو سطران يكفيان. يساعد ذلك أصدقاءك على معرفة ما يسألونك عنه.',
      submit: 'أنشئ حسابي', busy: 'جارٍ إنشاء حسابك…', already: 'عضو بالفعل؟', login: 'سجّل الدخول',
      errName: 'أخبرنا بالاسم الذي يناديك به أصدقاؤك.', errEmail: 'أضف بريدك الإلكتروني لتتمكن من الدخول لاحقًا.', errPw: 'يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.'
    },
    welcome: {
      title: 'أهلًا بك', heading: 'أهلًا بك في النادي يا {name}!', lede: 'إليك الفكرة كلها في ثلاث نقاط بسيطة.',
      i1t: 'الدروس قصيرة', i1b: 'من 5 إلى 30 دقيقة. هذا كل شيء، لا أطول.',
      i2t: 'نساعدك في التخطيط', i2b: 'اختر شكل الدرس، وأجب عن بضعة أسئلة، واحصل على خطة زمنية.',
      i3t: 'أصدقاء، لا جمهور', i3b: 'لا شرائح ولا درجات. شارك فقط ما تحبه.',
      see: 'شاهد ما هو قادم', idea: 'لديّ فكرة بالفعل'
    },
    home: {
      title: 'التقويم', hi: 'أهلًا {name}، إليك ما هو قادم', teachSub: 'من 5 إلى 30 دقيقة. وسنساعدك في التخطيط.',
      prev: 'الشهر السابق', next: 'الشهر التالي', today: 'اليوم', todayPrefix: 'اليوم، ', outside: 'خارج هذا الشهر',
      emptyTitle: 'لا شيء مخطط بعد', emptyPast: 'لم يحدث شيء في هذا اليوم', emptyWide: 'هذا اليوم متاح بالكامل.',
      emptyBody: 'هذا اليوم متاح بالكامل. هل لديك 10 دقائق عن شيء تحبه؟', emptyPastBody: 'اختر يومًا آخر لترى ما علّمه أصدقاؤك.',
      teachOnDay: 'علّم في هذا اليوم', going: 'سأحضر', summary: '{lessons} من {friends} هذا الشهر', summaryEmpty: 'لا دروس هذا الشهر بعد. كن الأول!',
      more: '+{n} أخرى', promoTitle: 'تعرف شيئًا صغيرًا وممتعًا؟', promoBody: 'هذا درس! عشر دقائق عن طريقتك في طيّ الشرشف تُحسب أيضًا.'
    },
    create: {
      titleNew: 'علّم شيئًا', titleEdit: 'تعديل الدرس', step: 'الخطوة {n} من 6', editing: 'تعديل · ',
      s1: 'متى يناسبك؟', s1sub: 'اختر موعدًا، ويمكنك تغييره لاحقًا دائمًا.', day: 'اليوم', earlier: 'أيام سابقة', later: 'أيام لاحقة',
      noneThatDay: 'لا شيء آخر في ذلك اليوم بعد. إنه لك.', oneThatDay: '{who} يعلّم في ذلك اليوم أيضًا. جميل!', manyThatDay: '{who} يعلّمون في ذلك اليوم أيضًا. جميل!',
      startTime: 'وقت البدء', otherTime: 'أو وقت آخر', howLong: 'كم المدة؟',
      tips: { 5: 'شرارة سريعة.', 10: 'فكرة واحدة بإتقان.', 15: 'مساحة لمثال.', 20: 'درس صغير متكامل.', 25: 'وقت لنجرّبه معًا.', 30: 'مساحة واسعة.' },
      tipTail: 'الحد الأقصى 30 دقيقة. القِصر هو الفكرة كلها.', next1: 'التالي: سمِّه',
      s2: 'ما اسمه؟', s2sub: 'عنوان وسطر واحد يثير فضول أصدقائك.', fieldTitle: 'العنوان', titlePh: 'اجعله قصيرًا وبسيطًا', stuck: 'محتار؟ جرّب',
      openers: [{ label: 'كيف…', text: 'كيف ' }, { label: 'سرّ…', text: 'سرّ ' }, { label: 'لماذا يهمّ…', text: 'لماذا يهمّ ' }, { label: 'كل ما أعرفه عن…', text: 'كل ما أعرفه عن ' }],
      pitch: 'وصف في سطر', pitchPh: 'لماذا يجب أن يحضر صديقك؟', pitchHint: 'أكمل الجملة: «ستغادر وأنت تعرف…»',
      titleErr: 'أعطه عنوانًا أولًا. بضع كلمات بسيطة تكفي.', preview: 'معاينة في التقويم', yourTitle: 'عنوانك', yourPitch: 'وصفك في سطر', youOn: 'أنت · {date}', next2: 'التالي: اختر الشكل',
      s3: 'كيف تريد أن تشاركه؟', s3sub: 'اختر الأقرب إليك.', formatGroup: 'شكل الدرس', notSure: 'محتار؟ «الحديث» أسهل بداية.', next3: 'التالي: شكّله',
      s4sub: 'ثلاثة أسئلة سريعة. بضع كلمات لكل منها تكفي.', change: '{label} · تغيير', skipAny: 'تخطَّ ما شئت. هذه تلميحات، لا واجبات.', next4: 'التالي: الخطة الزمنية',
      s5: 'هذه خطتك الزمنية', s5sub: 'قسّمنا {len} على {format}. عدّل ما تشاء.', reset: 'إعادة ضبط',
      fits: 'مناسب تمامًا. مريح ولطيف.', over: 'تجاوزت قليلًا: احذف {mins} لتناسب.', spare: 'لديك {mins} إضافية. مساحة للراحة، أو أضفها في مكان ما.',
      less: 'وقت أقل لـ«{name}»', more: 'وقت أكثر لـ«{name}»', next5: 'التالي: المراجعة',
      s6: 'يبدو رائعًا. جاهز؟', s6edit: 'يبدو جيدًا. نحفظه؟', s6sub: 'نظرة أخيرة قبل أن يراه أصدقاؤك.', s6subEdit: 'سيرى أصدقاؤك تعديلاتك فورًا.',
      untitled: 'درس بلا عنوان', classLink: 'رابط الدرس', linkPh: 'الصق رابط Zoom أو Google Meet أو أي مكالمة فيديو', linkHelp: 'يمكنك إضافته أو تغييره لاحقًا.',
      noLink: 'لا رابط؟ لا مشكلة.', noLinkBody: 'سننشئ غرفة فيديو مجانية لهذا الدرس تلقائيًا، ويمكنك إضافة رابطك في أي وقت.', linkAdded: 'تمت إضافة الرابط. سيظهر لأصدقائك بعد تأكيد حضورهم.',
      outline: 'مخططك', whoSees: 'من يرى المخطط؟', showIt: 'أظهره', showItSub: 'يستطيع أصدقاؤك الاطلاع مسبقًا', surprise: 'مفاجأة', surpriseSub: 'أبقِه سرًّا',
      prep: 'هل من تحضير؟', prepPh: 'مثال: أحضر هاتفًا عليه تطبيق خرائط', prepHint: 'شيء يُقرأ أو يُحضَر أو يُفكَّر فيه مسبقًا.',
      publish: 'انشر في التقويم', saveChanges: 'احفظ التعديلات', noPressure: 'يمكنك التعديل أو الإلغاء في أي وقت. بلا ضغط.',
      publishing: 'جارٍ النشر…', needTitle: 'أعطِ درسك عنوانًا أولًا.', badLink: 'يبدأ رابط الدرس بـ https://، جرّب نسخه مرة أخرى.',
      published: 'نُشر! إنه الآن في التقويم.', saved: 'تم حفظ التعديلات.',
      roulette: 'فاجئني', fromWish: 'من قائمة الأمنيات', partTwoSuffix: ' (الجزء 2)',
      ideas: ['اختصاري المفضّل في الهاتف', 'أجمل شيء تعلّمته من جدّي أو جدّتي', 'كيف تحضّر كوب شاي مثاليًا', 'خدعة ورق في 5 دقائق',
        'لماذا أحب هذه الأغنية', 'كيف تطوي الشرشف بسهولة', 'وصفتي السريعة في 10 دقائق', 'صور أجمل بهاتفك', 'أساسيات الميزانية الشخصية',
        'كلمة أحبها من لغة أخرى', 'كيف تسوّف أقل قليلًا', 'ثلاث عُقد مفيدة', 'كيف تطير الطائرة فعلًا',
        'لعبتي المفضّلة بشرح بسيط', 'كيف تبدأ الجري', 'عادة واحدة غيّرت أسبوعي', 'كيف تقدّم مديحًا لطيفًا',
        'قصة لوحة مشهورة', 'كيف تحافظ على نبتة حيّة', 'افتتاحيات الشطرنج للمبتدئين', 'كيف تكتب رسالة أفضل',
        'لمحة صغيرة عن الفلك', 'اختصارات لوحة المفاتيح المفضّلة لديّ', 'طائرة ورقية تطير فعلًا']
    },
    lesson: {
      backCal: 'العودة إلى التقويم', share: 'شارك الدرس', whenHow: 'الموعد والمدة',
      openCall: 'افتح المكالمة', joinCall: 'انضم إلى المكالمة', addLink: 'أضف رابطًا', linkSoon: 'الرابط قريبًا', afterRsvp: 'يظهر بعد تأكيد حضورك',
      taughtBy: 'يقدّمه', youSuffix: '{name} (أنت)', seeProfile: 'عرض ملف {name}', before: 'قبل أن تأتي', readFirst: 'اقرأ هذا أولًا:', theReading: 'القراءة:',
      hostNote: 'أنت من يقدّم هذا الدرس. سيظهر هنا من يؤكد حضوره.', finished: 'انتهى هذا الدرس.',
      youreGoing: 'ستحضر', cantMake: 'لن أستطيع', imIn: 'أنا قادم!', goingN: 'سيحضر {n}', nobody: 'لم يؤكد أحد حضوره', beFirst: 'كن أول من يقول نعم',
      yourPlan: 'خطتك', theirPlan: 'خطة {name}', surpriseTitle: 'إنها مفاجأة!', surpriseBody: 'يحتفظ {name} بالمخطط سرًّا.', openMind: ' أحضر فقط عقلًا منفتحًا.',
      surpriseHost: 'يراه أصدقاؤك كمفاجأة. أنت وحدك ترى المخطط.',
      thanksTitle: 'رسائل الشكر', thanksSome: '{notes} من مجموعتك.', thanksNone: 'ستظهر هنا رسائل مجموعتك بعد الدرس.',
      sayThanks: 'قل شكرًا لـ{name}', sentAlready: 'أرسلت رسالة. يمكنك تغييرها في أي وقت.', leaveNote: 'اترك لـ{name} رسالة شكر قصيرة.',
      afterTitle: 'بعد الدرس', afterBody: 'ستتمكن من ترك رسالة شكر لـ{name} هنا.',
      edit: 'تعديل الدرس', cancel: 'إلغاء الدرس', confirmCancel: 'إلغاء «{title}»؟ سيُحذف من التقويم للجميع.',
      cancelling: 'جارٍ الإلغاء…', cancelled: 'تم إلغاء الدرس.', shareText: 'تعال إلى «{title}» على Teach Club', copied: 'تم نسخ الرابط. أرسله لصديق!',
      joined: 'تم! نراك هناك.', left: 'لا بأس. أزلناك من القائمة.',
      addCal: 'أضف إلى التقويم', google: 'تقويم Google', ics: 'Apple / Outlook', present: 'ابدأ العرض',
      autoRoom: 'أنشأنا غرفة فيديو مجانية على Jitsi لهذا الدرس. قد يُطلب من أول من ينضم تسجيل الدخول بحساب Google أو GitHub.',
      hostTime: 'بتوقيت المقدّم: {time} ({tz})', questions: 'أسئلة لـ{name}', questionsHost: 'أسئلة من الأصدقاء',
      askPh: 'اسأل {name} شيئًا قبل الدرس…', ask: 'اسأل', asked: 'تم إرسال السؤال.', noQuestions: 'لا أسئلة بعد.',
      reply: 'رد', replyPh: 'إجابتك…', saveReply: 'حفظ', replied: 'ردّ {name}:', deleteQ: 'حذف',
      extras: 'من الدرس', recapPh: 'شارك ملخّصًا أو روابط أو شيئًا يستحق التجربة…', saveRecap: 'حفظ', recapSaved: 'تم الحفظ.',
      addPhotos: 'أضف صورًا', photosLimit: 'حتى 4 صور.', photoAdded: 'تمت إضافة الصورة.', removePhoto: 'إزالة الصورة', uploading: 'جارٍ الرفع…',
      partTwoOf: 'الجزء الثاني من «{title}»', followUps: 'دروس تكميلية', planPartTwo: 'خطّط لجزء ثانٍ', report: 'الإبلاغ عن هذا الدرس', adminDelete: 'حذف (مشرف)'
    },
    thanks: {
      title: 'شكر · {title}', backLesson: 'العودة إلى الدرس', comingUp: 'قادم {date}',
      today: 'حدث اليوم', yesterday: 'حدث أمس', ago: 'حدث قبل {days}', on: 'حدث {date}',
      fromYourGroup: 'رسائل من مجموعتك', lock: 'يمكنك ترك رسالة لـ{name} بعد انتهاء الدرس. موعده {date} الساعة {time}.',
      sentTitle: 'أُرسلت! ستُسعد {name} كثيرًا.', sentBody: 'ما رأيك أن تعلّم شيئًا بالمقابل؟ تبادل الأدوار هو ما يُبقي النادي حيًّا.', editNote: 'عدّل الرسالة',
      quick: 'تفاعلات سريعة', learned: 'ما تعلّمته', learnedPh: 'شيء واحد بقي في ذهنك…', learnedHint: 'جملة واحدة تكفي. سيراها {name} في ملفه.',
      send: 'أرسل رسالتي', sending: 'جارٍ الإرسال…', needReaction: 'اختر تفاعلًا أو اكتب سطرًا أولًا.', fromGroup: 'من المجموعة', noNotes: 'لا رسائل بعد.', notesAfter: 'تظهر الرسائل هنا بعد الدرس.'
    },
    reactions: ['شكرًا لك!', 'تعلّمت شيئًا جديدًا', 'أريد جزءًا ثانيًا', 'أضحكتني'],
    profile: {
      yourProfile: 'ملفك الشخصي', edit: 'تعديل الملف', addBio: 'أضف سطرًا عمّا تجيده.', memberSince: 'عضو منذ {date}',
      stats: 'إحصاءات', taught: 'تعليم', attended: 'حضور', thanks: 'رسائل شكر', lessons: 'الدروس', tabTaught: 'الدروس المقدَّمة', tabAttended: 'الحضور',
      emptyTaughtMe: 'لم تقدّم أي درس بعد.', emptyTaughtOther: 'لم يقدّم {name} أي درس بعد.', emptyAttendMe: 'تظهر هنا الدروس التي تؤكد حضورها.', emptyAttendOther: 'لا شيء هنا بعد.',
      notes: 'رسائل من الأصدقاء', noNotesMe: 'تظهر هنا رسائل شكر أصدقائك بعد أن تقدّم درسًا.', noNotesOther: 'لا رسائل لـ{name} بعد.', noteOn: '{name}، عن',
      metaComing: 'قادم · {len}', metaThanks: '{len} · {thanks}', metaWent: '{len} · حضر {n}', metaWith: 'مع {name}', withYou: 'أنت', comingTail: ' · قادم', report: 'إبلاغ', wrapped: 'ملخّصك لعام {year}'
    },
    install: {
      title: 'احصل على Teach Club على هاتفك', button: 'ثبّت التطبيق', ios: 'في Safari، اضغط {icon} {share}، ثم {add}.', share: 'مشاركة', add: 'إضافة إلى الشاشة الرئيسية',
      other: 'من قائمة المتصفح، اختر {install} أو {add}.', installOpt: 'تثبيت التطبيق', addOpt: 'إضافة إلى الشاشة الرئيسية', done: 'تم التثبيت! ابحث عن Teach Club في شاشتك الرئيسية.'
    },
    edit: {
      title: 'تعديل الملف', photoAlt: 'صورتك الشخصية', change: 'غيّر الصورة', add: 'أضف صورة', photoHint: 'الصور المربعة هي الأفضل. سنقصّها على شكل دائرة.',
      noPhotoHint: 'بلا صورة؟ لا مشكلة. الأحرف الأولى من اسمك تبدو رائعة.', name: 'الاسم', language: 'اللغة', logout: 'تسجيل الخروج', about: 'ما هو Teach Club؟',
      nameEmpty: 'لا يمكن أن يكون الاسم فارغًا.', saved: 'تم حفظ الملف.',
      reminders: 'تذكيرات بالبريد', remindersHint: 'قبل يوم وقبل 15 دقيقة من الدروس التي ستحضرها.', privacy: 'الخصوصية', remove: 'احذف حسابي'
    },
    photo: { notImage: 'اختر ملف صورة (JPEG أو PNG).', cantOpen: 'تعذّر فتح هذه الصورة. جرّب JPEG أو PNG.' },
    formats: {
      talk: {
        label: 'حديث', legend: 'حديث', cardLabel: 'حديث', planLabel: 'حديث', blurb: 'شارك فكرة كبيرة واحدة بصوتك. لا حاجة لشرائح.', heading: 'شكّل حديثك',
        prompts: [
          { q: 'ما الفكرة الكبرى؟', hint: 'لو تذكّر الناس جملة واحدة، فما هي؟', ph: 'مثال: كل خريطة مسطّحة مضطرة لتمطيط شيء ما.' },
          { q: 'قصة أو مثال', hint: 'الشيء الواقعي يبقى في الذاكرة.', ph: 'مثال: اليوم الذي عرفت فيه أن غرينلاند أصغر مما تبدو' },
          { q: 'ما الذي يخطئ فيه الناس؟', hint: 'خرافة شائعة يمكنك تصحيحها بلطف.', ph: 'مثال: أن هناك خريطة «صحيحة» واحدة' }
        ],
        plan: [['مقدمة', 'اجذبهم، ثم قل الفكرة الكبرى'], ['الفكرة الأساسية', 'اشرحها خطوة بخطوة'], ['مثال', 'احكِ قصتك'], ['ختام', 'أسئلة وفكرة واحدة يأخذونها معهم']]
      },
      demo: {
        label: 'عرض مباشر', legend: 'عرض', cardLabel: 'عرض مباشر', planLabel: 'عرض مباشر', blurb: 'اصنع أو افعل شيئًا والجميع يشاهد.', heading: 'خطّط لعرضك',
        prompts: [
          { q: 'ماذا ستصنع أو تفعل؟', hint: 'سمِّ النتيجة النهائية.', ph: 'مثال: خميرة عجين مليئة بالفقاعات' },
          { q: 'الخطوات بالترتيب', hint: 'بضع كلمات لكل خطوة، كل خطوة في سطر.', ph: '1. اخلط الدقيق والماء\n2. انتظر يومًا\n3. أطعمها' },
          { q: 'ما الذي قد يسوء؟', hint: 'سمِّه الآن حتى لا يكون مخيفًا لاحقًا.', ph: 'مثال: قد لا تظهر الفقاعات في اليوم الأول، ولا بأس' }
        ],
        plan: [['مقدمة', 'ما الذي سنصنعه اليوم'], ['اعرضه', 'ببطء وبصوت مسموع'], ['دورك', 'يجرّب الجميع'], ['ختام', 'ما الذي لم ينجح ولماذا لا بأس بذلك']]
      },
      disc: {
        label: 'نقاش', legend: 'نقاش', cardLabel: 'نقاش / ورشة', planLabel: 'نقاش', blurb: 'أحضر أسئلة جيدة وفكّروا فيها معًا.', heading: 'خطّط للحوار',
        prompts: [
          { q: 'سؤالك الافتتاحي', hint: 'سؤال يستطيع الجميع الإجابة عنه.', ph: 'مثال: ما أفضل سؤال سألك إياه أحد؟' },
          { q: 'سؤالان أو ثلاثة للمتابعة', hint: 'لحظات الصمت. كل سؤال في سطر.', ph: 'ما الذي جعله جيدًا؟\nمن أفضل من يطرح الأسئلة ممن تعرفهم؟' },
          { q: 'الخلاصة المأمولة', hint: 'أين تحب أن يصل الحوار؟', ph: 'مثال: الأسئلة الجيدة فضولية، لا متذاكية' }
        ],
        plan: [['السؤال الافتتاحي', 'يجيب الجميع باختصار'], ['المتابعة', 'تعمّقوا معًا'], ['الخلاصات', 'إلى أين وصلنا؟'], ['ختام', 'كلمة واحدة من كل شخص']]
      },
      show: {
        label: 'اعرض واحكِ', legend: 'اعرض واحكِ', cardLabel: 'اعرض واحكِ', planLabel: 'عرض وحكاية', blurb: 'أحضر أشياء تحبها واحكِ قصتها.', heading: 'اختر ما ستعرضه',
        prompts: [
          { q: 'ماذا ستحضر؟', hint: 'شيئان أو ثلاثة تكفي. كل شيء في سطر.', ph: 'كاميرا أفلام قديمة\nلفافة نيغاتيف' },
          { q: 'لماذا يهمّك كل منها؟', hint: 'سطر من القصة لكل شيء.', ph: 'مثال: كان جدي يأخذها في كل رحلة' },
          { q: 'ما الذي يجب أن يلاحظه الناس؟', hint: 'التفصيلة التي ستشير إليها.', ph: 'مثال: الخدوش الصغيرة على العدسة' }
        ],
        plan: [['مقدمة', 'لماذا أحضرت هذه الأشياء'], ['شيئًا فشيئًا', 'القصة والتفصيلة الملفتة'], ['أسئلة', 'مرّروا الأشياء بينكم'], ['ختام', 'ما الشيء المفضّل لديكم؟']]
      },
      read: {
        label: 'اقرأ وتفاعل', legend: 'اقرأ وتفاعل', cardLabel: 'اقرأ وتفاعل', planLabel: 'قراءة وتفاعل', blurb: 'شارك نصًا قصيرًا ثم حلّلوه معًا.', heading: 'جهّز القراءة',
        prompts: [
          { q: 'رابط للمشاركة', hint: 'مقال أو قصيدة أو صفحة أو منشور. الأقصر أفضل.', ph: 'https://' },
          { q: 'ما الذي نبحث عنه', hint: 'أعطِ الناس شيئًا يبحثون عنه أثناء القراءة.', ph: 'مثال: لاحظ أين يغيّر الكاتب رأيه' },
          { q: 'أسئلة لتحليله', hint: 'سؤالان أو ثلاثة، كل سؤال في سطر.', ph: 'هل وافقت؟\nماذا تضيف؟' }
        ],
        plan: [['نقرأ معًا', 'قراءة صامتة أو بصوت عالٍ'], ['ما نبحث عنه', 'وجّه الناس إلى الجزء المميّز'], ['نحلّله', 'ناقشوا أسئلتك'], ['ختام', 'ما الذي بقي في أذهانكم؟']]
      }
    }
  }
};

function merge(into, from) {
  for (const [key, value] of Object.entries(from)) {
    if (value && typeof value === 'object' && !Array.isArray(value) && into[key] && typeof into[key] === 'object') merge(into[key], value);
    else into[key] = value;
  }
}
merge(STRINGS.en, MORE.en);
merge(STRINGS.ar, MORE.ar);
merge(STRINGS.en, VIDEOS.en);
merge(STRINGS.ar, VIDEOS.ar);