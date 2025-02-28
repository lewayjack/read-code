import { ESApertureEffect } from "earthsdk3";
import { ESUeViewer } from "../../../ESUeViewer";
import { UeESObjectWithLocation } from "../../../UeObjects/base";
export class UeESApertureEffect extends UeESObjectWithLocation<ESApertureEffect> {
    static readonly type = this.register('ESUeViewer', ESApertureEffect.type, this);
    constructor(sceneObject: ESApertureEffect, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);

        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
    }
}
