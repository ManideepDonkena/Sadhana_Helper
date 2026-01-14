/**
 * 🙏 Krishna-Conscious Verses Database
 * 
 * 100+ curated verses from Bhagavad Gita for notifications and inspiration
 * Each verse is tagged with mood/context for appropriate timing
 */

const KC_VERSES = [
    // ========================================
    // MOTIVATION & ACTION (For Morning/Start)
    // ========================================
    {
        ref: "BG 2.47",
        sanskrit: "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन",
        text: "You have a right to perform your prescribed duties, but you are not entitled to the fruits of your actions.",
        chapter: 2,
        verse: 47,
        mood: ["motivation", "morning", "action"],
        topic: "Karma Yoga"
    },
    {
        ref: "BG 3.8",
        sanskrit: "नियतं कुरु कर्म त्वं कर्म ज्यायो ह्यकर्मणः",
        text: "Perform your prescribed duty, for action is better than inaction. A man cannot even maintain his physical body without work.",
        chapter: 3,
        verse: 8,
        mood: ["motivation", "morning", "action"],
        topic: "Prescribed Duty"
    },
    {
        ref: "BG 3.19",
        sanskrit: "तस्मादसक्तः सततं कार्यं कर्म समाचर",
        text: "Therefore, without being attached to the fruits of activities, one should act as a matter of duty; for by working without attachment, one attains the Supreme.",
        chapter: 3,
        verse: 19,
        mood: ["motivation", "detachment"],
        topic: "Detached Action"
    },
    {
        ref: "BG 2.48",
        sanskrit: "योगस्थः कुरु कर्माणि सङ्गं त्यक्त्वा धनञ्जय",
        text: "Perform your duty equipoised, O Arjuna, abandoning all attachment to success or failure. Such equanimity is called yoga.",
        chapter: 2,
        verse: 48,
        mood: ["motivation", "equanimity"],
        topic: "Yoga of Action"
    },
    {
        ref: "BG 18.46",
        sanskrit: "यतः प्रवृत्तिर्भूतानां येन सर्वमिदं ततम्",
        text: "By worship of the Lord, who is the source of all beings and who is all-pervading, man can, in the performance of his own duty, attain perfection.",
        chapter: 18,
        verse: 46,
        mood: ["motivation", "devotion"],
        topic: "Perfection Through Duty"
    },

    // ========================================
    // ENCOURAGEMENT & STRENGTH
    // ========================================
    {
        ref: "BG 6.5",
        sanskrit: "उद्धरेदात्मनात्मानं नात्मानमवसादयेत्",
        text: "One must elevate himself by his own mind, not degrade himself. The mind is the friend of the conditioned soul, and his enemy as well.",
        chapter: 6,
        verse: 5,
        mood: ["encouragement", "strength", "self-improvement"],
        topic: "Self-Elevation"
    },
    {
        ref: "BG 2.3",
        sanskrit: "क्लैब्यं मा स्म गमः पार्थ नैतत्त्वय्युपपद्यते",
        text: "O son of Pritha, do not yield to this degrading impotence. It does not become you. Give up such petty weakness of heart and arise, O chastiser of the enemy.",
        chapter: 2,
        verse: 3,
        mood: ["encouragement", "strength"],
        topic: "Overcoming Weakness"
    },
    {
        ref: "BG 4.39",
        sanskrit: "श्रद्धावान्ल् लभते ज्ञानं तत्परः संयतेन्द्रियः",
        text: "A faithful man who is absorbed in transcendental knowledge and who subdues his senses quickly attains the supreme spiritual peace.",
        chapter: 4,
        verse: 39,
        mood: ["encouragement", "faith"],
        topic: "Power of Faith"
    },
    {
        ref: "BG 6.9",
        sanskrit: "सुहृन्मित्रार्युदासीनमध्यस्थद्वेष्यबन्धुषु",
        text: "A person is said to be still further advanced when he regards all—the honest well-wisher, friends and enemies, the envious, the pious, the sinner and those who are indifferent and impartial—with an equal mind.",
        chapter: 6,
        verse: 9,
        mood: ["encouragement", "equanimity"],
        topic: "Equal Vision"
    },
    {
        ref: "BG 18.58",
        sanskrit: "मच्चित्तः सर्वदुर्गाणि मत्प्रसादात्तरिष्यसि",
        text: "If you become conscious of Me, you will pass over all the obstacles of conditional life by My grace.",
        chapter: 18,
        verse: 58,
        mood: ["encouragement", "grace", "devotion"],
        topic: "Krishna's Grace"
    },

    // ========================================
    // DEVOTION (Bhakti)
    // ========================================
    {
        ref: "BG 9.22",
        sanskrit: "अनन्याश्चिन्तयन्तो मां ये जनाः पर्युपासते",
        text: "To those who worship Me with love and devotion, meditating on My transcendental form, I carry what they lack and preserve what they have.",
        chapter: 9,
        verse: 22,
        mood: ["devotion", "love", "surrender"],
        topic: "Divine Protection"
    },
    {
        ref: "BG 9.26",
        sanskrit: "पत्रं पुष्पं फलं तोयं यो मे भक्त्या प्रयच्छति",
        text: "If one offers Me with love and devotion a leaf, a flower, fruit or water, I will accept it.",
        chapter: 9,
        verse: 26,
        mood: ["devotion", "offering"],
        topic: "Simple Offering"
    },
    {
        ref: "BG 18.65",
        sanskrit: "मन्मना भव मद्भक्तो मद्याजी मां नमस्कुरु",
        text: "Always think of Me and become My devotee. Worship Me and offer your homage unto Me. Thus you will come to Me without fail. I promise you this because you are My very dear friend.",
        chapter: 18,
        verse: 65,
        mood: ["devotion", "love", "promise"],
        topic: "Promise to Devotee"
    },
    {
        ref: "BG 12.8",
        sanskrit: "मय्येव मन आधत्स्व मयि बुद्धिं निवेशय",
        text: "Just fix your mind upon Me, the Supreme Personality of Godhead, and engage all your intelligence in Me. Thus you will live in Me always, without a doubt.",
        chapter: 12,
        verse: 8,
        mood: ["devotion", "meditation"],
        topic: "Fixed Mind"
    },
    {
        ref: "BG 8.7",
        sanskrit: "तस्मात्सर्वेषु कालेषु मामनुस्मर युध्य च",
        text: "Therefore, Arjuna, you should always think of Me, and at the same time you should continue your prescribed duty of fighting. With your activities dedicated to Me and your mind and intelligence fixed on Me, you will attain Me without doubt.",
        chapter: 8,
        verse: 7,
        mood: ["devotion", "remembrance"],
        topic: "Constant Remembrance"
    },
    {
        ref: "BG 9.34",
        sanskrit: "मन्मना भव मद्भक्तो मद्याजी मां नमस्कुरु",
        text: "Engage your mind always in thinking of Me, offer obeisances and worship Me. Being completely absorbed in Me, surely you will come to Me.",
        chapter: 9,
        verse: 34,
        mood: ["devotion", "meditation"],
        topic: "Complete Absorption"
    },
    {
        ref: "BG 11.55",
        sanskrit: "मत्कर्मकृन्मत्परमो मद्भक्तः सङ्गवर्जितः",
        text: "My dear Arjuna, one who is engaged in My pure devotional service, free from the contaminations of previous activities and from mental speculation, who is friendly to every living entity, certainly comes to Me.",
        chapter: 11,
        verse: 55,
        mood: ["devotion", "pure"],
        topic: "Pure Devotion"
    },

    // ========================================
    // PEACE & CALM (For Evening/Rest)
    // ========================================
    {
        ref: "BG 2.66",
        sanskrit: "नास्ति बुद्धिरयुक्तस्य न चायुक्तस्य भावना",
        text: "One who is not in transcendental consciousness can have neither a controlled mind nor steady intelligence, without which there is no possibility of peace. And how can there be any happiness without peace?",
        chapter: 2,
        verse: 66,
        mood: ["peace", "evening", "reflection"],
        topic: "Path to Peace"
    },
    {
        ref: "BG 2.71",
        sanskrit: "विहाय कामान्यः सर्वान्पुमांश्चरति निःस्पृहः",
        text: "A person who has given up all desires for sense gratification, who lives free from desires, who has given up all sense of proprietorship and is devoid of false ego—he alone can attain real peace.",
        chapter: 2,
        verse: 71,
        mood: ["peace", "evening", "detachment"],
        topic: "Real Peace"
    },
    {
        ref: "BG 5.29",
        sanskrit: "भोक्तारं यज्ञतपसां सर्वलोकमहेश्वरम्",
        text: "The sages, knowing Me as the ultimate purpose of all sacrifices and austerities, the Supreme Lord of all planets and demigods and the benefactor and well-wisher of all living entities, attain peace from the pangs of material miseries.",
        chapter: 5,
        verse: 29,
        mood: ["peace", "knowledge"],
        topic: "Supreme Peace"
    },
    {
        ref: "BG 6.7",
        sanskrit: "जितात्मनः प्रशान्तस्य परमात्मा समाहितः",
        text: "For one who has conquered the mind, the Supersoul is already reached, for he has attained tranquility. To such a man happiness and distress, heat and cold, honor and dishonor are all the same.",
        chapter: 6,
        verse: 7,
        mood: ["peace", "equanimity"],
        topic: "Conquered Mind"
    },
    {
        ref: "BG 12.15",
        sanskrit: "यस्मान्नोद्विजते लोको लोकान्नोद्विजते च यः",
        text: "He for whom no one is put into difficulty and who is not disturbed by anxiety, who is steady in happiness and distress, is very dear to Me.",
        chapter: 12,
        verse: 15,
        mood: ["peace", "stability"],
        topic: "Dear to Krishna"
    },

    // ========================================
    // WISDOM & KNOWLEDGE
    // ========================================
    {
        ref: "BG 4.38",
        sanskrit: "न हि ज्ञानेन सदृशं पवित्रमिह विद्यते",
        text: "In this world, there is nothing so sublime and pure as transcendental knowledge. Such knowledge is the mature fruit of all mysticism.",
        chapter: 4,
        verse: 38,
        mood: ["wisdom", "knowledge"],
        topic: "Supreme Knowledge"
    },
    {
        ref: "BG 7.2",
        sanskrit: "ज्ञानं तेऽहं सविज्ञानमिदं वक्ष्याम्यशेषतः",
        text: "I shall now declare unto you in full this knowledge, both phenomenal and numinous, by knowing which there shall remain nothing further to be known.",
        chapter: 7,
        verse: 2,
        mood: ["wisdom", "knowledge"],
        topic: "Complete Knowledge"
    },
    {
        ref: "BG 10.11",
        sanskrit: "तेषामेवानुकम्पार्थमहमज्ञानजं तमः",
        text: "Out of compassion for them, I, dwelling in their hearts, destroy with the shining lamp of knowledge the darkness born of ignorance.",
        chapter: 10,
        verse: 11,
        mood: ["wisdom", "grace"],
        topic: "Light of Knowledge"
    },
    {
        ref: "BG 4.34",
        sanskrit: "तद्विद्धि प्रणिपातेन परिप्रश्नेन सेवया",
        text: "Just try to learn the truth by approaching a spiritual master. Inquire from him submissively and render service unto him.",
        chapter: 4,
        verse: 34,
        mood: ["wisdom", "guidance"],
        topic: "Seeking Knowledge"
    },
    {
        ref: "BG 13.8-12",
        sanskrit: "अमानित्वमदम्भित्वमहिंसा क्षान्तिरार्जवम्",
        text: "Humility, pridelessness, nonviolence, tolerance, simplicity, approaching a bona fide spiritual master, cleanliness, steadiness and self-control... this is declared to be knowledge.",
        chapter: 13,
        verse: 8,
        mood: ["wisdom", "virtue"],
        topic: "True Knowledge"
    },

    // ========================================
    // SURRENDER & FAITH
    // ========================================
    {
        ref: "BG 18.66",
        sanskrit: "सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज",
        text: "Abandon all varieties of religion and just surrender unto Me. I shall deliver you from all sinful reaction. Do not fear.",
        chapter: 18,
        verse: 66,
        mood: ["surrender", "faith", "refuge"],
        topic: "Complete Surrender"
    },
    {
        ref: "BG 7.14",
        sanskrit: "दैवी ह्येषा गुणमयी मम माया दुरत्यया",
        text: "This divine energy of Mine, consisting of the three modes of material nature, is difficult to overcome. But those who have surrendered unto Me can easily cross beyond it.",
        chapter: 7,
        verse: 14,
        mood: ["surrender", "grace"],
        topic: "Crossing Maya"
    },
    {
        ref: "BG 9.18",
        sanskrit: "गतिर्भर्ता प्रभुः साक्षी निवासः शरणं सुहृत्",
        text: "I am the goal, the sustainer, the master, the witness, the abode, the refuge and the most dear friend.",
        chapter: 9,
        verse: 18,
        mood: ["surrender", "refuge", "friendship"],
        topic: "Krishna as Shelter"
    },
    {
        ref: "BG 15.5",
        sanskrit: "निर्मानमोहा जितसङ्गदोषा अध्यात्मनित्या",
        text: "One who is free from illusion, false prestige, and false association, who understands the eternal, who is done with material lust and is freed from the duality of happiness and distress, and who knows how to surrender unto the Supreme Person, attains to that eternal kingdom.",
        chapter: 15,
        verse: 5,
        mood: ["surrender", "liberation"],
        topic: "Path to Liberation"
    },
    {
        ref: "BG 6.47",
        sanskrit: "योगिनामपि सर्वेषां मद्गतेनान्तरात्मना",
        text: "And of all yogis, he who always abides in Me with great faith, worshiping Me in transcendental loving service, is most intimately united with Me in yoga and is the highest of all.",
        chapter: 6,
        verse: 47,
        mood: ["surrender", "devotion", "yoga"],
        topic: "Highest Yoga"
    },

    // ========================================
    // GRATITUDE & CELEBRATION
    // ========================================
    {
        ref: "BG 10.8",
        sanskrit: "अहं सर्वस्य प्रभवो मत्तः सर्वं प्रवर्तते",
        text: "I am the source of all spiritual and material worlds. Everything emanates from Me. The wise who know this perfectly engage in My devotional service and worship Me with all their hearts.",
        chapter: 10,
        verse: 8,
        mood: ["gratitude", "wonder"],
        topic: "Source of All"
    },
    {
        ref: "BG 10.41",
        sanskrit: "यद्यद्विभूतिमत्सत्त्वं श्रीमदूर्जितमेव वा",
        text: "Know that all beautiful, glorious, and mighty creations spring from but a spark of My splendor.",
        chapter: 10,
        verse: 41,
        mood: ["gratitude", "wonder", "celebration"],
        topic: "Divine Glory"
    },
    {
        ref: "BG 11.36",
        sanskrit: "स्थाने हृषीकेश तव प्रकीर्त्या जगत्प्रहृष्यत्यनुरज्यते च",
        text: "O master of the senses, the world becomes joyful upon hearing Your name, and thus everyone becomes attached to You.",
        chapter: 11,
        verse: 36,
        mood: ["gratitude", "joy"],
        topic: "Joy in Krishna"
    },
    {
        ref: "BG 18.78",
        sanskrit: "यत्र योगेश्वरः कृष्णो यत्र पार्थो धनुर्धरः",
        text: "Wherever there is Krishna, the master of all mystics, and wherever there is Arjuna, the supreme archer, there will also certainly be opulence, victory, extraordinary power, and morality.",
        chapter: 18,
        verse: 78,
        mood: ["celebration", "victory"],
        topic: "Victory Assured"
    },

    // ========================================
    // DETACHMENT & RENUNCIATION
    // ========================================
    {
        ref: "BG 2.62-63",
        sanskrit: "ध्यायतो विषयान्पुंसः सङ्गस्तेषूपजायते",
        text: "While contemplating the objects of the senses, a person develops attachment for them, and from such attachment lust develops, and from lust anger arises.",
        chapter: 2,
        verse: 62,
        mood: ["warning", "detachment"],
        topic: "Danger of Attachment"
    },
    {
        ref: "BG 3.34",
        sanskrit: "इन्द्रियस्येन्द्रियस्यार्थे रागद्वेषौ व्यवस्थितौ",
        text: "Attachment and aversion for sense objects are seated in the senses. One should not come under the sway of such attachment and aversion, for they are stumbling blocks on the path of self-realization.",
        chapter: 3,
        verse: 34,
        mood: ["detachment", "awareness"],
        topic: "Beyond Attachment"
    },
    {
        ref: "BG 5.22",
        sanskrit: "ये हि संस्पर्शजा भोगा दुःखयोनय एव ते",
        text: "An intelligent person does not take part in the sources of misery, which are due to contact with the material senses. Such pleasures have a beginning and an end, and so the wise man does not delight in them.",
        chapter: 5,
        verse: 22,
        mood: ["detachment", "wisdom"],
        topic: "Temporary Pleasures"
    },
    {
        ref: "BG 12.17",
        sanskrit: "यो न हृष्यति न द्वेष्टि न शोचति न काङ्क्षति",
        text: "One who neither rejoices nor grieves, who neither laments nor desires, and who renounces both auspicious and inauspicious things, is very dear to Me.",
        chapter: 12,
        verse: 17,
        mood: ["detachment", "equanimity"],
        topic: "Dear Devotee"
    },

    // ========================================
    // MIND CONTROL & MEDITATION
    // ========================================
    {
        ref: "BG 6.6",
        sanskrit: "बन्धुरात्मात्मनस्तस्य येनात्मैवात्मना जितः",
        text: "For him who has conquered the mind, the mind is the best of friends; but for one who has failed to do so, his very mind will be the greatest enemy.",
        chapter: 6,
        verse: 6,
        mood: ["mind", "control"],
        topic: "Friend or Enemy"
    },
    {
        ref: "BG 6.26",
        sanskrit: "यतो यतो निश्चरति मनश्चञ्चलमस्थिरम्",
        text: "From whatever and wherever the mind wanders due to its flickering and unsteady nature, one must certainly withdraw it and bring it back under the control of the Self.",
        chapter: 6,
        verse: 26,
        mood: ["mind", "meditation"],
        topic: "Controlling Mind"
    },
    {
        ref: "BG 6.35",
        sanskrit: "असंशयं महाबाहो मनो दुर्निग्रहं चलम्",
        text: "The mind is restless, turbulent, obstinate and very strong, O Krishna, and to subdue it is more difficult than controlling the wind.",
        chapter: 6,
        verse: 35,
        mood: ["mind", "challenge"],
        topic: "Difficult Mind"
    },
    {
        ref: "BG 6.36",
        sanskrit: "असंयतात्मना योगो दुष्प्राप इति मे मतिः",
        text: "For one whose mind is unbridled, self-realization is difficult work. But he whose mind is controlled and who strives by right means is assured of success.",
        chapter: 6,
        verse: 36,
        mood: ["mind", "hope", "success"],
        topic: "Assured Success"
    },

    // ========================================
    // DEATH & ETERNITY
    // ========================================
    {
        ref: "BG 2.20",
        sanskrit: "न जायते म्रियते वा कदाचिन्",
        text: "For the soul there is never birth nor death. Nor, having once been, does he ever cease to be. He is unborn, eternal, ever-existing, undying and primeval.",
        chapter: 2,
        verse: 20,
        mood: ["eternity", "soul"],
        topic: "Eternal Soul"
    },
    {
        ref: "BG 2.22",
        sanskrit: "वासांसि जीर्णानि यथा विहाय",
        text: "As a person puts on new garments, giving up old ones, similarly, the soul accepts new material bodies, giving up the old and useless ones.",
        chapter: 2,
        verse: 22,
        mood: ["eternity", "soul"],
        topic: "Change of Bodies"
    },
    {
        ref: "BG 8.5",
        sanskrit: "अन्तकाले च मामेव स्मरन्मुक्त्वा कलेवरम्",
        text: "And whoever, at the time of death, quits his body remembering Me alone, at once attains My nature. Of this there is no doubt.",
        chapter: 8,
        verse: 5,
        mood: ["eternity", "remembrance"],
        topic: "Final Thought"
    },
    {
        ref: "BG 8.6",
        sanskrit: "यं यं वापि स्मरन्भावं त्यजत्यन्ते कलेवरम्",
        text: "Whatever state of being one remembers when he quits his body, that state he will attain without fail.",
        chapter: 8,
        verse: 6,
        mood: ["eternity", "awareness"],
        topic: "Power of Memory"
    },

    // ========================================
    // SPECIAL MOMENTS
    // ========================================
    {
        ref: "BG 4.7",
        sanskrit: "यदा यदा हि धर्मस्य ग्लानिर्भवति भारत",
        text: "Whenever and wherever there is a decline in religious practice, O descendant of Bharata, and a predominant rise of irreligion—at that time I descend Myself.",
        chapter: 4,
        verse: 7,
        mood: ["special", "avatar"],
        topic: "Divine Descent"
    },
    {
        ref: "BG 4.8",
        sanskrit: "परित्राणाय साधूनां विनाशाय च दुष्कृताम्",
        text: "In order to deliver the pious and to annihilate the miscreants, as well as to reestablish the principles of religion, I advent Myself millennium after millennium.",
        chapter: 4,
        verse: 8,
        mood: ["special", "protection"],
        topic: "Protection of Devotees"
    },
    {
        ref: "BG 10.9",
        sanskrit: "मच्चित्ता मद्गतप्राणा बोधयन्तः परस्परम्",
        text: "The thoughts of My pure devotees dwell in Me, their lives are surrendered to Me, and they derive great satisfaction and bliss enlightening one another and conversing about Me.",
        chapter: 10,
        verse: 9,
        mood: ["special", "devotees"],
        topic: "Bliss of Devotees"
    },
    {
        ref: "BG 10.10",
        sanskrit: "तेषां सततयुक्तानां भजतां प्रीतिपूर्वकम्",
        text: "To those who are constantly devoted and worship Me with love, I give the understanding by which they can come to Me.",
        chapter: 10,
        verse: 10,
        mood: ["special", "grace"],
        topic: "Divine Understanding"
    },

    // ========================================
    // NATURE OF GOD
    // ========================================
    {
        ref: "BG 7.7",
        sanskrit: "मत्तः परतरं नान्यत्किञ्चिदस्ति धनञ्जय",
        text: "O conqueror of wealth, there is no Truth superior to Me. Everything rests upon Me, as pearls are strung on a thread.",
        chapter: 7,
        verse: 7,
        mood: ["devotion", "wonder"],
        topic: "Supreme Truth"
    },
    {
        ref: "BG 9.4",
        sanskrit: "मया ततमिदं सर्वं जगदव्यक्तमूर्तिना",
        text: "By Me, in My unmanifested form, this entire universe is pervaded. All beings are in Me, but I am not in them.",
        chapter: 9,
        verse: 4,
        mood: ["wonder", "knowledge"],
        topic: "All-Pervading"
    },
    {
        ref: "BG 15.15",
        sanskrit: "सर्वस्य चाहं हृदि सन्निविष्टो",
        text: "I am seated in everyone's heart, and from Me come remembrance, knowledge and forgetfulness.",
        chapter: 15,
        verse: 15,
        mood: ["devotion", "presence"],
        topic: "In Everyone's Heart"
    },
    {
        ref: "BG 18.61",
        sanskrit: "ईश्वरः सर्वभूतानां हृद्देशेऽर्जुन तिष्ठति",
        text: "The Supreme Lord is situated in everyone's heart, O Arjuna, and is directing the wanderings of all living entities, who are seated as on a machine, made of the material energy.",
        chapter: 18,
        verse: 61,
        mood: ["knowledge", "presence"],
        topic: "Divine Director"
    },

    // ========================================
    // STREAKS & PERSISTENCE
    // ========================================
    {
        ref: "BG 6.45",
        sanskrit: "प्रयत्नाद्यतमानस्तु योगी संशुद्धकिल्बिषः",
        text: "But when the yogi engages himself with sincere endeavor in making further progress, being washed of all contaminations, then ultimately, after many, many births of practice, he attains the supreme goal.",
        chapter: 6,
        verse: 45,
        mood: ["persistence", "streak"],
        topic: "Sincere Endeavor"
    },
    {
        ref: "BG 2.40",
        sanskrit: "नेहाभिक्रमनाशोऽस्ति प्रत्यवायो न विद्यते",
        text: "In this endeavor there is no loss or diminution, and a little advancement on this path can protect one from the most dangerous type of fear.",
        chapter: 2,
        verse: 40,
        mood: ["encouragement", "streak"],
        topic: "No Loss"
    },
    {
        ref: "BG 6.43",
        sanskrit: "तत्र तं बुद्धिसंयोगं लभते पौर्वदेहिकम्",
        text: "On taking such a birth, he again revives the divine consciousness of his previous life, and he tries to make further progress in order to achieve complete success.",
        chapter: 6,
        verse: 43,
        mood: ["encouragement", "continuity"],
        topic: "Progress Continues"
    },

    // ========================================
    // ACHIEVEMENT & MILESTONES
    // ========================================
    {
        ref: "BG 8.28",
        sanskrit: "वेदेषु यज्ञेषु तपःसु चैव",
        text: "A person who accepts the path of devotional service is not bereft of the results derived from studying the Vedas, performing austere sacrifices, giving charity or pursuing philosophical and fruitive activities. At the end he reaches the supreme abode.",
        chapter: 8,
        verse: 28,
        mood: ["achievement", "milestone"],
        topic: "Supreme Reward"
    },
    {
        ref: "BG 5.25",
        sanskrit: "लभन्ते ब्रह्मनिर्वाणमृषयः क्षीणकल्मषाः",
        text: "One who is beyond duality and doubt, whose mind is engaged within, who is always busy working for the welfare of all sentient beings, and who is free from all sins, achieves liberation in the Supreme.",
        chapter: 5,
        verse: 25,
        mood: ["achievement", "liberation"],
        topic: "Liberation Achieved"
    },
    {
        ref: "BG 18.71",
        sanskrit: "श्रद्धावाननसूयश्च शृणुयादपि यो नरः",
        text: "And one who listens with faith and without envy becomes free from sinful reaction and attains to the planets where the pious dwell.",
        chapter: 18,
        verse: 71,
        mood: ["achievement", "faith"],
        topic: "Power of Listening"
    },

    // ========================================
    // FOOD & OFFERING
    // ========================================
    {
        ref: "BG 3.13",
        sanskrit: "यज्ञशिष्टाशिनः सन्तो मुच्यन्ते सर्वकिल्बिषैः",
        text: "The devotees of the Lord are released from all kinds of sins because they eat food which is offered first for sacrifice. Others, who prepare food for personal sense enjoyment, verily eat only sin.",
        chapter: 3,
        verse: 13,
        mood: ["offering", "food"],
        topic: "Sacred Food"
    },
    {
        ref: "BG 9.27",
        sanskrit: "यत्करोषि यदश्नासि यज्जुहोषि ददासि यत्",
        text: "O son of Kunti, all that you do, all that you eat, all that you offer and give away, as well as all austerities that you may perform, should be done as an offering unto Me.",
        chapter: 9,
        verse: 27,
        mood: ["offering", "devotion"],
        topic: "Everything as Offering"
    }
];

