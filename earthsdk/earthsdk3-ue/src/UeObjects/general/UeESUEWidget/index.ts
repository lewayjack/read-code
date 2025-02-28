import { ESUEWidget, ESUEWidgetInfoType } from "earthsdk3";
import { callFunctionCallFunc, ESUeViewer } from "../../../ESUeViewer";
import { UeESLabel } from "../../../UeObjects/base";

export class UeESUEWidget extends UeESLabel<ESUEWidget> {
    static readonly type = this.register('ESUeViewer', ESUEWidget.type, this);

    static override propValFuncs = {
        ...UeESLabel.propValFuncs,
        info: (val: ESUEWidgetInfoType) => JSON.stringify(val ?? {}),
    };

    constructor(sceneObject: ESUEWidget, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);

        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        this.d(sceneObject.callFunctionEvent.don((fn, p) => {
            callFunctionCallFunc(viewer, sceneObject.id, fn, p);
        }))
    }
}
