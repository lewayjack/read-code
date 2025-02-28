import { ESUeViewer } from "@ueSrc/ESUeViewer";
import { EngineObject, ESHumanPoi } from "earthsdk3";
export class UeESHumanPoi extends EngineObject<ESHumanPoi> {
    static readonly type = this.register("ESUeViewer", ESHumanPoi.type, this);
    constructor(sceneObject: ESHumanPoi, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);
        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }

        {
            sceneObject.poi.actorTag = sceneObject.human.id;
            sceneObject.poi.positionOffset = [0, 0, sceneObject.poiOffsetHeight - 0.8];
            this.d(sceneObject.poiOffsetHeightChanged.don(() => {
                sceneObject.poi.positionOffset = [0, 0, sceneObject.poiOffsetHeight - 0.8];
            }));
        }
        this.d(() => { sceneObject.poi.actorTag = ''; });
    }
}
