import { ESBoxClipping } from "earthsdk3";
import { UeESObjectWithLocation } from "../../../UeObjects";
import { ESUeViewer } from "../../../ESUeViewer";

export class UeESBoxClipping extends UeESObjectWithLocation<ESBoxClipping> {
    static readonly type = this.register('ESUeViewer', ESBoxClipping.type, this);
    constructor(sceneObject: ESBoxClipping, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);
        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is underfined!`);
            return;
        }
    }
}
