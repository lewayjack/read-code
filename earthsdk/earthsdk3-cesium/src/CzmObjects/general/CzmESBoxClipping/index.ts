import { ES3DTileset, ESBoxClipping, ESSceneObjectWithId } from "earthsdk3";
import { CzmESObjectWithLocation } from "../../../CzmObjects";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { flyWithPosition } from "../../../utils";
import { bind, createNextAnimateFrameEvent, Destroyable, ObjResettingWithEvent, track } from "xbsj-base";
import { CzmBoxClippingPlanes } from "./CzmBoxClippingPlanes";

class TilesIdResetting extends Destroyable {
    constructor(private _czmESBoxClippingPlanes: CzmESBoxClipping, private _eS3DTileset: ES3DTileset) {
        super();
        const id = this._czmESBoxClippingPlanes.czmBoxClippingPlanes.id
        this._eS3DTileset.clippingPlaneId = id;
        this.dispose(() => { this._eS3DTileset.clippingPlaneId = ''; });
    }
}
export class CzmESBoxClipping extends CzmESObjectWithLocation<ESBoxClipping> {
    static readonly type = this.register("ESCesiumViewer", ESBoxClipping.type, this);
    // private _czmBoxClippingPlanes = this.disposeVar(new CzmBoxClippingPlanes());
    private _czmBoxClippingPlanes;
    get czmBoxClippingPlanes() { return this._czmBoxClippingPlanes; }

    private _tilesSceneObjectWithId;
    get tilesSceneObjectWithId() { return this._tilesSceneObjectWithId; }

    constructor(sceneObject: ESBoxClipping, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        this._tilesSceneObjectWithId = this.disposeVar(new ESSceneObjectWithId());
        this._czmBoxClippingPlanes = this.ad(new CzmBoxClippingPlanes(czmViewer, sceneObject.id))
        this.dispose(track([this._tilesSceneObjectWithId, 'id'], [this.sceneObject, 'targetID']))
        this.sceneObject.viewerAttached.don(() => {
            const event = this.disposeVar(createNextAnimateFrameEvent(this.tilesSceneObjectWithId.sceneObjectChanged, this.sceneObject.showChanged, this.czmBoxClippingPlanes.enabledChanged))
            this.disposeVar(new ObjResettingWithEvent(event, () => {
                const { sceneObject } = this.tilesSceneObjectWithId;
                if (!sceneObject) return undefined;
                if (!(sceneObject instanceof ES3DTileset)) return undefined;
                if (!this.sceneObject.show) return;
                return new TilesIdResetting(this, sceneObject as ES3DTileset);
            }));
        });
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        const { czmBoxClippingPlanes } = this;

        {//show
            const updateShow = () => {
                czmBoxClippingPlanes.enabled = sceneObject.show;
                czmBoxClippingPlanes.showHelper = sceneObject.show;
            }
            updateShow()
            this.dispose(sceneObject.showChanged.don(updateShow))
        }
        {//反转
            const update = () => {
                czmBoxClippingPlanes.reverse = !sceneObject.reverse;
            }
            update()
            this.dispose(sceneObject.reverseChanged.don(update))
        }
        {//applyOnTerrain根据targetID判断
            const update = () => {
                if (sceneObject.targetID) {
                    czmBoxClippingPlanes.applyOnTerrain = false;
                } else {
                    czmBoxClippingPlanes.applyOnTerrain = true;
                }
            }
            update()
            this.dispose(sceneObject.targetIDChanged.don(update))
        }
        {//size
            const update = () => {
                const [x, y, z] = sceneObject.size;
                czmBoxClippingPlanes.minSize = [-0.5 * x, -0.5 * y, -0.5 * z];
                czmBoxClippingPlanes.maxSize = [0.5 * x, 0.5 * y, 0.5 * z];
            }
            update()
            this.dispose(sceneObject.sizeChanged.don(update))
        }

        this.dispose(bind([czmBoxClippingPlanes, 'position'], [sceneObject, 'position']));
        this.dispose(bind([czmBoxClippingPlanes, 'rotation'], [sceneObject, 'rotation']));
        this.dispose(track([czmBoxClippingPlanes, 'edgeColor'], [sceneObject, 'edgeColor']));
        this.dispose(track([czmBoxClippingPlanes, 'edgeWidth'], [sceneObject, 'edgeWidth']));
    }
    override flyTo(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer } = this;
        if (!czmViewer.actived || !czmViewer.viewer) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            return super.flyTo(duration, id);
        } else {
            if (sceneObject.position) {
                flyWithPosition(czmViewer, sceneObject, id, sceneObject.position, Math.max(...sceneObject.size), duration, true);
                return true;
            }
            return false;
        }
    }
}
