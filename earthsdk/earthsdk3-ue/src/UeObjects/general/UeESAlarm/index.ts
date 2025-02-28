import { ESAlarm } from "earthsdk3";
import { UeESObjectWithLocation } from "../../base";
import { ESUeViewer } from "../../../ESUeViewer";

export class UeESAlarm extends UeESObjectWithLocation<ESAlarm> {
    static readonly type = this.register('ESUeViewer', ESAlarm.type, this);
    constructor(sceneObject: ESAlarm, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);

        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
    }
}
