import { ESClippingPlane, ESJNativeNumber16, ESSceneObjectWithId, getMinMaxCorner } from "earthsdk3";
import { computeCzmModelMatrix } from "../../../utils";
import { createNextAnimateFrameEvent, Destroyable, Listener, react, Event, ObjResettingWithEvent, reactArray, extendClassProps, ReactivePropsToNativePropsAndChanged, reactArrayWithUndefined, track, Vector, reactJson, createGuid, SceneObjectKey } from "xbsj-base";
import * as Cesium from 'cesium';
import { CzmClippingPlaneCollectionJsonType, CzmClippingPlaneJsonType } from "../../../ESJTypesCzm";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { CzmPlane } from "./CzmPlane";
import { CzmESClippingPlane } from ".";

class PlanesResetting extends Destroyable {
    private _centerMatrix = this.disposeVar(react<Cesium.Matrix4 | undefined>(undefined));
    get centerMatrix() { return this._centerMatrix.value; }
    set centerMatrix(value: Cesium.Matrix4 | undefined) { this._centerMatrix.value = value; }
    get centerMatrixChanged() { return this._centerMatrix.changed; }

    private _inverseCenterMatrix = this.disposeVar(react<Cesium.Matrix4 | undefined>(undefined));
    get inverseCenterMatrix() { return this._inverseCenterMatrix.value; }
    set inverseCenterMatrix(value: Cesium.Matrix4 | undefined) { this._inverseCenterMatrix.value = value; }
    get inverseCenterMatrixChanged() { return this._inverseCenterMatrix.changed; }

    private _czmPlaneWrappers;
    get czmPlaneWrappers() { return this._czmPlaneWrappers; }

    private _czmPlaneWrappersChanged = this.disposeVar(createNextAnimateFrameEvent());
    get czmPlaneWrappersChanged() { return this._czmPlaneWrappersChanged; }

    private _computedPlanesChanged = this.disposeVar(createNextAnimateFrameEvent());
    get computedPlanesChanged() { return this._computedPlanesChanged; }

    get czmClippingPlanes() { return this._czmClippingPlanes; }

    constructor(czmViewer: ESCesiumViewer, private _czmClippingPlanes: CzmClippingPlanes, private _planeIds: string[]) {
        super();
        this._czmPlaneWrappers = (this._planeIds.map(e => this.disposeVar(new CzmPlaneWrapper(czmViewer, this, e))));
        {
            const update = () => {
                let centerMatrix = undefined;
                let inverseCenterMatrix = undefined;

                do {
                    const enabledPlanes = this._czmPlaneWrappers.filter(e => e.position && e.rotation);
                    if (enabledPlanes.length === 0) break;

                    const positions = enabledPlanes.map(e => e.position as [number, number, number]);
                    const result = getMinMaxCorner(positions);

                    centerMatrix = computeCzmModelMatrix({ position: result.center });
                    if (!centerMatrix) break;

                    inverseCenterMatrix = Cesium.Matrix4.inverseTransformation(centerMatrix, new Cesium.Matrix4());
                } while (false);

                this.centerMatrix = centerMatrix;
                this.inverseCenterMatrix = inverseCenterMatrix;
            };
            update();
            this.dispose(this.czmPlaneWrappersChanged.disposableOn(update));
        }

        {
            const update = () => {
                if (!this.centerMatrix) {
                    this._czmClippingPlanes.computedClippingPlanes = undefined;
                    return;
                }

                const modelMatrix = Cesium.Matrix4.toArray(this.centerMatrix) as ESJNativeNumber16;
                const planes = this._czmPlaneWrappers.filter(e => !!e.computedPlane).map(e => e.computedPlane) as CzmClippingPlaneJsonType[];

                this._czmClippingPlanes.computedClippingPlanes = {
                    "planes": planes,
                    "enabled": this._czmClippingPlanes.enabled,
                    "modelMatrix": modelMatrix,
                    // unionClippingRegions的意思是被多个剖切面裁切后都能看到的部分才真正渲染，否则任意面裁切后能看到的部分都将始终能看得到！
                    "unionClippingRegions": this._czmClippingPlanes.unionClippingRegions,
                    "edgeColor": this._czmClippingPlanes.edgeColor,
                    "edgeWidth": this._czmClippingPlanes.edgeWidth,
                };
            };
            update();
            const event = this.disposeVar(createNextAnimateFrameEvent(
                this._czmClippingPlanes.enabledChanged,
                this.centerMatrixChanged,
                this.inverseCenterMatrixChanged,
                this.computedPlanesChanged,
                this._czmClippingPlanes.unionClippingRegionsChanged,
                this._czmClippingPlanes.edgeColorChanged,
                this._czmClippingPlanes.edgeWidthChanged,
            ));
            this.dispose(event.disposableOn(update));
        }
    }
}

class SceneObjectPropWatching extends Destroyable {
    constructor(private _czmPlaneWrapper: CzmPlaneWrapper, private _czmPlane: CzmPlane) {
        super();

        this._czmPlaneWrapper.position = this._czmPlane.position;
        this.dispose(() => this._czmPlaneWrapper.position = undefined);
        this.dispose(track([this._czmPlaneWrapper, 'position'], [this._czmPlane, 'position']));

        this._czmPlaneWrapper.rotation = this._czmPlane.rotation;
        this.dispose(() => this._czmPlaneWrapper.rotation = [0, 0, 0]);
        this.dispose(track([this._czmPlaneWrapper, 'rotation'], [this._czmPlane, 'rotation']));
    }
}

