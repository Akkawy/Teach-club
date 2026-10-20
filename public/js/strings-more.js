// More words (safety, home-screen install, in-person lessons, following, topics, materials).
// Merged into strings.js; same layout: English under en, Arabic under ar.

export const MORE = {
  en: {
    plural: {
      friendsGoing: { one: '{n} person you follow is going', other: '{n} people you follow are going' },
      seatsLeft: { one: '{n} seat left', other: '{n} seats left' },
      materialsLocked: { one: '{n} link, shown after you say “I’m in”', other: '{n} links, shown after you say “I’m in”' },
      followers: { zero: 'No followers', one: '{n} follower', other: '{n} followers' }
    },
    topics: {
      cooking: 'Cooking', tech: 'Tech', languages: 'Languages', art: 'Art & design', music: 'Music', science: 'Science', sports: 'Sports & fitness',
      health: 'Health', money: 'Money', books: 'Books & writing', games: 'Games', crafts: 'Crafts & DIY', travel: 'Travel', career: 'Career',
      history: 'History & culture', nature: 'Nature'
    },
    rules: {
      title: 'Community rules', heading: 'Community rules', intro: 'Teach Club is for friendly, short lessons. To keep it safe and fun:',
      items: [
        'Be kind. No harassment, hate or bullying.',
        'Teach from your own experience, and say when you’re not sure. Lessons here are not professional advice.',
        'No ads, selling or spam. Lessons are for sharing, not marketing.',
        'In-person lessons happen in public places only (cafés, libraries, parks). Never share a home address.',
        'Nothing dangerous or illegal, and no meetups that could put anyone at risk.',
        'Report anything that feels wrong. Club admins and the site owner review every report.'
      ],
      agree: 'I’m 18 or older and I agree to the', agreeLink: 'community rules', mustAgree: 'Please confirm you’re 18+ and agree to the community rules.',
      human: 'Please wait for the “are you human?” check to finish.'
    },
    installStep: {
      title: 'Add to home screen', heading: 'Put Teach Club on your home screen', lede: 'It opens like an app: full screen, one tap away.',
      ios: ['Tap the Share button {icon} at the bottom of Safari', 'Scroll down and tap “Add to Home Screen”', 'Tap “Add”'],
      android: ['Tap the ⋮ menu at the top of Chrome', 'Tap “Install app” or “Add to Home screen”'],
      inApp: 'You opened this inside another app (like WhatsApp or Instagram), and those can’t install apps.',
      inAppHow: 'Tap the menu (⋯) and choose “Open in Safari” or “Open in browser”, then install from there.',
      copy: 'Copy link', copied: 'Link copied. Paste it into Safari or Chrome.', later: 'Maybe later', next: 'Continue',
      installed: 'Installed! Find Teach Club on your home screen.', bannerTitle: 'Get the app', bannerBody: 'Add Teach Club to your home screen.', show: 'Show me',
      dismiss: 'Dismiss'
    },
    feed: {
      label: 'Show', club: 'My club', following: 'Following', all: 'Everything', forYou: 'For you',
      noClubTitle: 'No club yet', noClubBody: 'Follow teachers to see their lessons, or start a club with friends.', noClubButton: 'Find or start a club',
      emptyFollowing: 'Lessons from people you follow will show up here.',
      reasons: {
        topic: 'Because you like {topic}', wish: 'You asked for this', following: 'You follow {name}', teacher: 'You enjoyed {name}’s lessons',
        format: 'You like {format} lessons', popular: 'Popular', soon: 'Coming up soon'
      },
      modes: { online: 'Online', in_person: 'In person', both: 'Online + in person' }
    },
    where: {
      title: 'Where?', online: 'Online', in_person: 'In person', both: 'Both', place: 'Place', placePh: 'e.g. Café Barn’s, Olaya branch',
      area: 'Area', areaPh: 'e.g. Olaya, Riyadh', areaHint: 'Everyone sees the area. Only people who say “I’m in” see the exact place and map.',
      map: 'Map link', mapPh: 'Paste a Google Maps link (optional)', seats: 'Seats', noLimit: 'No limit', seatsHint: 'When it’s full, people can join a waitlist.',
      public: 'This is a public place (café, library, park…), not anyone’s home.', safety: 'Meet in public places only. Never share a home address.',
      who: 'Who can see it?', club: 'My club', clubSub: 'Only club members', followers: 'Club + followers', followersSub: 'Also people who follow you',
      noClub: 'You’re not in a club yet, so this lesson is for your followers.', needPlace: 'Add the place and area first.', needPublic: 'Please confirm it’s a public place.',
      topics: 'Topics', topicsHint: 'Pick up to 3. They help the right people find your lesson.',
      notes: 'Private notes', notesPh: 'Your full points for this part. Only you see these, in presenter mode.',
      materials: 'Materials', materialsHint: 'Links to slides, docs or videos (Google Slides, Docs, Drive, YouTube…). People who are going see them, and everyone after the lesson.',
      urlPh: 'https://…', titlePh: 'Title (optional)', add: 'Add link', remove: 'Remove', badLink: 'Paste a full link starting with https://', label: 'Where'
    },
    lessonMore: {
      placeHidden: 'Exact place shown after you say “I’m in”', openMap: 'Open map', full: 'Full', waitlist: 'You’re on the waitlist (#{n})',
      joinWaitlist: 'Join the waitlist', leaveWaitlist: 'Leave the waitlist', joinedWaitlist: 'It’s full, so you’re on the waitlist. You’ll move in if a seat opens.',
      materials: 'Materials', archive: 'Archive', unarchive: 'Unarchive', archived: 'Archived. Only you can see this lesson now.', unarchived: 'Back on your profile and calendar.',
      archivedBanner: 'Archived: only you can see this lesson.', hiddenBanner: 'Hidden after several reports. Admins will review it.',
      disclaimer: 'Shared from personal experience, not professional advice.', notes: 'Your private notes', visFollowers: 'Followers can see this', visClub: 'Club only'
    },
    social: {
      follow: 'Follow', following: 'Following', requested: 'Requested', unfollow: 'Unfollow', block: 'Block', unblock: 'Unblock',
      blockConfirm: 'Block {name}? You won’t see each other’s lessons or profiles, and any follows are removed.', blocked: 'Blocked.', unblocked: 'Unblocked.',
      followingCount: '{n} following', interests: 'Interested in', archived: 'Archived lessons', manage: 'Followers & requests', newRequests: '{n} new',
      share: 'Share profile', copied: 'Profile link copied!', suspended: 'This account is suspended.', ban: 'Suspend account', unban: 'Restore account',
      banConfirm: 'Suspend {name}? They’ll be logged out and can’t log in.', title: 'Followers', tabFollowers: 'Followers', tabFollowing: 'Following',
      tabRequests: 'Requests', tabBlocked: 'Blocked', accept: 'Accept', decline: 'Decline', remove: 'Remove', empty: 'Nobody here yet.',
      interestsTitle: 'What do you like learning about?', interestsHint: 'Used to suggest lessons “For you”.',
      approve: 'Approve new followers', approveHint: 'People ask to follow you, and you decide.'
    },
    owner: {
      title: 'Site owner', heading: 'All reports', lede: 'Open reports from every club.', none: 'No open reports.', club: 'Club: {club}', hidden: 'Hidden',
      link: 'Site owner tools'
    },
    presentMore: { notes: 'Your notes' }
  },

  ar: {
    plural: {
      friendsGoing: { one: 'شخص تتابعه سيحضر', two: 'شخصان تتابعهما سيحضران', few: '{n} أشخاص تتابعهم سيحضرون', many: '{n} شخصًا تتابعهم سيحضرون', other: '{n} شخص تتابعهم سيحضرون' },
      seatsLeft: { one: 'مقعد واحد متبقٍ', two: 'مقعدان متبقيان', few: '{n} مقاعد متبقية', many: '{n} مقعدًا متبقيًا', other: '{n} مقعد متبقٍ' },
      materialsLocked: { one: 'رابط واحد يظهر بعد تأكيد حضورك', two: 'رابطان يظهران بعد تأكيد حضورك', few: '{n} روابط تظهر بعد تأكيد حضورك', many: '{n} رابطًا تظهر بعد تأكيد حضورك', other: '{n} رابط تظهر بعد تأكيد حضورك' },
      followers: { zero: 'لا متابعين', one: 'متابع واحد', two: 'متابعان', few: '{n} متابعين', many: '{n} متابعًا', other: '{n} متابع' }
    },
    topics: {
      cooking: 'طبخ', tech: 'تقنية', languages: 'لغات', art: 'فن وتصميم', music: 'موسيقى', science: 'علوم', sports: 'رياضة ولياقة',
      health: 'صحة', money: 'مال', books: 'كتب وكتابة', games: 'ألعاب', crafts: 'حِرف وأعمال يدوية', travel: 'سفر', career: 'مهنة',
      history: 'تاريخ وثقافة', nature: 'طبيعة'
    },
    rules: {
      title: 'قواعد المجتمع', heading: 'قواعد المجتمع', intro: 'Teach Club مكان لدروس قصيرة وودّية. لنحافظ عليه آمنًا وممتعًا:',
      items: [
        'كن لطيفًا. لا تحرّش ولا كراهية ولا تنمّر.',
        'علّم من تجربتك الشخصية، وقل إن لم تكن متأكدًا. الدروس هنا ليست استشارة مهنية.',
        'لا إعلانات ولا بيع ولا رسائل مزعجة. الدروس للمشاركة لا للتسويق.',
        'الدروس الحضورية في أماكن عامة فقط (مقاهٍ، مكتبات، حدائق). لا تشارك عنوان منزل أبدًا.',
        'لا شيء خطير أو مخالف للقانون، ولا لقاءات قد تعرّض أحدًا للخطر.',
        'أبلغ عن أي شيء يبدو خاطئًا. يراجع مشرفو الأندية ومالك الموقع كل بلاغ.'
      ],
      agree: 'عمري 18 عامًا أو أكثر وأوافق على', agreeLink: 'قواعد المجتمع', mustAgree: 'يُرجى تأكيد أن عمرك 18 عامًا أو أكثر وموافقتك على قواعد المجتمع.',
      human: 'انتظر حتى ينتهي التحقق من أنك إنسان.'
    },
    installStep: {
      title: 'أضف إلى الشاشة الرئيسية', heading: 'ضع Teach Club على شاشتك الرئيسية', lede: 'يفتح كتطبيق: بملء الشاشة وبلمسة واحدة.',
      ios: ['اضغط زر المشاركة {icon} أسفل Safari', 'مرّر للأسفل واضغط «إضافة إلى الشاشة الرئيسية»', 'اضغط «إضافة»'],
      android: ['اضغط قائمة ⋮ أعلى Chrome', 'اضغط «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية»'],
      inApp: 'فتحت هذا داخل تطبيق آخر (مثل واتساب أو إنستغرام)، وهذه التطبيقات لا تستطيع تثبيت التطبيقات.',
      inAppHow: 'اضغط القائمة (⋯) واختر «فتح في Safari» أو «فتح في المتصفح»، ثم ثبّته من هناك.',
      copy: 'انسخ الرابط', copied: 'تم نسخ الرابط. الصقه في Safari أو Chrome.', later: 'لاحقًا', next: 'متابعة',
      installed: 'تم التثبيت! ستجد Teach Club في شاشتك الرئيسية.', bannerTitle: 'احصل على التطبيق', bannerBody: 'أضف Teach Club إلى شاشتك الرئيسية.', show: 'أرني',
      dismiss: 'إخفاء'
    },
    feed: {
      label: 'عرض', club: 'ناديّ', following: 'من أتابعهم', all: 'الكل', forYou: 'مقترح لك',
      noClubTitle: 'لست في نادٍ بعد', noClubBody: 'تابع المعلّمين لترى دروسهم، أو أنشئ ناديًا مع أصدقائك.', noClubButton: 'ابحث عن نادٍ أو أنشئ واحدًا',
      emptyFollowing: 'ستظهر هنا دروس من تتابعهم.',
      reasons: {
        topic: 'لأنك تحب {topic}', wish: 'أنت طلبت هذا', following: 'أنت تتابع {name}', teacher: 'استمتعت بدروس {name}',
        format: 'تحب دروس {format}', popular: 'رائج', soon: 'قريبًا'
      },
      modes: { online: 'عن بُعد', in_person: 'حضوري', both: 'عن بُعد + حضوري' }
    },
    where: {
      title: 'أين؟', online: 'عن بُعد', in_person: 'حضوري', both: 'كلاهما', place: 'المكان', placePh: 'مثال: مقهى بارنز، فرع العليا',
      area: 'المنطقة', areaPh: 'مثال: العليا، الرياض', areaHint: 'يرى الجميع المنطقة، ولا يرى المكان الدقيق والخريطة إلا من يؤكد حضوره.',
      map: 'رابط الخريطة', mapPh: 'الصق رابط خرائط Google (اختياري)', seats: 'المقاعد', noLimit: 'بلا حد', seatsHint: 'عند امتلائه، يمكن الانضمام إلى قائمة انتظار.',
      public: 'هذا مكان عام (مقهى، مكتبة، حديقة…) وليس منزل أحد.', safety: 'التقِ في أماكن عامة فقط. لا تشارك عنوان منزل أبدًا.',
      who: 'من يستطيع رؤيته؟', club: 'ناديّ', clubSub: 'أعضاء النادي فقط', followers: 'النادي + المتابعون', followersSub: 'ومن يتابعونك أيضًا',
      noClub: 'لست في نادٍ بعد، لذا هذا الدرس لمتابعيك.', needPlace: 'أضف المكان والمنطقة أولًا.', needPublic: 'يُرجى تأكيد أن المكان عام.',
      topics: 'المواضيع', topicsHint: 'اختر حتى 3. تساعد الأشخاص المناسبين على إيجاد درسك.',
      notes: 'ملاحظات خاصة', notesPh: 'نقاطك الكاملة لهذا الجزء. لا يراها غيرك، وتظهر في وضع العرض.',
      materials: 'المواد', materialsHint: 'روابط لشرائح أو مستندات أو فيديوهات (Google Slides وDocs وDrive وYouTube…). يراها من سيحضر، والجميع بعد الدرس.',
      urlPh: 'https://…', titlePh: 'العنوان (اختياري)', add: 'أضف رابطًا', remove: 'إزالة', badLink: 'الصق رابطًا كاملًا يبدأ بـ https://', label: 'المكان'
    },
    lessonMore: {
      placeHidden: 'يظهر المكان الدقيق بعد تأكيد حضورك', openMap: 'افتح الخريطة', full: 'ممتلئ', waitlist: 'أنت على قائمة الانتظار (#{n})',
      joinWaitlist: 'انضم إلى قائمة الانتظار', leaveWaitlist: 'غادر قائمة الانتظار', joinedWaitlist: 'الدرس ممتلئ، لذا أنت على قائمة الانتظار. ستنتقل إلى الحضور إن فرغ مقعد.',
      materials: 'المواد', archive: 'أرشفة', unarchive: 'إلغاء الأرشفة', archived: 'تمت الأرشفة. أنت وحدك ترى هذا الدرس الآن.', unarchived: 'عاد إلى ملفك والتقويم.',
      archivedBanner: 'مؤرشف: أنت وحدك ترى هذا الدرس.', hiddenBanner: 'مخفي بعد عدة بلاغات. سيراجعه المشرفون.',
      disclaimer: 'مُشارَك من تجربة شخصية، وليس استشارة مهنية.', notes: 'ملاحظاتك الخاصة', visFollowers: 'يراه المتابعون', visClub: 'للنادي فقط'
    },
    social: {
      follow: 'متابعة', following: 'تتابعه', requested: 'تم الطلب', unfollow: 'إلغاء المتابعة', block: 'حظر', unblock: 'إلغاء الحظر',
      blockConfirm: 'حظر {name}؟ لن يرى أحدكما دروس الآخر أو ملفه، وستُحذف المتابعات.', blocked: 'تم الحظر.', unblocked: 'تم إلغاء الحظر.',
      followingCount: 'يتابع {n}', interests: 'مهتم بـ', archived: 'الدروس المؤرشفة', manage: 'المتابعون والطلبات', newRequests: '{n} جديد',
      share: 'شارك الملف', copied: 'تم نسخ رابط الملف!', suspended: 'هذا الحساب موقوف.', ban: 'إيقاف الحساب', unban: 'استعادة الحساب',
      banConfirm: 'إيقاف حساب {name}؟ سيتم تسجيل خروجه ولن يستطيع الدخول.', title: 'المتابعون', tabFollowers: 'المتابعون', tabFollowing: 'أتابعهم',
      tabRequests: 'الطلبات', tabBlocked: 'المحظورون', accept: 'قبول', decline: 'رفض', remove: 'إزالة', empty: 'لا أحد هنا بعد.',
      interestsTitle: 'ما الذي تحب أن تتعلّمه؟', interestsHint: 'نستخدمها لاقتراح دروس «مقترحة لك».',
      approve: 'الموافقة على المتابعين الجدد', approveHint: 'يطلب الناس متابعتك، وأنت تقرّر.'
    },
    owner: {
      title: 'مالك الموقع', heading: 'كل البلاغات', lede: 'البلاغات المفتوحة من كل الأندية.', none: 'لا توجد بلاغات مفتوحة.', club: 'النادي: {club}', hidden: 'مخفي',
      link: 'أدوات مالك الموقع'
    },
    presentMore: { notes: 'ملاحظاتك' }
  }
};
