import { Destroyable } from "xbsj-base";
import { InnerPolygon } from "./InnerPolygon";
import { BottomPolyline } from "./BottomPolyline";
import { CzmPolygonWithHeight } from ".";
import { ESCesiumViewer } from "../../../../ESCesiumViewer";
import { flyTo } from "../../../../utils";

export class Polygon extends Destroyable {
    private _innerPolygon: InnerPolygon;
    get innerPolygon() { return this._innerPolygon; }

    private _bottomPolyline: BottomPolyline;
    get bottomPolyline() { return this._bottomPolyline; }

    constructor(sceneObject: CzmPolygonWithHeight, czmViewer: ESCesiumViewer) {
        super();
        const polygonGround = sceneObject.ground;
        this._innerPolygon = this.disposeVar(new InnerPolygon(sceneObject, czmViewer, false, polygonGround));
        this._bottomPolyline = this.disposeVar(new BottomPolyline(sceneObject, czmViewer, polygonGround));

        // this.dispose(sceneObject.flyToEvent.disposableOn(duration => {
        //     this._innerPolygon.czmInnerPolygonPrimitive.flyTo(duration);
        //     if (!sceneObject.fill) {
        //         this._bottomPolyline.geoPolyline.flyTo(duration)
        //     }
        // }));

        this.dispose(sceneObject.flyToEvent.disposableOn(duration => {
            if (!sceneObject.viewDistanceRange) {
                // this._innerPolygon.czmInnerPolygonPrimitive.flyTo(duration);
                // if (!sceneObject.fill) {
                //     this._bottomPolyline.geoPolyline.flyTo(duration)
                // }
                const center = sceneObject.positionsCenter.center as [number, number, number]
                if (!sceneObject.positions) return;
                const centerPoint = [center[0], center[1], sceneObject.positions[0][2]] as [number, number, number]
                const viewDistance = sceneObject.positionsCenter.radius * 4
                flyTo(czmViewer.viewer, centerPoint, viewDistance, undefined, duration)
            } else {
                const centerPoint = sceneObject.positionsCenter.center as [number, number, number]
                const viewDistance = (sceneObject.viewDistanceRange[1] + sceneObject.viewDistanceRange[2]) / 2
                flyTo(czmViewer.viewer, centerPoint, viewDistance, undefined, duration)
            }
        }));

    }
}
