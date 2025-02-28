import { ESViewShed } from "earthsdk3";
import { ESUeViewer } from "../../../ESUeViewer";
import { UeESObjectWithLocation } from "../../../UeObjects/base";
export class UeESViewShed extends UeESObjectWithLocation<ESViewShed> {
    static readonly type = this.register('ESUeViewer', ESViewShed.type, this);
    constructor(sceneObject: ESViewShed, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);
        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
    }
}
