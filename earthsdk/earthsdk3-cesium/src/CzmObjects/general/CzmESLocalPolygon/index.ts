import { ESLocalPolygon, ESLocalPolygonZ } from "earthsdk3";
import { CzmESLocalVector } from "../../../CzmObjects";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { bind, track } from "xbsj-base";

export class CzmESLocalPolygon<T extends ESLocalPolygon = ESLocalPolygon> extends CzmESLocalVector<T> {
    static readonly type = this.register<ESLocalPolygon, ESCesiumViewer>("ESCesiumViewer", ESLocalPolygon.type, this);
    private _czmESLocalPolygon;
    get czmESLocalPolygon() { return this._czmESLocalPolygon; }

    constructor(sceneObject: T, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        this._czmESLocalPolygon = this.disposeVar(new ESLocalPolygonZ(sceneObject.id));
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        const czmESLocalPolygon = this._czmESLocalPolygon;

        czmViewer.add(czmESLocalPolygon);
        this.dispose(() => czmViewer.delete(czmESLocalPolygon));

        {
            this.dispose(track([czmESLocalPolygon, 'stroked'], [sceneObject, 'stroked']));
            this.dispose(track([czmESLocalPolygon, 'strokeColor'], [sceneObject, 'strokeColor']));
            this.dispose(track([czmESLocalPolygon, 'strokeWidth'], [sceneObject, 'strokeWidth']));
            this.dispose(track([czmESLocalPolygon, 'fillColor'], [sceneObject, 'fillColor']));
            this.dispose(track([czmESLocalPolygon, 'filled'], [sceneObject, 'filled']));
            this.dispose(track([czmESLocalPolygon, 'strokeGround'], [sceneObject, 'strokeGround']));
            this.dispose(track([czmESLocalPolygon, 'fillGround'], [sceneObject, 'fillGround']));
            this.dispose(track([czmESLocalPolygon, 'show'], [sceneObject, 'show']));
            this.dispose(track([czmESLocalPolygon, 'allowPicking'], [sceneObject, 'allowPicking']));
            this.dispose(bind([czmESLocalPolygon, 'editing'], [sceneObject, 'editing']));
        }

        {
            this.dispose(bind([czmESLocalPolygon, 'position'], [sceneObject, 'position']));
            // 注意这里不能使用bindNorthRotation，因为eSLocalPolygon是ES对象，不是Czm或者Geo对象，
            // 只有Czm/Geo对象转到ES对象时才需要用到bindNorthRotation！
            // vtxf 20240129
            this.dispose(bind([czmESLocalPolygon, 'rotation'], [sceneObject, 'rotation']));
            this.dispose(bind([czmESLocalPolygon, 'scale'], [sceneObject, 'scale']));
        }
        {
            const update = () => {
                if (!sceneObject.points) {
                    czmESLocalPolygon.points = undefined;
                    return;
                }
                czmESLocalPolygon.points = sceneObject.points.map(e => [e[0], e[1], 0])
            };
            update();
            this.dispose(sceneObject.pointsChanged.disposableOn(update));
        }
    }
    override flyTo(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, czmESLocalPolygon } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            return super.flyTo(duration, id);
        } else {
            czmESLocalPolygon.flyTo(duration);
            sceneObject.flyOverEvent.emit(id, 'over', czmViewer);
            return true;
        }
    }
}
