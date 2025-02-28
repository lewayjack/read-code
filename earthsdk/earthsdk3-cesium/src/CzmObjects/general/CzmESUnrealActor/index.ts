import { ESUnrealActor } from "earthsdk3";
import { CzmESObjectWithLocation, CzmPoint } from "../../../CzmObjects";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { bind, track } from "xbsj-base";

export class CzmESUnrealActor extends CzmESObjectWithLocation<ESUnrealActor> {
    static readonly type = this.register("ESCesiumViewer", ESUnrealActor.type, this);
    private _czmGeoPoint
    get czmGeoPoint() { return this._czmGeoPoint; }

    constructor(sceneObject: ESUnrealActor, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        this._czmGeoPoint = this.disposeVar(new CzmPoint(czmViewer, sceneObject.id));
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        const czmGeoPoint = this._czmGeoPoint;
        this.dispose(track([czmGeoPoint, 'show'], [sceneObject, 'show']));
        this.dispose(bind([czmGeoPoint, 'position'], [sceneObject, 'position']));
    }
    override flyTo(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, czmGeoPoint } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            return super.flyTo(duration, id);
        } else {
            czmGeoPoint.flyTo(duration);
            sceneObject.flyOverEvent.emit(id, 'over', czmViewer);
            return true;
        }
    }
}
