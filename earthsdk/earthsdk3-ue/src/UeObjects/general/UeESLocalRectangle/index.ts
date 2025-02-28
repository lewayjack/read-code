import { ESLocalRectangle } from "earthsdk3";
import { ESUeViewer } from "../../../ESUeViewer";
import { UeESLocalVector2D } from "../../../UeObjects/base";
export class UeESLocalRectangle extends UeESLocalVector2D<ESLocalRectangle> {
    static readonly type = this.register('ESUeViewer', ESLocalRectangle.type, this);
    constructor(sceneObject: ESLocalRectangle, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);
        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
    }
}
