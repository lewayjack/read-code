
import { ESVolumeMeasurement } from "earthsdk3";
import { CzmESGeoVector } from "../../../CzmObjects";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { flyWithPositions } from "../../../utils";
import { bind, track } from "xbsj-base";
import { GeoVolumeMeasurement } from "./GeoVolumeMeasurement";

export class CzmESVolumeMeasurement<T extends ESVolumeMeasurement = ESVolumeMeasurement> extends CzmESGeoVector<T> {
    static readonly type = this.register<ESVolumeMeasurement, ESCesiumViewer>('ESCesiumViewer', ESVolumeMeasurement.type, this);

    private _geoVolumeMeasurement;
    get geoVolumeMeasurement() { return this._geoVolumeMeasurement; }

    constructor(sceneObject: T, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        this._geoVolumeMeasurement = this.dv(new GeoVolumeMeasurement(this.czmViewer, sceneObject.id));
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        const geoVolumeMeasurement = this._geoVolumeMeasurement;
        this.d(track([geoVolumeMeasurement, 'show'], [sceneObject, 'show']));
        this.d(bind([geoVolumeMeasurement, 'positions'], [sceneObject, 'points']));
        this.d(track([geoVolumeMeasurement, 'allowPicking'], [sceneObject, 'allowPicking']));
        this.d(bind([geoVolumeMeasurement, 'editing'], [sceneObject, 'editing']));

        this.d(bind([geoVolumeMeasurement, 'planeHeight'], [sceneObject, 'planeHeight']));
        this.d(track([geoVolumeMeasurement, 'gridWidth'], [sceneObject, 'gridWidth']));
        this.d(track([sceneObject, 'cutVolume'], [geoVolumeMeasurement, 'cutVolume']));
        this.d(track([sceneObject, 'fillVolume'], [geoVolumeMeasurement, 'fillVolume']));
        this.d(track([sceneObject, 'cutAndFillVolume'], [geoVolumeMeasurement, 'cutAndFillVolume']));
        this.d(bind([sceneObject, 'progress'], [geoVolumeMeasurement, 'progress']));
        this.d(track([geoVolumeMeasurement, 'depthTest'], [sceneObject, 'depthTest']));

        this.d(track([geoVolumeMeasurement, 'outline'], [sceneObject, 'stroked']));
        this.d(track([geoVolumeMeasurement, 'outlineWidth'], [sceneObject, 'strokeWidth']));
        this.d(track([geoVolumeMeasurement, 'outlineColor'], [sceneObject, 'strokeColor']));
        this.d(track([geoVolumeMeasurement, 'filled'], [sceneObject, 'filled']));
        this.d(track([geoVolumeMeasurement, 'fillColor'], [sceneObject, 'fillColor']));
        this.d(track([geoVolumeMeasurement, 'fillGround'], [sceneObject, 'fillGround']));
        this.d(track([geoVolumeMeasurement, 'strokeGround'], [sceneObject, 'strokeGround']));

        this.d(sceneObject.startEvent.don(() => {
            geoVolumeMeasurement.enableEmit()
        }))

        this.d(sceneObject.clearEvent.don(() => {
            geoVolumeMeasurement.clearEmit()
        }))
    }

    override flyTo(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, geoVolumeMeasurement } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            return super.flyTo(duration, id);
        } else {
            if (geoVolumeMeasurement.positions) {
                flyWithPositions(czmViewer, sceneObject, id, geoVolumeMeasurement.positions, duration);
                return true;
            }
            return false;
        }
    }
}
