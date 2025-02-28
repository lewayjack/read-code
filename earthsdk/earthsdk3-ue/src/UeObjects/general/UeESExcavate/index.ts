import { ESExcavate } from "earthsdk3";
import { UeESGeoPolygon } from "../UeESGeoPolygon";
import { ESUeViewer } from "../../../ESUeViewer";
export class UeESExcavate extends UeESGeoPolygon<ESExcavate> {
    static override readonly type = this.register('ESUeViewer', ESExcavate.type, this);
    constructor(sceneObject: ESExcavate, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);

        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
    }
}
