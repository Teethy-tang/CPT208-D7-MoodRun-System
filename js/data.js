export const moodPlans = {
    stressed: {
        name: 'STRESS RELIEF RUN',
        desc: 'High intensity to burn off pressure',
        time: '30MIN',
        dist: '5KM',
        intensity: 'HIGH',
        targetDistance: 5,
        paceRange: [4.3, 5.4],
        demoDuration: 24
    },
    anxious: {
        name: 'CALM PACE RUN',
        desc: 'Steady rhythm to calm your mind',
        time: '25MIN',
        dist: '4KM',
        intensity: 'MED',
        targetDistance: 4,
        paceRange: [5.8, 6.8],
        demoDuration: 25
    },
    tired: {
        name: 'ENERGY BOOST RUN',
        desc: 'Short burst to wake up gently',
        time: '15MIN',
        dist: '2KM',
        intensity: 'LOW',
        targetDistance: 2,
        paceRange: [6.4, 7.4],
        demoDuration: 18
    },
    angry: {
        name: 'RAGE RELEASE SPRINT',
        desc: 'Turn heat into controlled speed',
        time: '20MIN',
        dist: '3KM',
        intensity: 'MAX',
        targetDistance: 3,
        paceRange: [3.9, 5.0],
        demoDuration: 20
    },
    sad: {
        name: 'MOOD LIFTER JOG',
        desc: 'Gentle pace with a softer route',
        time: '35MIN',
        dist: '4KM',
        intensity: 'LOW',
        targetDistance: 4,
        paceRange: [6.5, 7.5],
        demoDuration: 26
    },
    bored: {
        name: 'ADVENTURE RUN',
        desc: 'Varied pace to keep it interesting',
        time: '30MIN',
        dist: '5KM',
        intensity: 'MED',
        targetDistance: 5,
        paceRange: [5.0, 6.6],
        demoDuration: 24
    },
    excited: {
        name: 'SPEED CHALLENGE',
        desc: 'Focus the extra energy',
        time: '25MIN',
        dist: '5KM',
        intensity: 'HIGH',
        targetDistance: 5,
        paceRange: [4.1, 5.2],
        demoDuration: 22
    },
    happy: {
        name: 'JOY RUN',
        desc: 'Enjoy every step of the loop',
        time: '30MIN',
        dist: '5KM',
        intensity: 'MED',
        targetDistance: 5,
        paceRange: [5.2, 6.3],
        demoDuration: 24
    },
    neutral: {
        name: 'BALANCED RUN',
        desc: 'Standard aerobic training',
        time: '30MIN',
        dist: '5KM',
        intensity: 'MED',
        targetDistance: 5,
        paceRange: [5.4, 6.5],
        demoDuration: 24
    }
};

export const runPlanOptions = {
    sprint: {
        name: 'SPRINT RUN',
        desc: 'High intensity burst training',
        time: '20MIN',
        dist: '3KM',
        intensity: 'HIGH',
        targetDistance: 3,
        paceRange: [3.9, 5.1],
        demoDuration: 19
    },
    aerobic: {
        name: 'AEROBIC RUN',
        desc: 'Steady pace for cardio health',
        time: '30MIN',
        dist: '5KM',
        intensity: 'MED',
        targetDistance: 5,
        paceRange: [5.4, 6.6],
        demoDuration: 25
    },
    scenic: {
        name: 'SCENIC JOG',
        desc: 'Relaxed pace to enjoy the view',
        time: '35MIN',
        dist: '4KM',
        intensity: 'LOW',
        targetDistance: 4,
        paceRange: [6.4, 7.5],
        demoDuration: 27
    }
};

export const celebrations = {
    200: '200M! NICE START!',
    500: '500M! KEEP GOING!',
    1000: '1KM! AMAZING!',
    2000: '2KM! HALFWAY!',
    3000: '3KM! SO STRONG!',
    5000: '5KM! ALMOST THERE!'
};

