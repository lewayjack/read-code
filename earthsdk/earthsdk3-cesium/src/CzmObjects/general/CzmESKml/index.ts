import { EngineObject } from "earthsdk3";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { ESKml } from "../../../ESObjects";
import { bind, track } from "xbsj-base";
import { CzmKml } from "./CzmKml";

export class CzmESKml extends EngineObject<ESKml> {
    static readonly type = this.register("ESCesiumViewer", ESKml.type, this);
    constructor(sceneObject: ESKml, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        const czmKml = this.disposeVar(new CzmKml(czmViewer, sceneObject.id));

        this.dispose(track([czmKml, 'show'], [sceneObject, 'show']));
        this.dispose(track([czmKml, 'allowPicking'], [sceneObject, 'allowPicking']));
        this.dispose(bind([czmKml, 'data'], [sceneObject, 'data']));
        this.dispose(bind([czmKml, 'uri'], [sceneObject, 'uri']));
        this.dispose(bind([czmKml, 'loadFuncStr'], [sceneObject, 'loadFuncStr']));
        this.dispose(bind([czmKml, 'autoResetClock'], [sceneObject, 'autoResetClock']));
        this.dispose(bind([czmKml, 'clockEnabled'], [sceneObject, 'clockEnabled']));
        this.dispose(bind([czmKml, 'startTime'], [sceneObject, 'startTime']));
        this.dispose(bind([czmKml, 'stopTime'], [sceneObject, 'stopTime']));
        this.dispose(bind([czmKml, 'currentTime'], [sceneObject, 'currentTime']));
        this.dispose(bind([czmKml, 'multiplier'], [sceneObject, 'multiplier']));
        this.dispose(bind([czmKml, 'clockStep'], [sceneObject, 'clockStep']));
        this.dispose(bind([czmKml, 'clockRange'], [sceneObject, 'clockRange']));
        this.dispose(bind([czmKml, 'shouldAnimate'], [sceneObject, 'shouldAnimate']));
        //@ts-ignore
        this.dispose(bind([czmKml, 'clampToGround'], [sceneObject, 'clampToGround']));
        this.dispose(sceneObject.flyToEvent.disposableOn(duration => {
            if (!czmViewer.actived) return;
            czmKml.flyTo(duration && duration * 1000);
        }));

    }
}

