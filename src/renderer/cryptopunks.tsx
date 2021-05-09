


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

const getTraitName = (trait: string) => {
    return `Ape${trait}`
}

export const getTraitUrl = (trait: string) => {
    // const traitName = getTraitName(trait);
    return `https://cryptopunk-test.s3.ap-northeast-2.amazonaws.com/Ape/${trait}.png`;
}

const sampleSet = {
    'Face': 'Face',
    'Eyeballs': 'Eyeballs',
    'EyeShadow': 'EyeShadow',
    'Neck': 'GoldChain',
    'Eyes': 'Eyes',
    'Mouth': 'Mouth'
}


export const loadCryptoPunk = (traits: CryptoPunkTraitSet, context: CanvasRenderingContext2D) => {
    const traitImageSet = {};

    // traits.keys

    // traits.forEach( trait => {
    //     const image = new Image();
    //
    // })


    /** Face **/
    const face = require(getTraitUrl(traits.Face));
    const image = new Image();


}

//
//
// "layer": [
//     "Background", "Face", "Eyeballs", "SkinEffect", "EyeShadow",
//     "Neck", "Eyes", "Mustache", "Smile", "Lip", "Beard",
//     "Earring", "Nose", "Shades", "Hair",
//     "Hat", "Mask", "EyesCover", "NoseAccessory", "Cigar"
// ],

