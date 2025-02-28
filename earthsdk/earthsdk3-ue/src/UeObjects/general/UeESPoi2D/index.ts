import { ESPoi2D } from "earthsdk3";
import { ESUeViewer } from "../../../ESUeViewer";
import { UeESLabel } from "../../../UeObjects/base";
export class UeESPoi2D extends UeESLabel<ESPoi2D> {
    static readonly type = this.register('ESUeViewer', ESPoi2D.type, this);
    constructor(sceneObject: ESPoi2D, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);
        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
    }
}
