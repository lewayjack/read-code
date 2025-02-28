import { ESClassification } from "earthsdk3";
import { CzmESVisualObject } from "../../base";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { flyWithPositions } from "../../../utils";
import { bind, track } from "xbsj-base";
import { GeoClassificationPolygon } from "./GeoClassificationPolygon";

export class CzmESClassification extends CzmESVisualObject<ESClassification> {
    static readonly type = this.register("ESCesiumViewer", ESClassification.type, this);
    private _polygon;
    get polygon() { return this._polygon; }
    constructor(sceneObject: ESClassification, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        this._polygon = this.disposeVar(new GeoClassificationPolygon(czmViewer,sceneObject.id));
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        const polygon = this._polygon;

        this.dispose(track([polygon, 'show'], [sceneObject, 'show']));
        this.dispose(bind([polygon, 'editing'], [sceneObject, 'editing']));
        this.dispose(bind([polygon, 'positions'], [sceneObject, 'points']));
        this.dispose(track([polygon, 'allowPicking'], [sceneObject, 'allowPicking']));
        this.dispose(track([polygon, 'depth'], [sceneObject, 'height']));

        this.dispose(track([polygon, 'showHelper'], [sceneObject, 'stroked']));
        this.dispose(track([polygon, 'outline'], [sceneObject, 'stroked']));
        this.dispose(track([polygon, 'outlineColor'], [sceneObject, 'strokeColor']));
        this.dispose(track([polygon, 'outlineWidth'], [sceneObject, 'strokeWidth']));

        this.dispose(track([polygon, 'fill'], [sceneObject, 'filled']));
        this.dispose(track([polygon, 'color'], [sceneObject, 'fillColor']));
    }
    override flyTo(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, polygon } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            return super.flyTo(duration, id);
        } else {
            if (polygon.positions) {
                flyWithPositions(czmViewer, sceneObject, id, polygon.positions, duration);
                return true;
            }
            return false;
        }
    }
    override flyIn(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, polygon } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyInParam) {
            return super.flyIn(duration, id);
        } else {
            if (polygon.positions) {
                flyWithPositions(czmViewer, sceneObject, id, polygon.positions, duration);
                return true;
            }
            return false;
        }
    }
}
