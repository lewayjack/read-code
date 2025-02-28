import * as Cesium from 'cesium';
import { ESSceneObject } from "earthsdk3";
import { CzmImageBasedLightingJsonType } from '../../../../ESJTypesCzm';

export function getImageBasedLighting(jsonValue: CzmImageBasedLightingJsonType) {
    const {
        imageBasedLightingFactor: f,
        luminanceAtZenith: z,
        sphericalHarmonicCoefficients: c,
        specularEnvironmentMaps: m,
    } = jsonValue;

    const options = {
        imageBasedLightingFactor: f && new Cesium.Cartesian2(f[0], f[1]),
        luminanceAtZenith: z,
        sphericalHarmonicCoefficients: c && c.map(e => new Cesium.Cartesian3(e[0], e[1], e[2])),
        specularEnvironmentMaps: m && ESSceneObject.context.getStrFromEnv(m),
    };

    // @ts-ignore
    return new Cesium.ImageBasedLighting(options);
}
