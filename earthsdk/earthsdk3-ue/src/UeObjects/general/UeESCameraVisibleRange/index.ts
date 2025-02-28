import { ESCameraVisibleRange } from "earthsdk3";
import { UeESObjectWithLocation } from "../../base";
import { ESUeViewer } from "../../../ESUeViewer";
export class UeESCameraVisibleRange extends UeESObjectWithLocation<ESCameraVisibleRange> {
    static readonly type = this.register('ESUeViewer', ESCameraVisibleRange.type, this);
    constructor(sceneObject: ESCameraVisibleRange, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);

        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
    }
}
