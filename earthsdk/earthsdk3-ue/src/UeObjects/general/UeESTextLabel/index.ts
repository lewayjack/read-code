
import { ESTextLabel } from "earthsdk3";
import { ESUeViewer } from '../../../ESUeViewer';
import { UeESLabel } from '../../../UeObjects/base';

export class UeESTextLabel extends UeESLabel<ESTextLabel> {
    static readonly type = this.register('ESUeViewer', ESTextLabel.type, this);
    constructor(sceneObject: ESTextLabel, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);

        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
    }
}
