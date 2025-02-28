import { ESPoi3D } from "earthsdk3";
import { ESUeViewer } from "../../../ESUeViewer";
import { UeESObjectWithLocation } from "../../../UeObjects/base";

export class UeESPoi3D extends UeESObjectWithLocation<ESPoi3D> {
    static readonly type = this.register('ESUeViewer', ESPoi3D.type, this);
    constructor(sceneObject: ESPoi3D, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);

        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
    }
}
