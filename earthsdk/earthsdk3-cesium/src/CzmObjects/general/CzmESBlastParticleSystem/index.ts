import { ESBlastParticleSystem } from "earthsdk3";
import { CzmESObjectWithLocation, CzmParticleSystemPrimitive } from "../../../CzmObjects";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { bindNorthRotation, defaultFlyToRotation, flyTo } from "../../../utils";
import { bind, track } from "xbsj-base";

export class CzmESBlastParticleSystem extends CzmESObjectWithLocation<ESBlastParticleSystem> {
    static readonly type = this.register("ESCesiumViewer", ESBlastParticleSystem.type, this);
    private _czmBlastParticeSystem;
    get czmBlastParticeSystem() { return this._czmBlastParticeSystem; }

    constructor(sceneObject: ESBlastParticleSystem, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        this._czmBlastParticeSystem = this.disposeVar(new CzmParticleSystemPrimitive(czmViewer,sceneObject.id));
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }

        const { czmBlastParticeSystem } = this;
        {
            czmBlastParticeSystem.startColor = [
                0.9686274509803922,
                0.8745098039215686,
                0.027450980392156862,
                0.6
            ];
            czmBlastParticeSystem.endColor = [
                0.011764705882352941,
                0,
                0,
                0.98
            ];
            czmBlastParticeSystem.startScale = 3;
            czmBlastParticeSystem.endScale = 5;
            czmBlastParticeSystem.minimumParticleLife = 0;
            czmBlastParticeSystem.maximumParticleLife = 1;
            czmBlastParticeSystem.minimumSpeed = 0;
            czmBlastParticeSystem.maximumSpeed = 3;
            czmBlastParticeSystem.emissionRate = 20;
            czmBlastParticeSystem.lifetime = 5;
            czmBlastParticeSystem.imageSize = [2, 2];
            czmBlastParticeSystem.emitter = {
                "type": "CircleEmitter",
                "radius": 1
            };
            czmBlastParticeSystem.sizeInMeters = true
        }
        this.dispose(track([czmBlastParticeSystem, 'show'], [sceneObject, 'show']));
        this.dispose(bind([czmBlastParticeSystem, 'position'], [sceneObject, 'position']));
        this.dispose(track([czmBlastParticeSystem, 'translation'], [sceneObject, 'translation']));
        this.dispose(bindNorthRotation([czmBlastParticeSystem, 'rotation'], [sceneObject, 'rotation']));
        this.dispose(track([czmBlastParticeSystem, 'image'], [sceneObject, 'image']));
    }
    override flyTo(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, czmBlastParticeSystem } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            return super.flyTo(duration, id);
        } else {
            const position = czmBlastParticeSystem.position as [number, number, number];
            flyTo(czmViewer.viewer, position, 100, defaultFlyToRotation, duration);
            sceneObject.flyOverEvent.emit(id, 'over', czmViewer);
            return true;
        }
    }
}
