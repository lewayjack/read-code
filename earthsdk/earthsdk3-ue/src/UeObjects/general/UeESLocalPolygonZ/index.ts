import { ESLocalPolygonZ } from "earthsdk3";
import { ESUeViewer } from "../../../ESUeViewer";
import { UeESVisualObject } from "../../../UeObjects/base";
export class UeESLocalPolygonZ extends UeESVisualObject<ESLocalPolygonZ> {
    static readonly type = this.register('ESUeViewer', ESLocalPolygonZ.type, this);
    constructor(sceneObject: ESLocalPolygonZ, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);
        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
    }
}
