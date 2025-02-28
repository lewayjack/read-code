import { CzmESVisualObject } from "../../base";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { ESSignalTransmission } from "../../../ESObjects";
import { flyWithPositions } from "../../../utils";
import { bind, track } from "xbsj-base";
import { CzmSignalTransmission } from "./CzmSignalTransmission";
export { CzmSignalTransmission }

export class CzmESSignalTransmission extends CzmESVisualObject<ESSignalTransmission> {
    static readonly type = this.register("ESCesiumViewer", ESSignalTransmission.type, this);
    private _czmSignalTransmission;
    get czmSignalTransmission() { return this._czmSignalTransmission; }

    constructor(sceneObject: ESSignalTransmission, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        this._czmSignalTransmission = this.disposeVar(new CzmSignalTransmission(czmViewer, sceneObject.id));
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }

        const czmSignalTransmission = this._czmSignalTransmission;

        this.dispose(track([czmSignalTransmission, 'show'], [sceneObject, 'show']));
        this.dispose(track([czmSignalTransmission, 'allowPicking'], [sceneObject, 'allowPicking']));
        this.dispose(bind([czmSignalTransmission, 'positions'], [sceneObject, 'points']));
        this.dispose(track([czmSignalTransmission, 'width'], [sceneObject, 'strokeWidth']));
        this.dispose(track([czmSignalTransmission, 'color'], [sceneObject, 'strokeColor']));
        this.dispose(bind([czmSignalTransmission, 'editing'], [sceneObject, 'editing']));
        this.dispose(track([czmSignalTransmission, 'startTime'], [sceneObject, 'startTime']));
        this.dispose(track([czmSignalTransmission, 'transmissionTime'], [sceneObject, 'transmissionTime']));
        this.dispose(track([czmSignalTransmission, 'heightRatio'], [sceneObject, 'heightRatio']));
        this.dispose(track([czmSignalTransmission, 'arcType'], [sceneObject, 'arcType']));
        this.dispose(track([czmSignalTransmission, 'brightening'], [sceneObject, 'brightening']));
        this.dispose(track([czmSignalTransmission, 'depthTest'], [sceneObject, 'depthTest']));
        this.dispose(track([czmSignalTransmission, 'imageUrl'], [sceneObject, 'imageUrl']));
        this.dispose(track([czmSignalTransmission, 'repeat'], [sceneObject, 'repeat']));
        this.dispose(track([czmSignalTransmission, 'bidirectional'], [sceneObject, 'bidirectional']));
        this.dispose(track([czmSignalTransmission, 'loop'], [sceneObject, 'loop']));
        this.dispose(track([czmSignalTransmission, 'currentTime'], [sceneObject, 'currentTime']));
        this.dispose(track([czmSignalTransmission, 'duration'], [sceneObject, 'duration']));
        this.dispose(track([czmSignalTransmission, 'playing'], [sceneObject, 'playing']));
        this.dispose(track([czmSignalTransmission, 'speed'], [sceneObject, 'speed']));
    }
    override flyTo(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, czmSignalTransmission } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            super.flyTo(duration, id);
            return true
        } else {
            if (czmSignalTransmission.positions) {
                flyWithPositions(czmViewer, sceneObject, id, czmSignalTransmission.positions, duration);
                return true
            }
            return false;
        }
    }
    override flyIn(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, czmSignalTransmission } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyInParam) {
            return super.flyIn(duration, id);
        } else {
            if (czmSignalTransmission.positions) {
                flyWithPositions(czmViewer, sceneObject, id, czmSignalTransmission.positions, duration);
                return true
            }
            return false;
        }
    }
}
