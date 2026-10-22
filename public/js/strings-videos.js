// Words for Explore, videos, notifications and quick follow. Merged into STRINGS in strings.js.
// Arabic notification lines avoid gendered verbs, since we don't know who's a he or a she.

export const VIDEOS = {
  en: {
    nav: { explore: 'Explore', notifications: 'Notifications' },
    plural: {
      others: { one: '{name} and 1 other', other: '{name} and {n} others' },
      wouldJoin: { one: '{n} would join a lesson', other: '{n} would join a lesson' },
      comments: { one: '{n} comment', other: '{n} comments' },
      wantLesson: { one: '{n} wants a lesson on this', other: '{n} want a lesson on this' }
    },
    quickFollow: {
      follow: 'Follow {name}', following: 'Following {name}', done: "You're following {name}", requested: 'Follow request sent to {name}',
      undo: 'Undo', undone: 'Unfollowed {name}'
    },
    notif: {
      title: 'Notifications', settings: 'Settings', unread: '{n} unread', two: '{a} and {b}', justNow: 'just now', new: 'New', earlier: 'Earlier',
      empty: "Nothing yet. When people follow you, join your lessons or comment on your videos, you'll see it here.",
      types: {
        follow: '{who} started following you',
        follow_request: '{who} asked to follow you',
        follow_accepted: '{who} accepted your follow request',
        rsvp: '{who} joined {lesson}',
        question: '{who} asked a question about {lesson}',
        note: '{who} sent you a thank-you note for {lesson}',
        waitlist_up: "A seat opened up! You're going to {lesson}",
        answer: '{who} answered your question about {lesson}',
        lesson_changed: '{who} changed {lesson}. Have a look at the new details.',
        lesson_cancelled: '{who} cancelled {lesson}',
        video_comment: '{who} commented on your video {video}',
        video_interest: '{who} would join a lesson on {video}',
        video_lesson: '{who} turned {video} into a lesson: {lesson}',
        wish_taught: '{who} is teaching a wish you asked for: {lesson}'
      },
      settingsTitle: 'Notifications', settingsHint: 'Choose what shows up in your bell.',
      groups: { people: 'Followers', my_lessons: 'Your lessons', joined_lessons: "Lessons you're going to", videos: 'Your videos', wishes: 'Wishes' },
      groupHints: {
        people: 'New followers and follow requests',
        my_lessons: 'People joining, asking questions and saying thanks',
        joined_lessons: 'Changes, cancellations, waitlist seats and answers to your questions',
        videos: 'Comments, "I\'d join" taps, and videos that became lessons',
        wishes: 'When a wish you asked for gets taught'
      },
      emailNote: 'Emails only come for lesson reminders and when a video you said you\'d join becomes a lesson.'
    },
    explore: {
      title: 'Explore', videos: 'Videos', wishes: 'Wishes',
      lede: 'Videos people made: ideas, vlogs, recipes, how-tos, any length. Tap “I’d join” if you’d come to a lesson on it.',
      share: 'Share a video', people: 'People to follow',
      why: { follows_you: 'Follows you', club: 'In your club', topic: 'Into what you like' },
      topic: 'Topic', allTopics: 'All topics', empty: 'No videos yet. Share the first one!', emptyFilter: 'No videos here yet.', more: 'Show more',
      wishesNoClub: 'Wishes belong to a club. Join or start one to ask for lessons.'
    },
    video: {
      label: 'Video', link: 'Link', play: 'Play {title}', opensOn: 'Opens on {site}.', loadsFrom: 'Plays from {site}.', openOn: 'Open on {site}',
      nowLesson: 'Now a lesson', fromVideo: 'From your video', hidden: 'This video is hidden after several reports, until an admin reviews it.',
      commentHidden: 'Hidden after reports. Only you and admins can see it.', reportComment: 'Report',
      becameLesson: 'This became a lesson', noInterestYet: 'Nobody has tapped “I’d join” yet.',
      ownerHint: 'Turn it into a lesson whenever you like. Everyone who tapped “I’d join” will hear about it.',
      turnInto: 'Turn into a lesson', remove: 'Remove video', removeComment: 'Remove comment', interested: 'You’d join', wouldJoin: 'I’d join a lesson on this',
      beFirst: 'Be the first to say you’d join.', comments: 'Comments', commentPh: 'Add a comment…', post: 'Post', noComments: 'No comments yet. Say something nice!',
      interestToast: "{name} will see you'd join. You'll hear if it becomes a lesson.",
      removeCommentConfirm: 'Remove this comment?', removeConfirm: 'Remove this video from Teach Club? (It stays on the site it came from.)', removed: 'Video removed.',
      shareTitle: 'Share a video', shareLede: 'Paste a link to a video you made: an idea, a vlog, a recipe, a how-to. Any length.',
      newAccount: 'New accounts can share videos after 3 days. Until then you can watch, comment and tap “I’d join”.',
      linkLabel: 'Video link', check: 'Check', checking: 'Checking…',
      supported: 'Works with YouTube, TikTok, Instagram, Vimeo and Google Drive (set to “Anyone with the link”). Other links show as a card.',
      titleLabel: 'Title', titlePh: 'e.g. Knife skills in 5 minutes', captionLabel: 'What’s it about?', captionPh: 'A line or two about the video',
      clubSub: 'Everyone in your club', followersSub: 'Your club and your followers',
      noClub: 'Your followers will see this video.', postVideo: 'Share video', posting: 'Sharing…', posted: 'Video shared!',
      needLink: 'Paste a video link first.', needTitle: 'Give your video a title.',
      followersOnly: 'Followers only', reportOn: 'Video: {title}', reportOnComment: 'Comment on a video',
      reportHeading: 'Report this video', reportCommentHeading: 'Report this comment',
      emptyMine: 'Share a video of something you love or want to teach.', emptyOther: '{name} hasn’t shared any videos yet.'
    }
  },
  ar: {
    nav: { explore: 'استكشف', notifications: 'الإشعارات' },
    plural: {
      others: { one: '{name} وشخص آخر', two: '{name} وشخصان آخران', few: '{name} و{n} آخرين', many: '{name} و{n} آخرين', other: '{name} و{n} آخرين' },
      wouldJoin: { one: 'شخص واحد سيحضر درسًا عنه', two: 'شخصان سيحضران درسًا عنه', few: '{n} أشخاص سيحضرون درسًا عنه', many: '{n} شخصًا سيحضرون درسًا عنه', other: '{n} شخص سيحضرون درسًا عنه' },
      comments: { one: 'تعليق واحد', two: 'تعليقان', few: '{n} تعليقات', many: '{n} تعليقًا', other: '{n} تعليق' },
      wantLesson: { one: 'شخص يريد درسًا عنه', two: 'شخصان يريدان درسًا عنه', few: '{n} أشخاص يريدون درسًا عنه', many: '{n} شخصًا يريدون درسًا عنه', other: '{n} شخص يريدون درسًا عنه' }
    },
    quickFollow: {
      follow: 'تابع {name}', following: 'تتابع {name}', done: 'أنت الآن تتابع {name}', requested: 'أُرسل طلب المتابعة إلى {name}',
      undo: 'تراجع', undone: 'ألغيت متابعة {name}'
    },
    notif: {
      title: 'الإشعارات', settings: 'الإعدادات', unread: '{n} غير مقروء', two: '{a} و{b}', justNow: 'الآن', new: 'جديد', earlier: 'سابقًا',
      empty: 'لا شيء بعد. عندما يتابعك أحد أو ينضم إلى دروسك أو يعلّق على فيديوهاتك، ستراه هنا.',
      types: {
        follow: 'متابع جديد: {who}',
        follow_request: 'طلب متابعة من {who}',
        follow_accepted: 'تم قبول طلب متابعتك لـ{who}',
        rsvp: 'انضمام جديد إلى {lesson}: {who}',
        question: 'سؤال جديد من {who} عن {lesson}',
        note: 'رسالة شكر من {who} على {lesson}',
        waitlist_up: 'توفّر مقعد! أصبحت من حضور {lesson}',
        answer: 'رد من {who} على سؤالك عن {lesson}',
        lesson_changed: 'تغيّرت تفاصيل {lesson}. ألقِ نظرة على الجديد.',
        lesson_cancelled: 'تم إلغاء {lesson}',
        video_comment: 'تعليق من {who} على فيديوك {video}',
        video_interest: 'رغبة في حضور درس عن {video}: {who}',
        video_lesson: 'تحوّل الفيديو {video} إلى درس: {lesson}',
        wish_taught: 'أمنية طلبتها صارت درسًا: {lesson}'
      },
      settingsTitle: 'الإشعارات', settingsHint: 'اختر ما يظهر لك في الجرس.',
      groups: { people: 'المتابعون', my_lessons: 'دروسك', joined_lessons: 'الدروس التي ستحضرها', videos: 'فيديوهاتك', wishes: 'الأمنيات' },
      groupHints: {
        people: 'المتابعون الجدد وطلبات المتابعة',
        my_lessons: 'من ينضم ويسأل ويقول شكرًا',
        joined_lessons: 'التغييرات والإلغاء ومقاعد قائمة الانتظار والرد على أسئلتك',
        videos: 'التعليقات، ومن سيحضر، والفيديوهات التي صارت دروسًا',
        wishes: 'عندما يُعلَّم شيء طلبته'
      },
      emailNote: 'لا تصلك رسائل بريد إلا لتذكيرات الدروس، وعندما يصبح فيديو قلت إنك ستحضره درسًا.'
    },
    explore: {
      title: 'استكشف', videos: 'فيديوهات', wishes: 'أمنيات',
      lede: 'فيديوهات صنعها الأعضاء: أفكار، يوميات، وصفات، وشروحات بأي طول. اضغط «سأحضر» إن كنت ستحضر درسًا عنه.',
      share: 'شارك فيديو', people: 'أشخاص قد تتابعهم',
      why: { follows_you: 'من متابعيك', club: 'من ناديك', topic: 'اهتمامات مشتركة' },
      topic: 'الموضوع', allTopics: 'كل المواضيع', empty: 'لا فيديوهات بعد. شارك أول فيديو!', emptyFilter: 'لا فيديوهات هنا بعد.', more: 'عرض المزيد',
      wishesNoClub: 'الأمنيات خاصة بالأندية. انضم إلى نادٍ أو أنشئ واحدًا لتطلب دروسًا.'
    },
    video: {
      label: 'فيديو', link: 'رابط', play: 'تشغيل {title}', opensOn: 'يفتح على {site}.', loadsFrom: 'يُشغَّل من {site}.', openOn: 'افتح على {site}',
      nowLesson: 'صار درسًا', fromVideo: 'من فيديوك', hidden: 'هذا الفيديو مخفي بعد عدة بلاغات، إلى أن يراجعه مشرف.',
      commentHidden: 'مخفي بعد بلاغات. لا يراه إلا أنت والمشرفون.', reportComment: 'إبلاغ',
      becameLesson: 'صار هذا درسًا', noInterestYet: 'لم يضغط أحد «سأحضر» بعد.',
      ownerHint: 'حوّله إلى درس متى شئت، وسيصل الخبر لكل من ضغط «سأحضر».',
      turnInto: 'حوّله إلى درس', remove: 'أزل الفيديو', removeComment: 'أزل التعليق', interested: 'ستحضر', wouldJoin: 'سأحضر درسًا عن هذا',
      beFirst: 'كن أول من يقول إنه سيحضر.', comments: 'التعليقات', commentPh: 'أضف تعليقًا…', post: 'انشر', noComments: 'لا تعليقات بعد. قل شيئًا لطيفًا!',
      interestToast: 'سيعرف {name} أنك ستحضر، وسيصلك خبر إن صار درسًا.',
      removeCommentConfirm: 'إزالة هذا التعليق؟', removeConfirm: 'إزالة هذا الفيديو من Teach Club؟ (يبقى على الموقع الأصلي.)', removed: 'تمت إزالة الفيديو.',
      shareTitle: 'شارك فيديو', shareLede: 'الصق رابط فيديو صنعته: فكرة، يوميات، وصفة، أو شرح. بأي طول.',
      newAccount: 'يمكن للحسابات الجديدة مشاركة الفيديوهات بعد 3 أيام. حتى ذلك الحين يمكنك المشاهدة والتعليق والضغط على «سأحضر».',
      linkLabel: 'رابط الفيديو', check: 'تحقق', checking: 'جارٍ التحقق…',
      supported: 'يعمل مع يوتيوب وتيك توك وإنستغرام وفيميو وGoogle Drive (بإعداد «أي شخص لديه الرابط»). الروابط الأخرى تظهر كبطاقة.',
      titleLabel: 'العنوان', titlePh: 'مثال: مهارات السكين في 5 دقائق', captionLabel: 'عمّ يتحدث؟', captionPh: 'سطر أو سطران عن الفيديو',
      clubSub: 'كل أعضاء ناديك', followersSub: 'ناديك ومتابعوك',
      noClub: 'سيرى متابعوك هذا الفيديو.', postVideo: 'شارك الفيديو', posting: 'جارٍ المشاركة…', posted: 'تمت مشاركة الفيديو!',
      needLink: 'الصق رابط فيديو أولًا.', needTitle: 'أعطِ الفيديو عنوانًا.',
      followersOnly: 'للمتابعين فقط', reportOn: 'فيديو: {title}', reportOnComment: 'تعليق على فيديو',
      reportHeading: 'الإبلاغ عن هذا الفيديو', reportCommentHeading: 'الإبلاغ عن هذا التعليق',
      emptyMine: 'شارك فيديو عن شيء تحبه أو تريد تعليمه.', emptyOther: 'لم يشارك {name} أي فيديو بعد.'
    }
  }
};
