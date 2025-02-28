import { ESGaussianSplatting } from "earthsdk3";
import { UeESObjectWithLocation } from "@ueSrc/UeObjects/base";
import { ESUeViewer } from "@ueSrc/ESUeViewer";

export class UeESGaussianSplatting extends UeESObjectWithLocation<ESGaussianSplatting> {
    static readonly type = this.register('ESUeViewer', ESGaussianSplatting.type, this);
    constructor(sceneObject: ESGaussianSplatting, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);

        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
    }
}
