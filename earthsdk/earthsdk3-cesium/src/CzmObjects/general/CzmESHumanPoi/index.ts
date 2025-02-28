import { ESCesiumViewer } from "@czmSrc/ESCesiumViewer";
import { EngineObject, ESHumanPoi } from "earthsdk3";
import { bind, createNextAnimateFrameEvent, track } from "xbsj-base";

export class CzmESHumanPoi extends EngineObject<ESHumanPoi> {
    static readonly type = this.register("ESCesiumViewer", ESHumanPoi.type, this);
    constructor(sceneObject: ESHumanPoi, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }

        const { human, poi } = sceneObject;
        this.dispose(bind([human, 'position'], [sceneObject, 'position']));
        this.dispose(bind([human, 'rotation'], [sceneObject, 'rotation']));
        this.dispose(track([poi, 'rotation'], [sceneObject, 'rotation']));

        const updatePos = () => {
            const pos = sceneObject.position;
            poi.position = [pos[0], pos[1], pos[2] + sceneObject.poiOffsetHeight];
        }
        updatePos();
        const posEvent = this.dv(createNextAnimateFrameEvent(
            sceneObject.positionChanged,
            sceneObject.poiOffsetHeightChanged
        ))
        this.d(posEvent.don(updatePos));

    }
}
