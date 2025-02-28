import { ESLocalPolygonZ } from "earthsdk3";
import { CzmESGeoPolygonImpl, CzmESLocalVector } from "../../../CzmObjects";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { flyWithPositions, localPositionsToPositions } from "../../../utils";
import { createNextAnimateFrameEvent, track } from "xbsj-base";

export class CzmESLocalPolygonZ extends CzmESLocalVector<ESLocalPolygonZ> {
    static readonly type = this.register("ESCesiumViewer", ESLocalPolygonZ.type, this);
    private _czmGeoPolygon;
    get czmGeoPolygon() { return this._czmGeoPolygon; }

    constructor(sceneObject: ESLocalPolygonZ, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        this._czmGeoPolygon = this.disposeVar(new CzmESGeoPolygonImpl(czmViewer, sceneObject.id));
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        const czmGeoPolygon = this._czmGeoPolygon;

        {
            this.dispose(track([czmGeoPolygon, 'show'], [sceneObject, 'show']));
            this.dispose(track([czmGeoPolygon, 'allowPicking'], [sceneObject, 'allowPicking']));
            this.dispose(track([czmGeoPolygon, 'outline'], [sceneObject, 'stroked']));
            this.dispose(track([czmGeoPolygon, 'outlineColor'], [sceneObject, 'strokeColor']));
            this.dispose(track([czmGeoPolygon, 'outlineWidth'], [sceneObject, 'strokeWidth']));
            this.dispose(track([czmGeoPolygon, 'color'], [sceneObject, 'fillColor']));
            this.dispose(track([czmGeoPolygon, 'fill'], [sceneObject, 'filled']));
            this.dispose(track([czmGeoPolygon, 'ground'], [sceneObject, 'fillGround']));
            this.dispose(track([czmGeoPolygon, 'strokeGround'], [sceneObject, 'strokeGround']));
        }
        {
            // update positions
            const update = () => {
                if (!sceneObject.points) {
                    return;
                }

                if (sceneObject.scale && sceneObject.scale.some(e => e === 0)) {
                    console.warn(`缩放属性(scale)不能设置值为0！`);
                    return;
                }

                const [positions] = localPositionsToPositions({
                    originPosition: sceneObject.position,
                    originRotation: sceneObject.rotation,
                    originScale: sceneObject.scale,
                    // @ts-ignore
                    initialRotationMode: 'XForwardZUp',
                }, sceneObject.points);

                czmGeoPolygon.positions = positions;
            };
            update();
            const updateEvent = this.disposeVar(createNextAnimateFrameEvent(
                sceneObject.pointsChanged,
                sceneObject.positionChanged,
                sceneObject.rotationChanged,
                sceneObject.scaleChanged,
            ));
            this.dispose(updateEvent.disposableOn(update));
        }
    }
    override flyTo(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, czmGeoPolygon } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            return super.flyTo(duration, id);
        } else {
            if (czmGeoPolygon.positions) {
                flyWithPositions(czmViewer, sceneObject, id, czmGeoPolygon.positions, duration);
                return true;
            }
            return false;
        }
    }
}
