import { ESWidget, ESWidgetInfoType } from "earthsdk3";
import { ESUeViewer } from "../../../ESUeViewer";
import { UeESLabel } from "../../../UeObjects/base";

export class UeESWidget extends UeESLabel<ESWidget> {
    static readonly type = this.register('ESUeViewer', ESWidget.type, this);
    static override propValFuncs = {
        ...UeESLabel.propValFuncs,
        info: (val: ESWidgetInfoType) => JSON.stringify(val ?? {}),
    };
    constructor(sceneObject: ESWidget, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);

        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
    }
}
