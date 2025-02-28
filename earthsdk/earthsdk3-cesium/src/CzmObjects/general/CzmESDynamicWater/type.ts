import { ESJColor } from "earthsdk3";

export type WaterAttribute = {
    waterColor?: ESJColor,
    frequency?: number,
    waveVelocity?: number,
    amplitude?: number,
    specularIntensity?: number,
    flowDirection?: number,
    flowSpeed?: number,
}

export const waterType = {
    river: {
        // 颜色提高亮度
        waterColor: [95 / 255, 115 / 255, 70 / 255, 1],
        frequency: 800,
        waveVelocity: 0.6,
        amplitude: 0.1,
        specularIntensity: 0.8,
        flowDirection: 0,
        flowSpeed: 0
    },
    ocean: {
        // 颜色提高亮度
        waterColor: [12 / 255, 30 / 255, 69 / 255, 1],
        frequency: 360,
        waveVelocity: 0.8,
        amplitude: 0.5,
        specularIntensity: 0.8,
        flowDirection: 0,
        flowSpeed: 0
    },
    lake: {
        // 颜色提高亮度
        waterColor: [32 / 255, 84 / 255, 105 / 255, 1],
        frequency: 200,
        waveVelocity: 0.4,
        amplitude: 0.01,
        specularIntensity: 0.8,
        flowDirection: 0,
        flowSpeed: 0
    },
} as {
    [xx: string]: WaterAttribute
}
