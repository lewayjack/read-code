import { CzmESVisualObject } from "../../base";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { ESRoad } from "../../../ESObjects";
import { flyWithPositions } from "../../../utils";
import { bind, createNextAnimateFrameEvent, track } from "xbsj-base";
import { CzmRoad } from "./CzmRoad";

export class CzmESRoad extends CzmESVisualObject<ESRoad> {
    static readonly type = this.register("ESCesiumViewer", ESRoad.type, this);
    private _czmESRoad;
    get czmESRoad() { return this._czmESRoad; }

    constructor(sceneObject: ESRoad, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        this._czmESRoad = this.disposeVar(new CzmRoad(czmViewer, sceneObject.id));
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }

        const czmESRoad = this._czmESRoad;

        // this.dispose(track([czmESRoad, 'show'], [sceneObject, 'stroked']));
        // this.dispose(track([czmESRoad, 'show'], [sceneObject, 'show']));
        {
            const update = () => {
                czmESRoad.show = sceneObject.show && sceneObject.stroked;
            }
            update();
            const event = this.dv(createNextAnimateFrameEvent(sceneObject.showChanged, sceneObject.strokedChanged));
            this.dispose(event.don(update));
        }
        this.dispose(bind([czmESRoad, 'positions'], [sceneObject, 'points']));
        this.dispose(track([czmESRoad, 'width'], [sceneObject, 'width']));
        this.dispose(track([czmESRoad, 'arcType'], [sceneObject, 'arcType']));
        this.dispose(track([czmESRoad, 'imageUrl'], [sceneObject, 'imageUrl']));
        this.dispose(track([czmESRoad, 'repeat'], [sceneObject, 'repeat']));
        this.dispose(track([czmESRoad, 'editing'], [sceneObject, 'editing']));
        this.dispose(track([czmESRoad, 'allowPicking'], [sceneObject, 'allowPicking']));
    }
    override flyTo(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, czmESRoad } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            return super.flyTo(duration, id);
        } else {
            if (czmESRoad.positions) {
                flyWithPositions(czmViewer, sceneObject, id, czmESRoad.positions, duration);
                return true;
            }
            return false;
        }
    }
    override flyIn(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, czmESRoad } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyInParam) {
            return super.flyIn(duration, id);
        } else {
            if (czmESRoad.positions) {
                flyWithPositions(czmViewer, sceneObject, id, czmESRoad.positions, duration);
                return true;
            }
            return false;
        }
    }
}
