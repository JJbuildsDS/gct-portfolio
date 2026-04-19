/**
 * GCT brand constants — single source of truth for colors and copy.
 *
 * HEX CODES ARE PLACEHOLDERS. Jasraaj to confirm finals.
 * When confirmed, edit this file and ignore the TODO markers.
 */

export const BRAND = {
    name: 'Garlic Chicken Tikka',
    short: 'GCT',
    title: 'GCT — Garlic Chicken Tikka',
    tagline: 'The masala your brand needs',
    description: 'Garlic Chicken Tikka is a creative agency working with brands on content strategy, social media, and email marketing.',
    author: 'Jasraaj Puri',
}

/**
 * Palette. TODO(jasraaj): confirm exact hex codes.
 *
 * Defaults chosen to evoke Indian spice/tandoor:
 *  - red:   tandoor-crimson, reads as warm brand primary
 *  - white: warm off-white, avoids harsh UI glare
 *  - beige: mellow sand, secondary surface
 *
 * Extended shades are derived so game-world surfaces (billboards, UI panels,
 * lighting tints) have enough range without introducing new brand colors.
 */
export const COLORS = {
    red: '#C8252C',
    white: '#FAF7F2',
    beige: '#E8D9B8',

    redDark: '#8E1A20',
    redBright: '#E84A52',
    beigeDark: '#B8A680',
    beigeLight: '#F2E9D0',
}

export const COPY = {
    welcomeTitle: 'Welcome to GCT',
    welcomeBody: 'Garlic Chicken Tikka is a creative agency working with brands on content strategy, social media, and email marketing. We are the masala your brand needs.',
    welcomeCta: 'Drive the chicken around to explore our work.',
    signoff: '— GCT',
}

export const CREDITS = {
    intro: `This portfolio is a fork of Bruno Simon's open-source folio-2025 (MIT license). Enormous thanks to Bruno for sharing the codebase and making it possible for us to build on his work.`,
    items: [
        {
            label: 'Original codebase and 3D world',
            name: 'Bruno Simon',
            links: [
                { text: 'bruno-simon.com', url: 'https://bruno-simon.com' },
                { text: 'GitHub', url: 'https://github.com/brunosimon/folio-2025' },
            ],
        },
        {
            label: 'Music',
            name: 'Kounine (CC0)',
            links: [
                { text: 'Linktree', url: 'https://linktr.ee/Kounine' },
            ],
        },
        {
            label: 'Chicken model',
            name: 'jeremy on Poly Pizza (CC-BY 4.0)',
            links: [
                { text: 'source', url: 'https://poly.pizza/m/1YE8U35HXsI' },
            ],
        },
        {
            label: 'Three.js',
            name: 'mr.doob and contributors',
            links: [
                { text: 'threejs.org', url: 'https://threejs.org' },
            ],
        },
    ],
    outro: 'GCT reskin by Jasraaj Puri.',
}
