
import { ESFireParticleSystem } from "earthsdk3";
import { ESUeViewer } from "../../../ESUeViewer";
import { UeESObjectWithLocation } from "../../../UeObjects/base";

export class UeESFireParticleSystem extends UeESObjectWithLocation<ESFireParticleSystem> {
    static readonly type = this.register('ESUeViewer', ESFireParticleSystem.type, this);
    constructor(sceneObject: ESFireParticleSystem, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);
        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn('viewer is undefined!');
            return;
        }
    }
}
