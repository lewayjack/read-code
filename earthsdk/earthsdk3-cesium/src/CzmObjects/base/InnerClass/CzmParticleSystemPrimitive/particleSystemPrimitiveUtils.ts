import * as Cesium from 'cesium';
import { toCartesian3 } from '../../../../utils';
import { ESJParticleEmitterJsonType } from "earthsdk3";

export function createParticleSystemEmitterFromJson(particleSystemJson: ESJParticleEmitterJsonType) {
    if (particleSystemJson.type === 'BoxEmitter') {
        const dimensions = particleSystemJson.dimensions
        if (dimensions) {
            return new Cesium.BoxEmitter(toCartesian3(dimensions))
        } else {
            return undefined
        }
    } else if (particleSystemJson.type === 'CircleEmitter') {
        const radius = particleSystemJson.radius
        return new Cesium.CircleEmitter(radius)

    } else if (particleSystemJson.type === 'ConeEmitter') {
        const angle = particleSystemJson.angle
        return new Cesium.ConeEmitter(angle)

    } else if (particleSystemJson.type === 'SphereEmitter') {
        const radius = particleSystemJson.radius
        return new Cesium.SphereEmitter(radius)
    }

}
