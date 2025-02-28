import { ESLocalCircle } from "earthsdk3";
import { ESUeViewer } from "../../../ESUeViewer";
import { UeESLocalVector2D } from "../../../UeObjects/base";

export class UeESLocalCircle extends UeESLocalVector2D<ESLocalCircle> {
    static readonly type = this.register('ESUeViewer', ESLocalCircle.type, this);
    constructor(sceneObject: ESLocalCircle, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);

        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
    }
}
