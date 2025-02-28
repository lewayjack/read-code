import { ESPolygonFlattenedPlane } from "earthsdk3";
import { UeESGeoPolygon } from "../UeESGeoPolygon";
import { ESUeViewer } from "../../../ESUeViewer";
export class UeESPolygonFlattenedPlane extends UeESGeoPolygon<ESPolygonFlattenedPlane> {
    static override readonly type = this.register('ESUeViewer', ESPolygonFlattenedPlane.type, this);
    constructor(sceneObject: ESPolygonFlattenedPlane, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);
        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
    }
}
