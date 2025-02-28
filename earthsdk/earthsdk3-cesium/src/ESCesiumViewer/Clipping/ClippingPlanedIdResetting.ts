import { Destroyable, ObjResettingWithEvent, track } from "xbsj-base";
import { ESCesiumViewer } from "..";
import { CzmClippingPlanesType } from "../../ESJTypesCzm";
import { ESBoxClipping, ESSceneObject, ESSceneObjectWithId } from "earthsdk3";
import { CzmESBoxClipping } from "../../CzmObjects";

class ClippingPlanesIdResetting extends Destroyable {
    constructor(private _czmViewer: ESCesiumViewer, sceneObject: ESSceneObject) {
        super();
        const update = () => {
            let czmClippingPlanes: CzmClippingPlanesType | undefined = undefined;
            do {
                const czmSceneObject = _czmViewer.getCzmObject(sceneObject);
                if (!czmSceneObject) {
                    // 如果没有找到czmSceneObject，那么说明还没有创建实例类，监听viewerAttached事件，等创建实例类后再次回调update
                    this.ad(sceneObject.viewerAttached.don(() => { update(); }));
                    break
                };
                if (sceneObject instanceof ESBoxClipping) {
                    czmClippingPlanes = (czmSceneObject as CzmESBoxClipping).czmBoxClippingPlanes as unknown as CzmClippingPlanesType;
                }
            } while (false);
            if (!czmClippingPlanes || !('computedClippingPlanes' in czmClippingPlanes) || !('computedClippingPlanesChanged' in czmClippingPlanes)) {
                return;
            };
            this.dispose(track([this._czmViewer, 'sceneGlobeClippingPlanes'], [czmClippingPlanes, 'computedClippingPlanes']));
            this.dispose(() => this._czmViewer.sceneGlobeClippingPlanes = undefined);
        }
        update();
    }
}
export class ClippingPlanesIdBind extends Destroyable {
    private _clippingPlanesSceneObjectWithId = this.disposeVar(new ESSceneObjectWithId());

    constructor(czmViewer: ESCesiumViewer) {
        super();
        this.dispose(track([this._clippingPlanesSceneObjectWithId, 'id'], [czmViewer, 'sceneGlobeClippingPlanesId']));
        this.disposeVar(new ObjResettingWithEvent(this._clippingPlanesSceneObjectWithId.sceneObjectChanged, () => {
            const { sceneObject } = this._clippingPlanesSceneObjectWithId;
            if (!sceneObject) return undefined;
            return new ClippingPlanesIdResetting(czmViewer, sceneObject);
        }));
    }
}
