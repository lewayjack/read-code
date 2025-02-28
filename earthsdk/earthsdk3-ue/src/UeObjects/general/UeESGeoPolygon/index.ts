
import { ESUeViewer } from "../../../ESUeViewer";
import { UeESGeoVector } from "../../../UeObjects/base";
import { ESGeoPolygon } from "earthsdk3";
export class UeESGeoPolygon<T extends ESGeoPolygon = ESGeoPolygon> extends UeESGeoVector<T> {
    static readonly type = this.register<ESGeoPolygon, ESUeViewer>('ESUeViewer', ESGeoPolygon.type, this);
    constructor(sceneObject: T, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);
        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
    }
}
