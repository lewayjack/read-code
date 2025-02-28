import { ESLabel, PickedResult } from "earthsdk3";
import { CzmESObjectWithLocation } from "./CzmESObjectWithLocation";
import { ESCesiumViewer } from "../../ESCesiumViewer";
import { react } from "xbsj-base";

export class CzmESLabel<T extends ESLabel = ESLabel> extends CzmESObjectWithLocation<T> {
    private _lastHoverResult = this.disposeVar(react<any | undefined>(undefined));
    get lastHoverResult() { return this._lastHoverResult.value; }
    set lastHoverResult(value: any | undefined) { this._lastHoverResult.value = value; }
    get lastHoverResultChanged() { return this._lastHoverResult.changed; }
    constructor(sceneObject: T, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn('viewer is undefined!');
            return;
        }
        // 鼠标移入移除
        this.ad(czmViewer.hoverEvent.don(async (e) => {
            const pickedResult = await czmViewer.pick(e.screenPosition, "innerHoverEvent");
            this.lastHoverResult = Object.assign({}, pickedResult, e);
        }))
    }
}