class CzmPlaneWrapper extends Destroyable {
    private _sowi;
    get sowi() { return this._sowi; }

    private _position = this.disposeVar(reactArrayWithUndefined<[number, number, number]>(undefined));
    get position() { return this._position.value; }
    set position(value: [number, number, number] | undefined) { this._position.value = value; }
    get positionChanged() { return this._position.changed; }

    private _rotation = this.disposeVar(reactArray<[number, number, number]>([0, 0, 0]));
    get rotation() { return this._rotation.value; }
    set rotation(value: [number, number, number]) { this._rotation.value = value; }
    get rotationChanged() { return this._rotation.changed; }

    private _computedPlane = this.disposeVar(reactJson<{ normal: [number, number, number]; distance: number } | undefined>(undefined));
    get computedPlane() { return this._computedPlane.value; }
    set computedPlane(value: { normal: [number, number, number]; distance: number } | undefined) { this._computedPlane.value = value; }
    get computedPlaneChanged() { return this._computedPlane.changed; }

    constructor(czmViewer: ESCesiumViewer, private _planesResetting: PlanesResetting, private _planeId: string) {
        super();
        this._sowi = this.disposeVar(new ESSceneObjectWithId());
        this._sowi.id = this._planeId;
        this.disposeVar(new ObjResettingWithEvent(this.sowi.sceneObjectChanged, () => {
            const { sceneObject } = this.sowi;
            if (!sceneObject) return undefined;
            let czmPlane: CzmPlane | undefined = undefined;
            do {
                const czmSceneObject = czmViewer.getCzmObject(sceneObject);
                if (sceneObject instanceof ESClippingPlane) {
                    czmPlane = (czmSceneObject as unknown as CzmESClippingPlane).czmPlane;
                }
            } while (false);
            if (!czmPlane) return undefined;
            if (!(czmPlane instanceof CzmPlane)) return undefined;
            return new SceneObjectPropWatching(this, czmPlane);
        }));
        this.dispose(this.positionChanged.disposableOn(() => this._planesResetting.czmPlaneWrappersChanged.next()));
        this.dispose(this.rotationChanged.disposableOn(() => this._planesResetting.czmPlaneWrappersChanged.next()));

        {
            const update = () => {
                let computedPlane = undefined;
                do {
                    const { inverseCenterMatrix } = this._planesResetting;
                    if (!inverseCenterMatrix) break;
                    const { position, rotation } = this;
                    if (!position) break;
                    const matrix = computeCzmModelMatrix({ position, rotation });
                    if (!matrix) break;

                    const relativeMatrix = Cesium.Matrix4.multiply(inverseCenterMatrix, matrix, new Cesium.Matrix4());
                    const rm = relativeMatrix;
                    const direction = new Cesium.Cartesian3(rm[4], rm[5], rm[6]);
                    const origin = new Cesium.Cartesian3(rm[12], rm[13], rm[14]);
                    Cesium.Cartesian3.normalize(direction, direction);
                    let distance = -Cesium.Cartesian3.dot(direction, origin);
                    const normal = [direction.x, direction.y, direction.z] as [number, number, number];
                    if (this._planesResetting.czmClippingPlanes.reverseNormal) {
                        Vector.negate(normal, normal);
                        distance = -distance;
                    }
                    computedPlane = { normal, distance };
                } while (false);

                this.computedPlane = computedPlane;
            };
            update();
            const event = this.disposeVar(createNextAnimateFrameEvent(
                this._planesResetting.inverseCenterMatrixChanged,
                this.positionChanged,
                this.rotationChanged,
                this._planesResetting.czmClippingPlanes.reverseNormalChanged,
            ));
            this.dispose(event.disposableOn(update));
        }

        this.dispose(this.computedPlaneChanged.disposableOn(() => this._planesResetting.computedPlanesChanged.next()));
    }
}

export class CzmClippingPlanes extends Destroyable {
    private _id = this.disposeVar(react<SceneObjectKey>(createGuid()));
    get id() { return this._id.value; }
    set id(value: SceneObjectKey) { this._id.value = value; }
    get idChanged() { return this._id.changed; }

    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    private _computedClippingPlanes = this.disposeVar(react<CzmClippingPlaneCollectionJsonType | undefined>(undefined));
    get computedClippingPlanes() { return this._computedClippingPlanes.value; }
    set computedClippingPlanes(value: CzmClippingPlaneCollectionJsonType | undefined) { this._computedClippingPlanes.value = value; }
    get computedClippingPlanesChanged() { return this._computedClippingPlanes.changed; }
    constructor(czmViewer: ESCesiumViewer, id?: SceneObjectKey) {
        super();
        id && (this.id = id);
        this.disposeVar(new ObjResettingWithEvent(this.planeIdsChanged, () => new PlanesResetting(czmViewer, this, this.planeIds)));
    }
}

export namespace CzmClippingPlanes {
    export const createDefaultProps = () => ({
        // 属性配置
        enabled: true,
        planeIds: reactArray<string[]>([]),
        reverseNormal: false,
        unionClippingRegions: true,
        edgeColor: reactArray<[number, number, number, number]>([1, 1, 1, 1]),
        edgeWidth: 2,
    });
}
extendClassProps(CzmClippingPlanes.prototype, CzmClippingPlanes.createDefaultProps);
export interface CzmClippingPlanes extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof CzmClippingPlanes.createDefaultProps>> { }
