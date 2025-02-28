import { CzmESVisualObject } from "../../base";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { ESGeoSmoothPolygon } from "../../../ESObjects";
import { flyWithPositions } from "../../../utils";
import { bind, createNextAnimateFrameEvent, track } from "xbsj-base";
import { GeoSmoothPolygon } from "./GeoSmoothPolygon";

export class CzmESGeoSmoothPolygon extends CzmESVisualObject<ESGeoSmoothPolygon> {
    static readonly type = this.register("ESCesiumViewer", ESGeoSmoothPolygon.type, this);
    private _geoSmoothPolygon;
    get geoSmoothPolygon() { return this._geoSmoothPolygon; }

    constructor(sceneObject: ESGeoSmoothPolygon, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        this._geoSmoothPolygon = this.disposeVar(new GeoSmoothPolygon(czmViewer, sceneObject.id));
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }

        const czmSmoothPolygon = this._geoSmoothPolygon;

        this.dispose(track([czmSmoothPolygon, 'show'], [sceneObject, 'show']));
        this.dispose(bind([czmSmoothPolygon, 'positions'], [sceneObject, 'points']));
        this.dispose(track([czmSmoothPolygon, 'strokeGround'], [sceneObject, 'strokeGround']));
        this.dispose(track([czmSmoothPolygon, 'allowPicking'], [sceneObject, 'allowPicking']));

        this.dispose(track([czmSmoothPolygon, 'outline'], [sceneObject, 'stroked']));
        this.dispose(track([czmSmoothPolygon, 'outlineColor'], [sceneObject, 'strokeColor']));
        this.dispose(track([czmSmoothPolygon, 'outlineWidth'], [sceneObject, 'strokeWidth']));
        this.dispose(track([czmSmoothPolygon, 'strokeGround'], [sceneObject, 'strokeGround']));
        this.dispose(track([czmSmoothPolygon, 'filled'], [sceneObject, 'filled']));
        this.dispose(track([czmSmoothPolygon, 'color'], [sceneObject, 'fillColor']));
        this.dispose(track([czmSmoothPolygon, 'ground'], [sceneObject, 'ground']));
        {
            const update = () => {
                czmSmoothPolygon.ground = sceneObject.ground || sceneObject.fillGround;
            }
            update();
            const event = this.dv(createNextAnimateFrameEvent(sceneObject.groundChanged, sceneObject.fillGroundChanged))
            this.d(event.don(update));
        }
        // this.dispose(track([czmSmoothPolygon, 'color'], [sceneObject, 'fillColor']));

        {
            const updateProp = () => {
                czmSmoothPolygon.color = sceneObject.filled ? sceneObject.fillColor : ESGeoSmoothPolygon.defaults.fillStyle.color
            }
            updateProp();
            const updateEvent = this.disposeVar(createNextAnimateFrameEvent(
                sceneObject.fillStyleChanged,
                sceneObject.filledChanged,
            ));
            this.dispose(updateEvent.disposableOn(updateProp));
        }

        this.dispose(bind([czmSmoothPolygon, 'editing'], [sceneObject, 'editing']));
        this.dispose(track([czmSmoothPolygon, 'depth'], [sceneObject, 'depth']));
    }
    override flyTo(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, geoSmoothPolygon } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            return super.flyTo(duration, id);
        } else {
            if (geoSmoothPolygon.positions) {
                flyWithPositions(czmViewer, sceneObject, id, geoSmoothPolygon.positions, duration);
                return true;
            }
            return false;
        }
    }
    override flyIn(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, geoSmoothPolygon } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyInParam) {
            return super.flyIn(duration, id);
        } else {
            if (geoSmoothPolygon.positions) {
                flyWithPositions(czmViewer, sceneObject, id, geoSmoothPolygon.positions, duration);
                return true;
            }
            return false;
        }
    }
}
