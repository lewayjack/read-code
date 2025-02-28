import { ESLabel } from "earthsdk3";
import { UeESObjectWithLocation } from '../UeESObjectWithLocation';
import { ESUeViewer } from '../../../ESUeViewer';
export class UeESLabel<T extends ESLabel = ESLabel> extends UeESObjectWithLocation<T> {
    constructor(sceneObject: T, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);
        const viewer = ueViewer.viewer;
        if (!viewer) return;
        this.d(ueViewer.widgetEvent.don((info) => {
            if (info.objId !== sceneObject.id) return
            const { type, add } = info;
            sceneObject.widgetEvent.emit({ type, add });
        }))
    }
}
