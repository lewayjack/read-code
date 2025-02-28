import { createNextAnimateFrameEvent, Destroyable, ObjResettingWithEvent } from "xbsj-base";
import { ESCesiumViewer } from "../../../../ESCesiumViewer";
import { ESExcavate, ESHole, ESSceneObject } from "earthsdk3";
import { CzmClippingPolygonCollectionJsonType } from "../../../../ESJTypesCzm";
import { Czm3DTiles, CzmESExcavate, CzmPolygonClipping } from "../../../../CzmObjects";
export class ClippingPolygonsIdBind extends Destroyable {
    constructor(czmViewer: ESCesiumViewer, czm3DTiles: Czm3DTiles) {
        super();
        this.dv(new ObjResettingWithEvent(czm3DTiles.clippingPolygonsIdChanged, (newVal, oldVal) => {
            if (!newVal || newVal === oldVal || (newVal && newVal.length === 0)) return undefined;
            return new ClippingPolygonsIdResetting(czmViewer, czm3DTiles);
        }))
    }
}
class ClippingPolygonsIdResetting extends Destroyable {
    constructor(private _czmViewer: ESCesiumViewer, czm3DTiles: Czm3DTiles) {
        super();
        const clippingPolygonsID = czm3DTiles.clippingPolygonsId;
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
                return new ClippingPolygonsIdResettingImpl(_czmViewer, czmPolygonClipping, czm3DTiles);
            }))
            this.d(() => czm3DTiles.clippingPolygons = undefined);
        }
    }
}
class ClippingPolygonsIdResettingImpl extends Destroyable {
    constructor(private _czmViewer: ESCesiumViewer, changeSceneObject: CzmPolygonClipping, czm3DTiles: Czm3DTiles) {
        super();
        const clippingPolygonsID = czm3DTiles.clippingPolygonsId;
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
            czm3DTiles.clippingPolygons = sceneGlobeClippingPolygons;
        }
    }
}
