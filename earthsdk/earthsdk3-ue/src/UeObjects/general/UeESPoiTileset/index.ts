import { ESPoiTileset, ESSceneObject } from "earthsdk3";
import { ESUeViewer } from "../../../ESUeViewer";
import { UeESVisualObject } from "../../../UeObjects/base";
export class UeESPoiTileset extends UeESVisualObject<ESPoiTileset> {
    static readonly type = this.register('ESUeViewer', ESPoiTileset.type, this);
    static override forceUeUpdateProps = [
        ...UeESVisualObject.forceUeUpdateProps,
        'url',
    ];
    static override propValFuncs = {
        ...UeESVisualObject.propValFuncs,
        url: (val: string) => ESSceneObject.context.getStrFromEnv(val),
    };

    constructor(sceneObject: ESPoiTileset, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);
        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }

    }
}
