import { CzmESGeoVector } from "../../base";
import { ESGeoPolygon } from "earthsdk3";
import { bind, track } from 'xbsj-base';
import { ESCesiumViewer } from '../../../ESCesiumViewer';
import { CzmESGeoPolygonImpl } from './CzmESGeoPolygonImpl';
import { flyWithPositions } from "../../../utils";

export * from './CzmESGeoPolygonImpl';
export class CzmESGeoPolygon<T extends ESGeoPolygon = ESGeoPolygon> extends CzmESGeoVector<T> {
    static readonly type = this.register<ESGeoPolygon, ESCesiumViewer>('ESCesiumViewer', ESGeoPolygon.type, this);

    private _geoPolygon;
    get geoPolygon() { return this._geoPolygon; }

    constructor(sceneObject: T, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        this._geoPolygon = this.ad(new CzmESGeoPolygonImpl(czmViewer, sceneObject.id));
        const geoPolygon = this.geoPolygon;
        if (!geoPolygon) return;

        this.dispose(track([geoPolygon, 'show'], [sceneObject, 'show']));
        this.dispose(track([geoPolygon, 'allowPicking'], [sceneObject, 'allowPicking']));
        this.dispose(bind([geoPolygon, 'editing'], [sceneObject, 'editing']));
        this.dispose(bind([geoPolygon, 'positions'], [sceneObject, 'points']));

        this.dispose(track([geoPolygon, 'strokeGround'], [sceneObject, 'strokeGround']));
        this.dispose(track([geoPolygon, 'ground'], [sceneObject, 'fillGround']));

        this.dispose(track([geoPolygon, 'outline'], [sceneObject, 'stroked']));
        this.dispose(track([geoPolygon, 'outlineColor'], [sceneObject, 'strokeColor']));
        this.dispose(track([geoPolygon, 'outlineWidth'], [sceneObject, 'strokeWidth']));

        this.dispose(track([geoPolygon, 'fill'], [sceneObject, 'filled']));
        this.dispose(track([geoPolygon, 'color'], [sceneObject, 'fillColor']));
    }
    override flyTo(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, geoPolygon } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            super.flyTo(duration, id);
            return true
        } else {
            if (geoPolygon?.positions) {
                flyWithPositions(czmViewer, sceneObject, id, geoPolygon.positions, duration);
                return true;
            }
            return false;
        }
    }
    override flyIn(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, geoPolygon } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyInParam) {
            super.flyIn(duration, id);
            return true;
        } else {
            if (geoPolygon?.positions) {
                flyWithPositions(czmViewer, sceneObject, id, geoPolygon.positions, duration);
                return true;
            }
            return false;
        }
    }
}
