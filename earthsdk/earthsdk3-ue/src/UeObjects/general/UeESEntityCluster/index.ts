import { ESEntityCluster } from "earthsdk3";
import { ESUeViewer } from "../../../ESUeViewer";
import { UeESVisualObject } from "../../../UeObjects/base";
export class UeESEntityCluster extends UeESVisualObject<ESEntityCluster> {
    static readonly type = this.register('ESUeViewer', ESEntityCluster.type, this);
    constructor(sceneObject: ESEntityCluster, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);
        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }

        this.d(ueViewer.widgetEvent.don((info) => {
            if (info.objId !== sceneObject.id) return
            //@ts-ignore
            const { type, properties } = info;
            //@ts-ignore
            sceneObject.widgetEvent.emit({ type, properties });
        }))
    }
}
