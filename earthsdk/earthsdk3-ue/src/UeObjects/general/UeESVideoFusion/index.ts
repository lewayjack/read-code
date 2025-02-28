import { ESVideoFusion } from "earthsdk3";
import { ESUeViewer } from "../../../ESUeViewer";
import { UeESObjectWithLocation } from "../../../UeObjects/base";

export class UeESVideoFusion extends UeESObjectWithLocation<ESVideoFusion> {
    static readonly type = this.register('ESUeViewer', ESVideoFusion.type, this);
    constructor(sceneObject: ESVideoFusion, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);

        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
    }
}
