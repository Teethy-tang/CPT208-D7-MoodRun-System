const AVATAR_KEY = 'moodrun_avatar';

export const avatarOptions = {
    body: ['round', 'block', 'wide'],
    bodyColor: ['#5b4fcf', '#79e1d6', '#f993be', '#ffeb53', '#4f7eff'],
    shadowColor: ['#f993be', '#7b5ff1', '#1b2340', '#00b9aa', '#ff8bc5'],
    eyes: ['dot', 'sleepy', 'spark'],
    antenna: ['orbs', 'horns', 'halo'],
    arms: ['tiny', 'wave', 'wings'],
    feet: ['boots', 'round', 'hover'],
    accessory: ['none', 'visor', 'star']
};

export const defaultAvatar = {
    body: 'round',
    bodyColor: '#5b4fcf',
    shadowColor: '#f993be',
    eyes: 'dot',
    antenna: 'orbs',
    arms: 'tiny',
    feet: 'round',
    accessory: 'none'
};

const optionLabels = {
    body: { round: 'ROUND', block: 'BLOCK', wide: 'WIDE' },
    bodyColor: {
        '#5b4fcf': 'VIOLET',
        '#79e1d6': 'CYAN',
        '#f993be': 'PINK',
        '#ffeb53': 'SUN',
        '#4f7eff': 'BLUE'
    },
    shadowColor: {
        '#f993be': 'PINK',
        '#7b5ff1': 'PURPLE',
        '#1b2340': 'INK',
        '#00b9aa': 'TEAL',
        '#ff8bc5': 'ROSE'
    },
    eyes: { dot: 'DOT', sleepy: 'SLEEPY', spark: 'SPARK' },
    antenna: { orbs: 'ORBS', horns: 'HORNS', halo: 'HALO' },
    arms: { tiny: 'TINY', wave: 'WAVE', wings: 'WINGS' },
    feet: { boots: 'BOOTS', round: 'ROUND', hover: 'HOVER' },
    accessory: { none: 'NONE', visor: 'VISOR', star: 'STAR' }
};

export function getAvatarLabel(key, value) {
    return optionLabels[key]?.[value] || String(value).toUpperCase();
}

export function normalizeAvatar(avatar = {}) {
    return Object.fromEntries(
        Object.entries(defaultAvatar).map(([key, fallback]) => {
            const value = avatar[key];
            return [key, avatarOptions[key]?.includes(value) ? value : fallback];
        })
    );
}

export function loadAvatar() {
    try {
        return normalizeAvatar(JSON.parse(localStorage.getItem(AVATAR_KEY) || '{}'));
    } catch (error) {
        console.warn('Could not read saved avatar.', error);
        return { ...defaultAvatar };
    }
}

export function saveAvatar(avatar) {
    localStorage.setItem(AVATAR_KEY, JSON.stringify(normalizeAvatar(avatar)));
}

export function randomAvatar() {
    return Object.fromEntries(
        Object.entries(avatarOptions).map(([key, values]) => {
            const randomIndex = Math.floor(Math.random() * values.length);
            return [key, values[randomIndex]];
        })
    );
}

export function createAvatarSvg(avatar, className = 'pixel-avatar') {
    const config = normalizeAvatar(avatar);
    const body = getBodyRects(config);
    const arms = getArmRects(config);
    const feet = getFeetRects(config);
    const antenna = getAntennaRects(config);
    const eyes = getEyeRects(config);
    const accessory = getAccessoryRects(config);

    return `
        <svg class="${className}" viewBox="0 0 48 48" role="img" aria-label="Custom pixel avatar">
            ${rects(antenna.back, config.shadowColor)}
            ${rects(arms.shadow, config.shadowColor)}
            ${rects(feet.shadow, config.shadowColor)}
            ${rects(body.shadow, config.shadowColor)}
            ${rects(arms.main, config.bodyColor)}
            ${rects(feet.main, config.bodyColor)}
            ${rects(body.main, config.bodyColor)}
            ${rects(body.light, '#ffffff', 0.28)}
            ${rects(antenna.main, config.bodyColor)}
            ${rects(antenna.tip, config.shadowColor)}
            ${rects(eyes, '#1b2340')}
            ${rects(accessory, '#ffeb53')}
        </svg>
    `;
}

