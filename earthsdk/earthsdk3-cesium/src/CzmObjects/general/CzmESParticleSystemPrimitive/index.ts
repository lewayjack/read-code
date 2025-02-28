import { ESParticleSystemPrimitive } from "earthsdk3";
import { CzmESObjectWithLocation, CzmParticleSystemPrimitive } from "../../../CzmObjects";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { bindNorthRotation, defaultFlyToRotation, flyTo } from "../../../utils";
import { bind, track } from "xbsj-base";

export class CzmESParticleSystemPrimitive extends CzmESObjectWithLocation<ESParticleSystemPrimitive> {
    static readonly type = this.register("ESCesiumViewer", ESParticleSystemPrimitive.type, this);
    private _czmESParticleSystemPrimitive;
    get czmESParticleSystemPrimitive() { return this._czmESParticleSystemPrimitive; }

    constructor(sceneObject: ESParticleSystemPrimitive, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        this._czmESParticleSystemPrimitive = this.disposeVar(new CzmParticleSystemPrimitive(czmViewer, sceneObject.id));
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        const czmESParticleSystemPrimitive = this._czmESParticleSystemPrimitive;
        this.dispose(track([czmESParticleSystemPrimitive, 'show'], [sceneObject, 'show']));
        this.dispose(track([czmESParticleSystemPrimitive, 'updateCallback'], [sceneObject, 'updateCallback']));
        this.dispose(track([czmESParticleSystemPrimitive, 'emissionRate'], [sceneObject, 'emissionRate']));
        this.dispose(track([czmESParticleSystemPrimitive, 'loop'], [sceneObject, 'loop']));
        this.dispose(track([czmESParticleSystemPrimitive, 'scale'], [sceneObject, 'particleScale']));
        this.dispose(track([czmESParticleSystemPrimitive, 'startScale'], [sceneObject, 'startScale']));
        this.dispose(track([czmESParticleSystemPrimitive, 'endScale'], [sceneObject, 'endScale']));
        this.dispose(track([czmESParticleSystemPrimitive, 'color'], [sceneObject, 'color']));
        this.dispose(track([czmESParticleSystemPrimitive, 'startColor'], [sceneObject, 'startColor']));
        this.dispose(track([czmESParticleSystemPrimitive, 'endColor'], [sceneObject, 'endColor']));
        this.dispose(track([czmESParticleSystemPrimitive, 'sizeInMeters'], [sceneObject, 'sizeInMeters']));
        this.dispose(track([czmESParticleSystemPrimitive, 'speed'], [sceneObject, 'speed']));
        this.dispose(track([czmESParticleSystemPrimitive, 'minimumSpeed'], [sceneObject, 'minimumSpeed']));
        this.dispose(track([czmESParticleSystemPrimitive, 'maximumSpeed'], [sceneObject, 'maximumSpeed']));
        this.dispose(track([czmESParticleSystemPrimitive, 'lifetime'], [sceneObject, 'lifetime']));
        this.dispose(track([czmESParticleSystemPrimitive, 'particleLife'], [sceneObject, 'particleLife']));
        this.dispose(track([czmESParticleSystemPrimitive, 'minimumParticleLife'], [sceneObject, 'minimumParticleLife']));
        this.dispose(track([czmESParticleSystemPrimitive, 'maximumParticleLife'], [sceneObject, 'maximumParticleLife']));
        this.dispose(track([czmESParticleSystemPrimitive, 'mass'], [sceneObject, 'mass']));
        this.dispose(track([czmESParticleSystemPrimitive, 'minimumMass'], [sceneObject, 'minimumMass']));
        this.dispose(track([czmESParticleSystemPrimitive, 'maximumMass'], [sceneObject, 'maximumMass']));
        this.dispose(track([czmESParticleSystemPrimitive, 'imageSize'], [sceneObject, 'imageSize']));
        this.dispose(track([czmESParticleSystemPrimitive, 'minimumImageSize'], [sceneObject, 'minimumImageSize']));
        this.dispose(track([czmESParticleSystemPrimitive, 'maximumImageSize'], [sceneObject, 'maximumImageSize']));
        this.dispose(track([czmESParticleSystemPrimitive, 'image'], [sceneObject, 'image']));
        this.dispose(bind([czmESParticleSystemPrimitive, 'position'], [sceneObject, 'position']));
        this.dispose(bind([czmESParticleSystemPrimitive, 'translation'], [sceneObject, 'translation']));
        this.dispose(bindNorthRotation([czmESParticleSystemPrimitive, 'rotation'], [sceneObject, 'rotation']));
        this.dispose(track([czmESParticleSystemPrimitive, 'bursts'], [sceneObject, 'bursts']));
        this.dispose(track([czmESParticleSystemPrimitive, 'emitter'], [sceneObject, 'emitter']));

        this.dispose(track([czmESParticleSystemPrimitive, 'ratio'], [sceneObject, 'ratio']));
        this.dispose(track([czmESParticleSystemPrimitive, 'playingLoop'], [sceneObject, 'playingLoop']));
        this.dispose(track([czmESParticleSystemPrimitive, 'currentTime'], [sceneObject, 'currentTime']));
        this.dispose(track([czmESParticleSystemPrimitive, 'duration'], [sceneObject, 'duration']));
        this.dispose(track([czmESParticleSystemPrimitive, 'playing'], [sceneObject, 'playing']));
        this.dispose(track([czmESParticleSystemPrimitive, 'playingSpeed'], [sceneObject, 'playingSpeed']));
    }
    override flyTo(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, czmESParticleSystemPrimitive } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            return super.flyTo(duration, id);
        } else {
            const position = czmESParticleSystemPrimitive.position as [number, number, number];
            flyTo(czmViewer.viewer, position, 100, defaultFlyToRotation, duration);
            sceneObject.flyOverEvent.emit(id, 'over', czmViewer);
            return true;
        }
    }
}
