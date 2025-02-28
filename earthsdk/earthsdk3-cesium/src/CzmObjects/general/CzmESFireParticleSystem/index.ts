import { ESFireParticleSystem, ESSceneObject } from "earthsdk3";
import { CzmESObjectWithLocation, CzmParticleSystemPrimitive } from "../../../CzmObjects";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { bindNorthRotation, defaultFlyToRotation, flyTo } from "../../../utils";
import { bind, createNextAnimateFrameEvent, track } from "xbsj-base";

export class CzmESFireParticleSystem extends CzmESObjectWithLocation<ESFireParticleSystem> {
    static readonly type = this.register("ESCesiumViewer", ESFireParticleSystem.type, this);
    private _czmFireParticleSystem
    get czmFireParticleSystem() { return this._czmFireParticleSystem; }

    constructor(sceneObject: ESFireParticleSystem, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        this._czmFireParticleSystem = this.disposeVar(new CzmParticleSystemPrimitive(czmViewer, sceneObject.id));
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }

        const czmFireParticleSystem = this._czmFireParticleSystem;
        {
            czmFireParticleSystem.startColor = [1, 1, 0, 0.4];
            czmFireParticleSystem.endColor = [1, 0, 0, 0.5];
            czmFireParticleSystem.startScale = 3;
            czmFireParticleSystem.endScale = 4;
            czmFireParticleSystem.particleLife = 0.5;
            czmFireParticleSystem.minimumSpeed = 1;
            czmFireParticleSystem.maximumSpeed = 10;
            czmFireParticleSystem.emissionRate = 20;
            czmFireParticleSystem.lifetime = 10;
            czmFireParticleSystem.imageSize = [2, 2];
            czmFireParticleSystem.emitter = {
                type: 'CircleEmitter',
                radius: 0.5
            };
            czmFireParticleSystem.sizeInMeters = true
        }
        this.dispose(bind([czmFireParticleSystem, 'position'], [sceneObject, 'position']));
        this.dispose(track([czmFireParticleSystem, 'translation'], [sceneObject, 'translation']));
        this.dispose(bindNorthRotation([czmFireParticleSystem, 'rotation'], [sceneObject, 'rotation']));
        this.dispose(track([czmFireParticleSystem, 'show'], [sceneObject, 'show']));
        this.dispose(track([czmFireParticleSystem, 'image'], [sceneObject, 'image']));
    }
    override flyTo(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, czmFireParticleSystem } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            return super.flyTo(duration, id);
        } else {
            const position = czmFireParticleSystem.position as [number, number, number];
            flyTo(czmViewer.viewer, position, 100, defaultFlyToRotation, duration);
            sceneObject.flyOverEvent.emit(id, 'over', czmViewer);
            return true;
        }
    }
}
