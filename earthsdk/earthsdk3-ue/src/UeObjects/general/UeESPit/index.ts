
import { ESPit } from "earthsdk3";
import { ESUeViewer } from "../../../ESUeViewer";
import { UeESGeoPolygon } from "../UeESGeoPolygon";

export class UeESPit extends UeESGeoPolygon<ESPit> {
    static override readonly type = this.register('ESUeViewer', ESPit.type, this);
    constructor(sceneObject: ESPit, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);

        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
    }
}
