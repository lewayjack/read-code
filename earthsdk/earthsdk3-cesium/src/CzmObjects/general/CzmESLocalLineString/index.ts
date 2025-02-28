import { getDistancesFromPositions } from "earthsdk3";
import { CzmESObjectWithLocation } from "../../../CzmObjects";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { ESLocalLineString, ESLocalLineStringZ } from "../../../ESObjects";
import { createNextAnimateFrameEvent, track } from "xbsj-base";
import { getCameraPosition } from "@czmSrc/utils";

export class CzmESLocalLineString extends CzmESObjectWithLocation<ESLocalLineString> {
    static readonly type = this.register("ESCesiumViewer", ESLocalLineString.type, this);
    private _czmESLocalLineStringZ;
    get czmESLocalLineStringZ() { return this._czmESLocalLineStringZ; }

    constructor(sceneObject: ESLocalLineString, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        this._czmESLocalLineStringZ = this.disposeVar(new ESLocalLineStringZ(sceneObject.id));
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        const czmESLocalLineStringZ = this._czmESLocalLineStringZ;
        czmViewer.add(czmESLocalLineStringZ);
        this.dispose(() => czmViewer.delete(czmESLocalLineStringZ));

        {
            this.dispose(track([czmESLocalLineStringZ, 'strokeWidth'], [sceneObject, 'strokeWidth']));
            this.dispose(track([czmESLocalLineStringZ, 'strokeColor'], [sceneObject, 'strokeColor']));
            const update = () => {
                czmESLocalLineStringZ.show = sceneObject.show && sceneObject.stroked;
            }
            update()
            const event = this.dv(createNextAnimateFrameEvent(sceneObject.showChanged, sceneObject.strokedChanged));
            this.dispose(event.don(update));
        }
        {
            this.dispose(track([czmESLocalLineStringZ, 'loop'], [sceneObject, 'loop']));
            this.dispose(track([czmESLocalLineStringZ, 'hasDash'], [sceneObject, 'hasDash']));
            this.dispose(track([czmESLocalLineStringZ, 'gapColor'], [sceneObject, 'gapColor']));
            this.dispose(track([czmESLocalLineStringZ, 'dashLength'], [sceneObject, 'dashLength']));
            this.dispose(track([czmESLocalLineStringZ, 'dashPattern'], [sceneObject, 'dashPattern']));
            this.dispose(track([czmESLocalLineStringZ, 'hasArrow'], [sceneObject, 'hasArrow']));
            this.dispose(track([czmESLocalLineStringZ, 'depthTest'], [sceneObject, 'depthTest']));
            this.dispose(track([czmESLocalLineStringZ, 'allowPicking'], [sceneObject, 'allowPicking']));
            this.dispose(track([czmESLocalLineStringZ, 'position'], [sceneObject, 'position']));
            this.dispose(track([czmESLocalLineStringZ, 'rotation'], [sceneObject, 'rotation']));
            this.dispose(track([czmESLocalLineStringZ, 'strokeGround'], [sceneObject, 'strokeGround']));
        }
        {
            const update = () => {
                if (!sceneObject.points) {
                    czmESLocalLineStringZ.points = undefined;
                    return;
                }
                czmESLocalLineStringZ.points = sceneObject.points.map(e => [e[0], e[1], 0])
            };
            update();
            this.dispose(sceneObject.pointsChanged.disposableOn(update));
        }
    }
    override visibleDistance(sceneObject: ESLocalLineString, czmViewer: ESCesiumViewer): void {
        if (czmViewer.viewer?.camera && sceneObject.show) {
            const dis = getDistancesFromPositions([sceneObject.position, getCameraPosition(czmViewer.viewer.camera)], 'NONE')[0];
            let show = false;
            if (sceneObject.minVisibleDistance < sceneObject.maxVisibleDistance) {
                show = sceneObject.minVisibleDistance < dis && dis < sceneObject.maxVisibleDistance;
            } else if (sceneObject.maxVisibleDistance == 0) {
                show = dis > sceneObject.minVisibleDistance;
            }
            this._czmESLocalLineStringZ.show = sceneObject.show && sceneObject.stroked && show;
        }
    }
    override flyTo(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, czmESLocalLineStringZ } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            return super.flyTo(duration, id);
        } else {
            if (czmESLocalLineStringZ.points) {
                czmESLocalLineStringZ.flyTo(duration);
                return true;
            }
            return true;
        }
    }
}
