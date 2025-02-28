import * as Cesium from 'cesium';

export type CzmModelCoefficientsTypeN3 = [number, number, number];
export type CzmModelCoefficientsType = [
    CzmModelCoefficientsTypeN3,
    CzmModelCoefficientsTypeN3,
    CzmModelCoefficientsTypeN3,
    CzmModelCoefficientsTypeN3,
    CzmModelCoefficientsTypeN3,
    CzmModelCoefficientsTypeN3,
    CzmModelCoefficientsTypeN3,
    CzmModelCoefficientsTypeN3,
    CzmModelCoefficientsTypeN3,
];

export function toCoefficients(value: CzmModelCoefficientsType) {
    if (!Array.isArray(value) || value.length !== 9) {
        console.warn(`toCoefficients error.`);
        return undefined;
    }
    const L00 = new Cesium.Cartesian3(...value[0]);
    const L1_1 = new Cesium.Cartesian3(...value[1]);
    const L10 = new Cesium.Cartesian3(...value[2]);
    const L11 = new Cesium.Cartesian3(...value[3]);
    const L2_2 = new Cesium.Cartesian3(...value[4]);
    const L2_1 = new Cesium.Cartesian3(...value[5]);
    const L20 = new Cesium.Cartesian3(...value[6]);
    const L21 = new Cesium.Cartesian3(...value[7]);
    const L22 = new Cesium.Cartesian3(...value[8]);
    const coefficients = [L00, L1_1, L10, L11, L2_2, L2_1, L20, L21, L22];
    return coefficients;
}