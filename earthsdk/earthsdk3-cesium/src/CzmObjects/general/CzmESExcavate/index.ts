import { ES3DTileset, ESExcavate, ESSceneObject, ESSceneObjectWithId } from "earthsdk3";
import { bind, createNextAnimateFrameEvent, Destroyable, ObjResettingWithEvent, track } from "xbsj-base";
import { CzmESGeoPolygon } from "../CzmESGeoPolygon";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { CzmPolygonClipping } from "./CzmPolygonClipping";
import { flyWithPositions } from "../../../utils";

export * from './CzmPolygonClipping';

class TilesIdResetting extends Destroyable {
    constructor(private _czmESExcavate: CzmESExcavate, private _eS3DTileset: ES3DTileset) {
        super();
        // 清除找不到的ES对象
        for (let i = 0; i < this._eS3DTileset.excavateId.length; i++) {
            const element = this._eS3DTileset.excavateId[i];
            if (!ESSceneObject.getSceneObjById(element))
                this._eS3DTileset.excavateId.splice(i, 1)
        }
        this._eS3DTileset.excavateId = [
            ...this._eS3DTileset.excavateId,
            this._czmESExcavate.czmPolygonClipping.id
        ]
        this.dispose(() => {
            this._eS3DTileset.excavateId = [
                ...this._eS3DTileset.excavateId.filter(id => id !== this._czmESExcavate.czmPolygonClipping.id
                )
            ]
        })

    }
}

class CzmViewerResetting extends Destroyable {
    constructor(private _czmESExcavate: CzmESExcavate) {
        super();
        if (!this._czmESExcavate.viewer) return;
        // 清除找不到的ES对象
        for (let i = 0; i < this._czmESExcavate.viewer.sceneGlobeClippingPolygonsId.length; i++) {
            const element = this._czmESExcavate.viewer.sceneGlobeClippingPolygonsId[i];
            if (!ESSceneObject.getSceneObjById(element))
                this._czmESExcavate.viewer.sceneGlobeClippingPolygonsId.splice(i, 1)
        }
        this._czmESExcavate.viewer.sceneGlobeClippingPolygonsId = [
            ...this._czmESExcavate.viewer.sceneGlobeClippingPolygonsId,
            this._czmESExcavate.czmPolygonClipping.id
        ]
        this.dispose(() => {
            if (!this._czmESExcavate.viewer) return;
            this._czmESExcavate.viewer.sceneGlobeClippingPolygonsId = [
                ...this._czmESExcavate.viewer.sceneGlobeClippingPolygonsId.filter(id => id !== this._czmESExcavate.czmPolygonClipping.id
                )
            ]

        })
    }
}

export class CzmESExcavate extends CzmESGeoPolygon<ESExcavate> {
    static override readonly type = this.register("ESCesiumViewer", ESExcavate.type, this);

    private _czmPolygonClipping;
    get czmPolygonClipping() { return this._czmPolygonClipping; }

    private _tilesSceneObjectWithId;
    get tilesSceneObjectWithId() { return this._tilesSceneObjectWithId; }

    constructor(sceneObject: ESExcavate, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        this._czmPolygonClipping = this.ad(new CzmPolygonClipping(czmViewer, sceneObject.id));
        this._tilesSceneObjectWithId = this.disposeVar(new ESSceneObjectWithId());
        this.dispose(track([this._tilesSceneObjectWithId, 'id'], [this.sceneObject, 'targetID']));
        const event = this.disposeVar(createNextAnimateFrameEvent(this.tilesSceneObjectWithId.sceneObjectChanged, this.sceneObject.showChanged))

        const viewer = czmViewer.viewer;
        if (!viewer) return;
        const czmPolygonClipping = this._czmPolygonClipping;
        czmPolygonClipping.showHelper = false;
        this.dispose(bind([czmPolygonClipping, 'positions'], [sceneObject, 'points']));
        this.dispose(track([czmPolygonClipping, 'allowPicking'], [sceneObject, 'allowPicking']));
        {
            const update = () => {
                czmPolygonClipping.reverse = !(sceneObject.mode === "in");
            }
            update()
            this.dispose(sceneObject.modeChanged.disposableOn(update))
        }
        {
            this.sceneObject.viewerAttached.don(() => {
                const event = this.disposeVar(createNextAnimateFrameEvent(this.tilesSceneObjectWithId.sceneObjectChanged, this.sceneObject.showChanged))
                this.disposeVar(new ObjResettingWithEvent(event, () => {
                    const { sceneObject, id } = this.tilesSceneObjectWithId;
                    if (!this.sceneObject.show) return undefined;
                    if (id === "") {
                        return new CzmViewerResetting(this);
                    } else {
                        if (!sceneObject) return undefined;
                        if (!(sceneObject instanceof ES3DTileset)) return undefined;
                        return new TilesIdResetting(this, sceneObject as ES3DTileset);
                    }
                }));
            })
        }
    }
    override flyTo(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, czmPolygonClipping } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            return super.flyTo(duration, id);
        } else {
            if (czmPolygonClipping.positions) {
                flyWithPositions(czmViewer, sceneObject, id, czmPolygonClipping.positions, duration);
                return true;
            }
            return false;
        }
    }
}
