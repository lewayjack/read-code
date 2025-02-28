import { ESCar } from "earthsdk3";
import { UeESObjectWithLocation } from "../../../UeObjects";
import { ESUeViewer } from "../../../ESUeViewer";
export class UeESCar extends UeESObjectWithLocation<ESCar> {
    static readonly type = this.register('ESUeViewer', ESCar.type, this);
    constructor(sceneObject: ESCar, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);
        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
    }
}
