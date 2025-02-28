import { EngineObject, ESCzml } from "earthsdk3";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { bind, track } from "xbsj-base";
import { CzmCzml } from "./CzmCzml";

export class CzmESCzml<T extends ESCzml = ESCzml, V extends ESCesiumViewer = ESCesiumViewer> extends EngineObject<T, V> {
    static readonly type = this.register<ESCzml, ESCesiumViewer>("ESCesiumViewer", ESCzml.type, this);
    constructor(sceneObject: T, czmViewer: V) {
        super(sceneObject, czmViewer);
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        const czmCzml = this.disposeVar(new CzmCzml(czmViewer,sceneObject.id));

        this.dispose(track([czmCzml, 'show'], [sceneObject, 'show']));
        this.dispose(track([czmCzml, 'allowPicking'], [sceneObject, 'allowPicking']));
        this.dispose(bind([czmCzml, 'data'], [sceneObject, 'data']));
        this.dispose(bind([czmCzml, 'uri'], [sceneObject, 'uri']));
        this.dispose(bind([czmCzml, 'loadFuncStr'], [sceneObject, 'loadFuncStr']));
        this.dispose(bind([czmCzml, 'autoResetClock'], [sceneObject, 'autoResetClock']));
        this.dispose(bind([czmCzml, 'clockEnabled'], [sceneObject, 'clockEnabled']));
        this.dispose(bind([czmCzml, 'startTime'], [sceneObject, 'startTime']));
        this.dispose(bind([czmCzml, 'stopTime'], [sceneObject, 'stopTime']));
        this.dispose(bind([czmCzml, 'currentTime'], [sceneObject, 'currentTime']));
        this.dispose(bind([czmCzml, 'multiplier'], [sceneObject, 'multiplier']));
        this.dispose(bind([czmCzml, 'clockStep'], [sceneObject, 'clockStep']));
        this.dispose(bind([czmCzml, 'clockRange'], [sceneObject, 'clockRange']));
        this.dispose(bind([czmCzml, 'shouldAnimate'], [sceneObject, 'shouldAnimate']));
        this.dispose(sceneObject.flyToEvent.disposableOn(duration => {
            if (!czmViewer.actived) return;
            czmCzml.flyTo(duration);
        }));

    }
}