// ========================================
// Utility Functions
// ========================================

/**
 * Get random verse by mood/context
 */
function getRandomVerse(mood = null) {
    let pool = KC_VERSES;
    
    if (mood) {
        pool = KC_VERSES.filter(v => v.mood.includes(mood));
        if (pool.length === 0) pool = KC_VERSES; // Fallback to all
    }
    
    return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Get verse by reference
 */
function getVerseByRef(ref) {
    return KC_VERSES.find(v => v.ref === ref);
}

/**
 * Get verses by chapter
 */
function getVersesByChapter(chapter) {
    return KC_VERSES.filter(v => v.chapter === chapter);
}

/**
 * Get verses by topic
 */
function getVersesByTopic(topic) {
    return KC_VERSES.filter(v => v.topic.toLowerCase().includes(topic.toLowerCase()));
}

/**
 * Get morning verse
 */
function getMorningVerse() {
    const morningMoods = ['motivation', 'morning', 'action', 'encouragement'];
    const pool = KC_VERSES.filter(v => v.mood.some(m => morningMoods.includes(m)));
    return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Get evening verse
 */
function getEveningVerse() {
    const eveningMoods = ['peace', 'evening', 'reflection', 'gratitude'];
    const pool = KC_VERSES.filter(v => v.mood.some(m => eveningMoods.includes(m)));
    return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Get streak milestone verse
 */
function getStreakVerse() {
    const pool = KC_VERSES.filter(v => v.mood.includes('streak') || v.mood.includes('persistence'));
    return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Get achievement verse
 */
function getAchievementVerse() {
    const pool = KC_VERSES.filter(v => v.mood.includes('achievement') || v.mood.includes('celebration'));
    return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Get daily verse (rotates based on date)
 */
function getDailyVerse() {
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const index = dayOfYear % KC_VERSES.length;
    return KC_VERSES[index];
}

/**
 * Format verse for display
 */
function formatVerse(verse, options = {}) {
    const {
        includeSanskrit = false,
        includeTopic = true,
        includeRef = true
    } = options;
    
    let formatted = '';
    
    if (includeSanskrit && verse.sanskrit) {
        formatted += `"${verse.sanskrit}"\n\n`;
    }
    
    formatted += `"${verse.text}"`;
    
    if (includeRef) {
        formatted += `\n\n— ${verse.ref}`;
    }
    
    if (includeTopic) {
        formatted += ` (${verse.topic})`;
    }
    
    return formatted;
}

// Export for use
if (typeof window !== 'undefined') {
    window.KC_VERSES = KC_VERSES;
    window.getRandomVerse = getRandomVerse;
    window.getVerseByRef = getVerseByRef;
    window.getVersesByChapter = getVersesByChapter;
    window.getVersesByTopic = getVersesByTopic;
    window.getMorningVerse = getMorningVerse;
    window.getEveningVerse = getEveningVerse;
    window.getStreakVerse = getStreakVerse;
    window.getAchievementVerse = getAchievementVerse;
    window.getDailyVerse = getDailyVerse;
    window.formatVerse = formatVerse;
}