function rects(items = [], fill, opacity = 1) {
    return items.map(([x, y, width, height]) => {
        const opacityAttr = opacity < 1 ? ` opacity="${opacity}"` : '';
        return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}"${opacityAttr}/>`;
    }).join('');
}

function getBodyRects({ body }) {
    if (body === 'block') {
        return {
            main: [[13, 15, 22, 22], [9, 19, 30, 14], [17, 11, 14, 4]],
            shadow: [[16, 18, 24, 22], [12, 34, 20, 5]],
            light: [[15, 17, 4, 4], [19, 13, 8, 2]]
        };
    }

    if (body === 'wide') {
        return {
            main: [[9, 18, 30, 16], [13, 14, 22, 24], [17, 11, 14, 4]],
            shadow: [[13, 22, 30, 16], [17, 36, 18, 4]],
            light: [[13, 18, 5, 4], [19, 14, 9, 2]]
        };
    }

    return {
        main: [[14, 14, 20, 24], [10, 20, 28, 14], [18, 10, 12, 5]],
        shadow: [[18, 16, 20, 24], [14, 35, 18, 5]],
        light: [[16, 16, 4, 5], [20, 12, 7, 2]]
    };
}

function getEyeRects({ eyes }) {
    if (eyes === 'sleepy') {
        return [[16, 23, 6, 2], [27, 23, 6, 2]];
    }

    if (eyes === 'spark') {
        return [[17, 20, 3, 9], [14, 23, 9, 3], [29, 20, 3, 9], [26, 23, 9, 3]];
    }

    return [[17, 21, 4, 8], [28, 21, 4, 8]];
}

function getAntennaRects({ antenna }) {
    if (antenna === 'horns') {
        return {
            back: [[12, 7, 4, 7], [32, 7, 4, 7]],
            main: [[13, 5, 4, 7], [31, 5, 4, 7]],
            tip: [[14, 3, 3, 3], [31, 3, 3, 3]]
        };
    }

    if (antenna === 'halo') {
        return {
            back: [[16, 6, 16, 3]],
            main: [[14, 4, 20, 3]],
            tip: [[18, 4, 12, 3]]
        };
    }

    return {
        back: [[14, 7, 4, 6], [31, 7, 4, 6]],
        main: [[13, 5, 4, 7], [30, 5, 4, 7]],
        tip: [[12, 3, 5, 5], [29, 3, 5, 5]]
    };
}

function getArmRects({ arms }) {
    if (arms === 'wave') {
        return {
            shadow: [[5, 19, 6, 13], [38, 15, 6, 13]],
            main: [[4, 17, 6, 13], [37, 13, 6, 13], [40, 10, 4, 5]]
        };
    }

    if (arms === 'wings') {
        return {
            shadow: [[4, 18, 9, 16], [36, 18, 9, 16]],
            main: [[3, 16, 9, 14], [36, 16, 9, 14], [6, 30, 6, 4], [36, 30, 6, 4]]
        };
    }

    return {
        shadow: [[8, 23, 5, 10], [37, 23, 5, 10]],
        main: [[6, 21, 5, 10], [36, 21, 5, 10]]
    };
}

function getFeetRects({ feet }) {
    if (feet === 'boots') {
        return {
            shadow: [[15, 38, 7, 5], [28, 38, 7, 5]],
            main: [[14, 37, 8, 5], [27, 37, 8, 5]]
        };
    }

    if (feet === 'hover') {
        return {
            shadow: [[15, 39, 18, 3]],
            main: [[17, 38, 14, 3]]
        };
    }

    return {
        shadow: [[16, 38, 6, 6], [28, 38, 6, 6]],
        main: [[15, 37, 6, 6], [27, 37, 6, 6]]
    };
}

function getAccessoryRects({ accessory }) {
    if (accessory === 'visor') {
        return [[16, 20, 17, 4], [20, 24, 9, 2]];
    }

    if (accessory === 'star') {
        return [[23, 16, 3, 9], [20, 19, 9, 3], [22, 18, 5, 5]];
    }

    return [];
}
