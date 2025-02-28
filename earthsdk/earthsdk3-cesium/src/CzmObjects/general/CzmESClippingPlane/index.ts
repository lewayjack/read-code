import * as Cesium from 'cesium';
import { ES3DTileset, ESClippingPlane, ESJNativeNumber16, ESSceneObjectWithId } from "earthsdk3";
import { CzmESObjectWithLocation } from '../../../CzmObjects';
import { ESCesiumViewer } from '../../../ESCesiumViewer';
import { bindNorthRotation, computeCzmModelMatrix, flyWithPosition, getDirectionVectorFromRotation } from '../../../utils';
import { bind, createNextAnimateFrameEvent, Destroyable, ObjResettingWithEvent, reactArrayWithUndefined, track, Vector } from 'xbsj-base';
import { CzmPlane } from './CzmPlane';

export * from './CzmClippingPlanes';

class TilesIdResetting extends Destroyable {
    constructor(private _czmESClippingPlane: CzmESClippingPlane, private _eS3DTileset: ES3DTileset) {
        super();
        // if (!this._czmESClippingPlane.viewer) return;
        // const czm = this._czmESClippingPlane.viewer.getCzmObject(this._eS3DTileset) as CzmES3DTileset
        const id = this._czmESClippingPlane.czmPlane.id
        const ids: string[] = [id, ...this._eS3DTileset.clippingPlaneIds]
        this._eS3DTileset.clippingPlaneIds = ids

        this.dispose(() => {
            const ids: string[] = [...this._eS3DTileset.clippingPlaneIds]
            const id = this._czmESClippingPlane.czmPlane.id
            if (!ids.includes(id)) return;
            ids.splice(ids.indexOf(id), 1);
            this._eS3DTileset.clippingPlaneIds = ids;
        });
    }
}

class CzmViewerResetting extends Destroyable {
    constructor(private _czmESClippingPlane: CzmESClippingPlane) {
        super();
        if (!this._czmESClippingPlane.viewer) return;
        this._czmESClippingPlane.viewer.sceneGlobeClippingPlanesId = this._czmESClippingPlane.czmPlane.id
        const update = () => {
            if (!this._czmESClippingPlane.viewer) return;
            const matrix = computeCzmModelMatrix({
                position: this._czmESClippingPlane.sceneObject.position,
                // rotation: this._czmESClippingPlane.sceneObject.rotation
            })
            if (!matrix) return;
            const direction = getDirectionVectorFromRotation(this._czmESClippingPlane.sceneObject.rotation);
            this._czmESClippingPlane.viewer.sceneGlobeClippingPlanes = {
                "planes": [
                    {
                        "normal": direction,
                        "distance": 0
                    }
                ],
                "enabled": true,
                "modelMatrix": Cesium.Matrix4.toArray(matrix) as ESJNativeNumber16,
                "unionClippingRegions": false,
                "edgeColor": this._czmESClippingPlane.sceneObject.edgeColor,
                "edgeWidth": this._czmESClippingPlane.sceneObject.edgetWidth
            }
        }
        update();
        const event = this.dv(createNextAnimateFrameEvent(
            this._czmESClippingPlane.sceneObject.positionChanged,
            this._czmESClippingPlane.sceneObject.rotationChanged,
            this._czmESClippingPlane.sceneObject.edgeColorChanged,
            this._czmESClippingPlane.sceneObject.edgetWidthChanged,
        ));
        this.d(event.don(update));
        this.dispose(() => {
            if (!this._czmESClippingPlane.viewer) return;
            this._czmESClippingPlane.viewer.sceneGlobeClippingPlanesId = "";
            this._czmESClippingPlane.viewer.sceneGlobeClippingPlanes = undefined;
        })

    }
}

export class CzmESClippingPlane extends CzmESObjectWithLocation<ESClippingPlane> {
    static readonly type = this.register("ESCesiumViewer", ESClippingPlane.type, this);

    private _innerPositionReact = this.disposeVar(reactArrayWithUndefined<[number, number, number]>(undefined));

    private _czmPlane;
    get czmPlane() { return this._czmPlane; }

    private _tilesSceneObjectWithId;
    get tilesSceneObjectWithId() { return this._tilesSceneObjectWithId; }

    constructor(sceneObject: ESClippingPlane, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        this._czmPlane = this.disposeVar(new CzmPlane(czmViewer, sceneObject.id))
        this._tilesSceneObjectWithId = this.disposeVar(new ESSceneObjectWithId());
        this.dispose(track([this._tilesSceneObjectWithId, 'id'], [this.sceneObject, 'targetID']));
        const viewer = czmViewer.viewer;
        if (!viewer) return;
        const czmPlane = this._czmPlane;
        {
            this.sceneObject.viewerAttached.don(() => {
                const event = this.disposeVar(createNextAnimateFrameEvent(this.tilesSceneObjectWithId.sceneObjectChanged, this.sceneObject.showChanged, this.czmPlane.showChanged))
                this.disposeVar(new ObjResettingWithEvent(event, () => {
                    const { sceneObject, id } = this.tilesSceneObjectWithId;
                    if (!this.sceneObject.show || !this.czmPlane.show) return;
                    if (id === "") {
                        return new CzmViewerResetting(this);
                    } else {
                        if (!sceneObject) return undefined;
                        if (!(sceneObject instanceof ES3DTileset)) return undefined;
                        return new TilesIdResetting(this, sceneObject as ES3DTileset);
                    }
                }));
            });
        }

        this.dispose(track([czmPlane, 'show'], [sceneObject, 'show']));
        this.dispose(bind([czmPlane, 'position'], [sceneObject, 'position']));
        this.dispose(bindNorthRotation([czmPlane, 'rotation'], [sceneObject, 'rotation']));

        this.dispose(track([czmPlane, 'showArrow'], [sceneObject, 'showArrow']));
        this.dispose(track([czmPlane, 'color'], [sceneObject, 'edgeColor']));
        this.dispose(track([czmPlane, 'width'], [sceneObject, 'edgetWidth']));

        {
            const update = () => {
                czmPlane.minSize = [-sceneObject.width / 2, -sceneObject.height / 2]
                czmPlane.maxSize = [sceneObject.width / 2, sceneObject.height / 2]
            }
            update()
            const updateEvent = this.disposeVar(createNextAnimateFrameEvent(sceneObject.widthChanged, sceneObject.heightChanged))
            this.dispose(updateEvent.disposableOn(update))
        }

        // 为了使编辑生效，需要监听sceneObject的position和_innerPositionReact,
        // 如果是在[0,0,0]点的话，就把_innerPositionReact设置为undefined,就能编辑了
        {
            const updated = () => {
                if (Vector.equals(sceneObject.position, [0, 0, 0])) {
                    this._innerPositionReact.value = undefined;
                } else {
                    this._innerPositionReact.value = sceneObject.position;
                }
            }
            updated();
            this.dispose(this.sceneObject.positionChanged.disposableOn(updated));
        }
        {
            const updated = () => {
                if (this._innerPositionReact.value == undefined) {
                    sceneObject.position = [0, 0, 0];
                }
                else {
                    sceneObject.position = this._innerPositionReact.value;
                }
            }
            this.dispose(this._innerPositionReact.changed.disposableOn(updated));
        }
    }


    override flyTo(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            return super.flyTo(duration, id);
        } else {
            if (sceneObject.position) {
                flyWithPosition(czmViewer, sceneObject, id, sceneObject.position, Math.max(sceneObject.width, sceneObject.height), duration, true);
                return true;
            }
            return false;
        }
    }
}
