import { ESCar, ESSceneObject } from "earthsdk3";
import { CzmESObjectWithLocation, CzmModelPrimitive } from "../../../CzmObjects";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { bindNorthRotation, flyWithPrimitive } from "../../../utils";
import { bind, createNextAnimateFrameEvent, track } from "xbsj-base";

export class CzmESCar extends CzmESObjectWithLocation<ESCar> {
    static readonly type = this.register('ESCesiumViewer', ESCar.type, this);
    private _czmModelPrimitive;
    get czmModelPrimitive() { return this._czmModelPrimitive; }

    constructor(sceneObject: ESCar, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        this._czmModelPrimitive = this.disposeVar(new CzmModelPrimitive(czmViewer, sceneObject.id));
        const czmModelPrimitive = this._czmModelPrimitive;

        this.dispose(track([czmModelPrimitive, 'show'], [sceneObject, 'show']));
        this.dispose(bind([czmModelPrimitive, 'position'], [sceneObject, 'position']));
        this.dispose(bindNorthRotation([czmModelPrimitive, 'rotation'], [sceneObject, 'rotation']));
        this.dispose(bind([czmModelPrimitive, 'scale'], [sceneObject, 'scale']));
        {
            const event = this.dv(createNextAnimateFrameEvent(sceneObject.allowPickingChanged, sceneObject.editingChanged))
            const update = () => {
                if (sceneObject.allowPicking && !sceneObject.editing) {
                    czmModelPrimitive.allowPicking = true;
                } else {
                    czmModelPrimitive.allowPicking = false;
                }
            }
            update();
            this.d(event.don(update));
        }

        const policeCarUrl = ESSceneObject.context.getStrFromEnv('${earthsdk3-assets-script-dir}/assets/glb/car/PoliceCar.glb')

        const update = () => {
            const mode = sceneObject.mode;
            switch (mode) {
                case 'policeCar':
                    czmModelPrimitive.url = policeCarUrl;
                    break;
                default:
                    czmModelPrimitive.url = policeCarUrl;
                    break;
            }
        };
        this.dispose(sceneObject.modeChanged.disposableOn(() => update()));
        update();

        // this.dispose(sceneObject.smoothMoveEvent.disposableOn((Destination, Time) => {
        //     const time = Time * 1000;
        //     czmModelPrimitive.smoothMove(Destination, time);
        // }));
    }
    override flyTo(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, czmModelPrimitive } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            super.flyTo(duration, id);
            return true;
        } else {
            czmModelPrimitive && flyWithPrimitive(czmViewer, sceneObject, id, duration, czmModelPrimitive, true);
            return !!czmModelPrimitive;
        }
    }
}
