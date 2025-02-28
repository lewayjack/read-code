import { getDistancesFromPositions } from "earthsdk3";
import { CzmESObjectWithLocation, CzmPolyline } from "../../../CzmObjects";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { ESLocalLineStringZ } from "../../../ESObjects";
import { flyWithPositions, getCameraPosition, localPositionsToPositions } from "../../../utils";
import { createNextAnimateFrameEvent, track } from "xbsj-base";

export class CzmESLocalLineStringZ extends CzmESObjectWithLocation<ESLocalLineStringZ> {
    static readonly type = this.register("ESCesiumViewer", ESLocalLineStringZ.type, this);
    private _czmGeoPolyline;
    get czmGeoPolyline() { return this._czmGeoPolyline; }

    constructor(sceneObject: ESLocalLineStringZ, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        this._czmGeoPolyline = this.disposeVar(new CzmPolyline(czmViewer, sceneObject.id));
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        const czmGeoPolyline = this._czmGeoPolyline;

        czmGeoPolyline.arcType = 'NONE';

        {
            this.dispose(track([czmGeoPolyline, 'width'], [sceneObject, 'strokeWidth']));
            this.dispose(track([czmGeoPolyline, 'color'], [sceneObject, 'strokeColor']));
            const update = () => {
                czmGeoPolyline.show = sceneObject.show && sceneObject.stroked;
            }
            update()
            const event = this.dv(createNextAnimateFrameEvent(sceneObject.showChanged, sceneObject.strokedChanged));
            this.dispose(event.don(update));
        }

        {
            this.dispose(track([czmGeoPolyline, 'loop'], [sceneObject, 'loop']));
            this.dispose(track([czmGeoPolyline, 'hasDash'], [sceneObject, 'hasDash']));
            this.dispose(track([czmGeoPolyline, 'gapColor'], [sceneObject, 'gapColor']));
            this.dispose(track([czmGeoPolyline, 'dashLength'], [sceneObject, 'dashLength']));
            this.dispose(track([czmGeoPolyline, 'dashPattern'], [sceneObject, 'dashPattern']));
            this.dispose(track([czmGeoPolyline, 'hasArrow'], [sceneObject, 'hasArrow']));
            this.dispose(track([czmGeoPolyline, 'depthTest'], [sceneObject, 'depthTest']));
            this.dispose(track([czmGeoPolyline, 'allowPicking'], [sceneObject, 'allowPicking']));
            this.dispose(track([czmGeoPolyline, 'ground'], [sceneObject, 'strokeGround']));
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
                }, sceneObject.points);

                czmGeoPolyline.positions = positions;
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
    override visibleDistance(sceneObject: ESLocalLineStringZ, czmViewer: ESCesiumViewer): void {
        if (czmViewer.viewer?.camera && sceneObject.show) {
            const dis = getDistancesFromPositions([sceneObject.position, getCameraPosition(czmViewer.viewer.camera)], 'NONE')[0];
            let show = false;
            if (sceneObject.minVisibleDistance < sceneObject.maxVisibleDistance) {
                show = sceneObject.minVisibleDistance < dis && dis < sceneObject.maxVisibleDistance;
            } else if (sceneObject.maxVisibleDistance == 0) {
                show = dis > sceneObject.minVisibleDistance;
            }
            this._czmGeoPolyline.show = sceneObject.show && sceneObject.stroked && show;
        }
    }
    override flyTo(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, czmGeoPolyline } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            return super.flyTo(duration, id);
        } else {
            if (czmGeoPolyline.positions) {
                flyWithPositions(czmViewer, sceneObject, id, czmGeoPolyline.positions, duration)
                return true;
            }
            return false;
        }
    }
}