import { ESClippingPlane } from "earthsdk3";
import { ESUeViewer } from "../../../ESUeViewer";
import { UeESObjectWithLocation } from "../../base";
export class UeESClippingPlane extends UeESObjectWithLocation<ESClippingPlane> {
    static readonly type = this.register('ESUeViewer', ESClippingPlane.type, this);
    constructor(sceneObject: ESClippingPlane, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);
        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is underfined!`);
            return;
        }
    }
}