export const moodCheckpoints = {
    stressed: [
        { progress: 25, text: 'PRESSURE IS MOVING OUT.' },
        { progress: 55, text: 'SHAKE YOUR SHOULDERS LOOSE.' },
        { progress: 82, text: 'YOU ARE LIGHTER THAN BEFORE.' }
    ],
    anxious: [
        { progress: 25, text: 'MATCH BREATH TO FOOTSTEPS.' },
        { progress: 55, text: 'ONE STEP, ONE SMALLER WORRY.' },
        { progress: 82, text: 'THE RHYTHM IS HOLDING YOU.' }
    ],
    tired: [
        { progress: 25, text: 'WAKE UP SLOWLY.' },
        { progress: 55, text: 'ENERGY IS COMING ONLINE.' },
        { progress: 82, text: 'SMALL RUN, REAL WIN.' }
    ],
    angry: [
        { progress: 25, text: 'TURN HEAT INTO SPEED.' },
        { progress: 55, text: 'CONTROL THE FIRE.' },
        { progress: 82, text: 'CLEAR HEAD, STRONG LEGS.' }
    ],
    sad: [
        { progress: 25, text: 'GENTLE STEPS STILL COUNT.' },
        { progress: 55, text: 'LET THE ROAD CARRY A LITTLE.' },
        { progress: 82, text: 'YOU STAYED WITH YOURSELF.' }
    ],
    bored: [
        { progress: 25, text: 'NEW ROUTE UNLOCKED.' },
        { progress: 55, text: 'CHANGE THE PATTERN.' },
        { progress: 82, text: 'ADVENTURE MODE IS WORKING.' }
    ],
    excited: [
        { progress: 25, text: 'FOCUS THE SPARK.' },
        { progress: 55, text: 'FAST, BUT STILL SMOOTH.' },
        { progress: 82, text: 'ENERGY WITH DIRECTION.' }
    ],
    happy: [
        { progress: 25, text: 'JOY HAS A RHYTHM.' },
        { progress: 55, text: 'KEEP THE GOOD MOMENT MOVING.' },
        { progress: 82, text: 'SAVE THIS FEELING.' }
    ],
    neutral: [
        { progress: 25, text: 'STEADY START.' },
        { progress: 55, text: 'BALANCE IS BUILDING.' },
        { progress: 82, text: 'FINISH THE LOOP.' }
    ]
};

export const moodOutcomes = {
    stressed: { after: 'LIGHTER', insight: 'You turned pressure into motion.' },
    anxious: { after: 'STEADIER', insight: 'You gave the worry a rhythm to follow.' },
    tired: { after: 'AWAKE', insight: 'A short push brought energy back online.' },
    angry: { after: 'CLEAR', insight: 'You spent the heat without letting it steer.' },
    sad: { after: 'HELD', insight: 'You moved gently and stayed with yourself.' },
    bored: { after: 'CURIOUS', insight: 'Changing pace made the route feel new.' },
    excited: { after: 'FOCUSED', insight: 'You turned extra energy into direction.' },
    happy: { after: 'BRIGHTER', insight: 'You carried the good mood forward.' },
    neutral: { after: 'BALANCED', insight: 'A steady run gave the day a shape.' }
};

export const calorieAnalogies = [
    { cal: 150, text: 'You earned an ice cream! Enjoy!' },
    { cal: 300, text: 'That\'s a pizza slice burned!' },
    { cal: 450, text: 'You crushed a burger!' },
    { cal: 600, text: 'Full meal conquered!' }
];

export const wisdomQuotes = {
    stressed: [
        'You do not have to carry every thought at full volume.',
        'Movement can make room where pressure used to sit.'
    ],
    anxious: [
        'A calm pace is still progress.',
        'Follow the next step, not the whole storm.'
    ],
    tired: [
        'Small energy is still energy.',
        'Starting gently is a valid kind of strength.'
    ],
    angry: [
        'Power becomes useful when it has direction.',
        'Let the heat leave without burning the room.'
    ],
    sad: [
        'A soft step can be a brave step.',
        'You do not need to feel bright to keep moving.'
    ],
    bored: [
        'Novelty often starts with changing one small path.',
        'Curiosity is momentum in disguise.'
    ],
    excited: [
        'Energy gets stronger when it learns focus.',
        'Keep the spark, choose the line.'
    ],
    happy: [
        'Joy grows when you give it a route.',
        'Good days deserve to be remembered too.'
    ],
    neutral: [
        'Balance is built in ordinary minutes.',
        'A steady step can reset the whole day.'
    ]
};

export const paceDescriptions = {
    fast: 'Fast pace: Under 5:00 min/km - High intensity, electronic music',
    mixed: 'Mixed pace: 5:00-6:30 min/km - Moderate, pop music',
    slow: 'Slow pace: Over 6:30 min/km - Relaxed, ambient sounds'
};
