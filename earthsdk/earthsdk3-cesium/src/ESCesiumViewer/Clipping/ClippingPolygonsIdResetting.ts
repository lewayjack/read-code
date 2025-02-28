import { createNextAnimateFrameEvent, Destroyable, ObjResettingWithEvent } from "xbsj-base";
import { ESCesiumViewer } from "..";
import { ESExcavate, ESHole, ESSceneObject } from "earthsdk3";
import { CzmClippingPolygonCollectionJsonType } from "../../ESJTypesCzm";
import { CzmESExcavate, CzmPolygonClipping } from "../../CzmObjects";
export class ClippingPolygonsIdBind extends Destroyable {
    constructor(czmViewer: ESCesiumViewer) {
        super();
        this.dv(new ObjResettingWithEvent(czmViewer.sceneGlobeClippingPolygonsIdChanged, (newVal, oldVal) => {
            if (!newVal || newVal === oldVal || (newVal && newVal.length === 0)) return undefined;
            return new ClippingPolygonsIdResetting(czmViewer);
        }))
    }
}
class ClippingPolygonsIdResetting extends Destroyable {
    constructor(private _czmViewer: ESCesiumViewer) {
        super();
        const clippingPolygonsID = this._czmViewer.sceneGlobeClippingPolygonsId;
        for (let i = 0; i < clippingPolygonsID.length; i++) {
            const sceneObjectId = clippingPolygonsID[i];
            const sceneObject = ESSceneObject.getSceneObjById(sceneObjectId);
            if (!sceneObject) return;
            let czmPolygonClipping: CzmPolygonClipping | undefined = undefined;
            do {
                if (sceneObject instanceof ESExcavate) {
                    czmPolygonClipping = (_czmViewer.getCzmObject(sceneObject) as CzmESExcavate).czmPolygonClipping;
                    break;
                }
                if (sceneObject instanceof ESHole) {
                    czmPolygonClipping = (_czmViewer.getCzmObject(sceneObject.excavate) as CzmESExcavate).czmPolygonClipping;
                    break;
                }
            } while (false);
            if (!czmPolygonClipping) return;
            const event = this.dv(createNextAnimateFrameEvent(
                czmPolygonClipping.positionsChanged,
                czmPolygonClipping.reverseChanged,
                czmPolygonClipping.enabledChanged,
                czmPolygonClipping.showHelperChanged
            ))
            this.dv(new ObjResettingWithEvent(event, () => {
                if (!czmPolygonClipping) return;
                return new ClippingPolygonsIdResettingImpl(_czmViewer, czmPolygonClipping);
            }))
            this.d(() => this._czmViewer.sceneGlobeClippingPolygons = undefined);
        }
    }
}
class ClippingPolygonsIdResettingImpl extends Destroyable {
    constructor(private _czmViewer: ESCesiumViewer, changeSceneObject: CzmPolygonClipping) {
        super();
        const clippingPolygonsID = this._czmViewer.sceneGlobeClippingPolygonsId;
        const changeSceneObjectInverse = changeSceneObject.enabled ? changeSceneObject.reverse : undefined;
        if (clippingPolygonsID && clippingPolygonsID.length > 0) {
            const sceneGlobeClippingPolygons = {
                polygons: [],
                enabled: true,
                inverse: false
            } as CzmClippingPolygonCollectionJsonType;
            for (let i = 0; i < clippingPolygonsID.length; i++) {
                const sceneObjectId = clippingPolygonsID[i];
                const sceneObject = ESSceneObject.getSceneObjById(sceneObjectId);
                if (!sceneObject) return;
                let czmPolygonClipping: CzmPolygonClipping | undefined = undefined;
                do {
                    if (sceneObject instanceof ESExcavate) {
                        czmPolygonClipping = (_czmViewer.getCzmObject(sceneObject) as CzmESExcavate).czmPolygonClipping;
                        break;
                    }
                    if (sceneObject instanceof ESHole) {
                        czmPolygonClipping = (_czmViewer.getCzmObject(sceneObject.excavate) as CzmESExcavate).czmPolygonClipping;
                        break;
                    }
                } while (false);
                if (!czmPolygonClipping) return;
                if (czmPolygonClipping && czmPolygonClipping.positions && czmPolygonClipping.positions.length >= 3 && czmPolygonClipping.enabled) {
                    sceneGlobeClippingPolygons.polygons[i] = { positions: czmPolygonClipping.positions };
                    sceneGlobeClippingPolygons.inverse = changeSceneObjectInverse ?? czmPolygonClipping.reverse;
                }
            }
            this._czmViewer.sceneGlobeClippingPolygons = sceneGlobeClippingPolygons;
        }
    }
}
