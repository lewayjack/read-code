import { Destroyable } from "xbsj-base";
import { GroundInnerPolygon } from "./GroundInnerPolygon";
import { GroundBottomPolyline } from "./GroundBottomPolyline";
import { CzmPolygonWithHeight } from ".";
import { ESCesiumViewer } from "../../../../ESCesiumViewer";
import { flyTo } from "../../../../utils";

export class GroundPolygon extends Destroyable {
    private _innerPolygon: GroundInnerPolygon;
    get innerPolygon() { return this._innerPolygon; }

    private _bottomPolyline: GroundBottomPolyline;
    get bottomPolyline() { return this._bottomPolyline; }
    constructor(sceneObject: CzmPolygonWithHeight, czmViewer: ESCesiumViewer) {
        super();
        const polygonGround = sceneObject.ground;
        this._innerPolygon = this.disposeVar(new GroundInnerPolygon(sceneObject, czmViewer));
        this._bottomPolyline = this.disposeVar(new GroundBottomPolyline(sceneObject, czmViewer, polygonGround));

        // this.dispose(sceneObject.flyToEvent.disposableOn(duration => {
        //     this._innerPolygon.groundPolygonPrimitive.flyTo(duration);
        //     if(!sceneObject.fill){
        //         this._bottomPolyline.geoPolyline.flyTo(duration)
        //     }
        // }));

        this.dispose(sceneObject.flyToEvent.disposableOn(duration => {
            if (!sceneObject.viewDistanceRange) {
                // this._innerPolygon.groundPolygonPrimitive.flyTo(duration);
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
