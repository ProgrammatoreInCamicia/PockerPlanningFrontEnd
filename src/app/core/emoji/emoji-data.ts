export interface EmojiEntry {
    char: string;
    keywords: string[];
}

export const EMOJI_SET: EmojiEntry[] = [
    { char: '🐒', keywords: ['scimmia', 'monkey'] },
    { char: '🍌', keywords: ['banana'] },
    { char: '💩', keywords: ['cacca', 'poop', 'merda'] },
    { char: '🔥', keywords: ['fuoco', 'fire', 'top'] },
    { char: '🎉', keywords: ['festa', 'party', 'coriandoli'] },
    { char: '👏', keywords: ['applauso', 'clap', 'bravo'] },
    { char: '😂', keywords: ['risata', 'laugh', 'lol'] },
    { char: '😭', keywords: ['pianto', 'cry', 'disperato'] },
    { char: '🤔', keywords: ['pensare', 'think', 'dubbio'] },
    { char: '🍕', keywords: ['pizza'] },
    { char: '🍺', keywords: ['birra', 'beer'] },
    { char: '☕', keywords: ['caffe', 'coffee'] },
    { char: '💣', keywords: ['bomba', 'bomb', 'esplosivo'] },
    { char: '🚀', keywords: ['razzo', 'rocket', 'veloce'] },
    { char: '🐢', keywords: ['tartaruga', 'turtle', 'lento'] },
    { char: '👻', keywords: ['fantasma', 'ghost', 'paura'] },
    { char: '🤡', keywords: ['pagliaccio', 'clown'] },
    { char: '💀', keywords: ['teschio', 'skull', 'morto'] },
    { char: '😴', keywords: ['sonno', 'sleep', 'noia'] },
    { char: '🤯', keywords: ['esplosione', 'mindblown', 'wow'] },
    { char: '🍆', keywords: ['melanzana', 'eggplant'] },
    { char: '🐸', keywords: ['rana', 'frog'] },
    { char: '🦄', keywords: ['unicorno', 'unicorn'] },
    { char: '🎯', keywords: ['bersaglio', 'target', 'preciso'] },
    { char: '💎', keywords: ['diamante', 'diamond'] },
    { char: '🧠', keywords: ['cervello', 'brain', 'genio'] },
    { char: '🐌', keywords: ['lumaca', 'snail', 'lentissimo'] },
    { char: '🦆', keywords: ['papero', 'duck', 'anatra'] },
    { char: '🍿', keywords: ['popcorn'] },
    { char: '🎪', keywords: ['circo', 'circus'] },
    { char: '🥳', keywords: ['festa', 'party', 'celebrare'] },
    { char: '😬', keywords: ['imbarazzo', 'cringe', 'grimace'] },
    { char: '🐷', keywords: ['maiale', 'pig'] },
    { char: '🌮', keywords: ['taco'] },
    { char: '⚡', keywords: ['fulmine', 'lightning', 'veloce'] },
    { char: '🎃', keywords: ['zucca', 'pumpkin', 'halloween'] },
    { char: '🦖', keywords: ['dinosauro', 'dino', 'trex'] },
    { char: '🧟', keywords: ['zombie'] },
    { char: '🐙', keywords: ['polpo', 'octopus'] },
    { char: '🍔', keywords: ['hamburger', 'burger'] },
    { char: '🐔', keywords: ['pollo', 'chicken', 'coniglio'] },
];

export function searchEmoji(query: string): EmojiEntry[] {
    const q = query.trim().toLowerCase();
    if (!q) return EMOJI_SET;
    return EMOJI_SET.filter(
        (e) => e.keywords.some((k) => k.includes(q))
    );
}
