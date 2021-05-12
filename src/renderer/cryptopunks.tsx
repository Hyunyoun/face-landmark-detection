


export interface CryptoPunkTraitSet {
    'Face': string,
    'Eyeballs': string,
    'SkinEffect': string | null,
    'EyeShadow': string,
    'Neck': string | null,
    'Eyes': string,
    'Mouth': string,
}

export interface CryptoPunkTraitImageSet {
    'Face': HTMLImageElement,
    'Eyeballs': HTMLImageElement,
    'SkinEffect': HTMLImageElement | null,
    'EyeShadow': HTMLImageElement,
    'Neck': HTMLImageElement | null,
    'Eyes': HTMLImageElement,
    'Mouth': HTMLImageElement,
}

const sampleSet = {
    'Face': 'Face',
    'Eyeballs': 'Eyeballs',
    'EyeShadow': 'EyeShadow',
    'Neck': 'GoldChain',
    'Eyes': 'Eyes',
    'Mouth': 'Mouth'
}


//
//
// "layer": [
//     "Background", "Face", "Eyeballs", "SkinEffect", "EyeShadow",
//     "Neck", "Eyes", "Mustache", "Smile", "Lip", "Beard",
//     "Earring", "Nose", "Shades", "Hair",
//     "Hat", "Mask", "EyesCover", "NoseAccessory", "Cigar"
// ],

