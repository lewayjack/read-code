import { ESSceneObject, ESTerrainLayer } from "earthsdk3";
import { UeESVisualObject } from "../../base"
import { ESUeViewer } from "../../../ESUeViewer";

export class UeESTerrainLayer extends UeESVisualObject<ESTerrainLayer> {
    static readonly type = this.register('ESUeViewer', ESTerrainLayer.type, this);

    static override forceUeUpdateProps = [
        ...UeESVisualObject.forceUeUpdateProps,
        'url',
    ];

    static override propValFuncs = {
        ...UeESVisualObject.propValFuncs,
        url: (val: string) => ESSceneObject.context.getStrFromEnv(val),
        czmMaxzoom: null,
        czmMinzoom: null,
    };

    constructor(sceneObject: ESTerrainLayer, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);
        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
    }
}
