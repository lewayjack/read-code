import { ESBlastParticleSystem } from "earthsdk3";
import { ESUeViewer } from "../../../ESUeViewer";
import { UeESObjectWithLocation } from "../../../UeObjects/base";

export class UeESBlastParticleSystem extends UeESObjectWithLocation<ESBlastParticleSystem> {
    static readonly type = this.register('ESUeViewer', ESBlastParticleSystem.type, this);
    constructor(sceneObject: ESBlastParticleSystem, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);
        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn('viewer is undefined!');
            return;
        }
    }
}
