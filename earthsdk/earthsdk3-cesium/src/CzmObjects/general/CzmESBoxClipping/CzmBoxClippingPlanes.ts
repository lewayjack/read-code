import * as Cesium from 'cesium';
import { ESJNativeNumber16 } from "earthsdk3";
import { CzmPolylinesPrimitive, PositionEditing } from '../../../CzmObjects';
import { ESCesiumViewer } from '../../../ESCesiumViewer';
import { CzmClippingPlaneCollectionJsonType } from '../../../ESJTypesCzm';
import { computeCzmModelMatrix, flyTo } from '../../../utils';
import { Destroyable, Listener, Event, react, track, reactArrayWithUndefined, reactArray, extendClassProps, ReactivePropsToNativePropsAndChanged, createNextAnimateFrameEvent, createGuid, SceneObjectKey } from 'xbsj-base';
function computeSkeleton(
    minSize: [number, number, number],
    maxSize: [number, number, number],
    finalMatrix: Cesium.Matrix4
) {
    const l = minSize;
    const b = maxSize;

    // lineSkeleton;
    const lp: [number, number, number][] = [
        [l[0], l[1], l[2]],
        [b[0], l[1], l[2]],
        [b[0], b[1], l[2]],
        [l[0], b[1], l[2]],
        [l[0], l[1], b[2]],
        [b[0], l[1], b[2]],
        [b[0], b[1], b[2]],
        [l[0], b[1], b[2]],
    ];
    const td = Cesium.Math.toDegrees;
    const wp: [number, number, number][] = lp.map(e => {
        const cartesian = Cesium.Matrix4.multiplyByPoint(finalMatrix, Cesium.Cartesian3.fromElements(...e), new Cesium.Cartesian3());
        const carto = Cesium.Cartographic.fromCartesian(cartesian);
        return [td(carto.longitude), td(carto.latitude), carto.height];
    });
    const polylinesPositions: [number, number, number][][] = [
        [wp[0], wp[1], wp[2], wp[3], wp[0]],
        [wp[4], wp[5], wp[6], wp[7], wp[4]],
        [wp[0], wp[4]],
        [wp[1], wp[5]],
        [wp[2], wp[6]],
        [wp[3], wp[7]],
    ];
    return polylinesPositions;
}

export class CzmBoxClippingPlanes extends Destroyable {
    private _id = this.disposeVar(react<string>(createGuid()));
    get id() { return this._id.value; }
    set id(value: string) { this._id.value = value; }
    get idChanged() { return this._id.changed; }

    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    static defaults = {
        position: [116.39, 39.9, 100] as [number, number, number],
    };

    private _computedClippingPlanes = this.disposeVar(react<CzmClippingPlaneCollectionJsonType | undefined>(undefined));
    get computedClippingPlanes() { return this._computedClippingPlanes.value; }
    set computedClippingPlanes(value: CzmClippingPlaneCollectionJsonType | undefined) { this._computedClippingPlanes.value = value; }
    get computedClippingPlanesChanged() { return this._computedClippingPlanes.changed; }

    private _sPositionEditing;
    get sPositionEditing() { return this._sPositionEditing; }

    private _polylines;
    get polylines() { return this._polylines; }

    constructor(czmViewer: ESCesiumViewer, id?: SceneObjectKey) {
        super();
        id && (this.id = id);
        this._sPositionEditing = this.disposeVar(new PositionEditing([this, 'position'], [this, 'positionEditing'], czmViewer));
        this._polylines = this.disposeVar(new CzmPolylinesPrimitive(czmViewer, id));
        this._polylines.arcType = 'NONE';

        // this.registerAttachedObjectForContainer((viewer) => {
        // const disposer = new Destroyable();
        // disposer.dispose(this.flyToEvent.disposableOn(duration => {
        this.ad(this.flyToEvent.disposableOn(duration => {
            if (!(czmViewer instanceof ESCesiumViewer)) return;
            if (!czmViewer.actived) return;
            if (!this.position) {
                console.warn(`CzmBoxClippingPlanes warning: 没有位置，无法飞入！`);
                return;
            }
            const l = this.minSize;
            const b = this.maxSize;
            const s = [b[0] - l[0], b[1] - l[1], b[2] - l[2]] as [number, number, number];
            const d = Math.sqrt(s[0] * s[0] + s[1] * s[1] + s[2] * s[2]);
            flyTo(czmViewer.viewer, this.position, d * 2, undefined, duration);
        }));
        // return disposer;
        // });

        // this.registerAttachedObjectForContainer((viewer) => {
        //     const disposer = new Destroyable();
        {
            const update = () => {
                if (!(czmViewer instanceof ESCesiumViewer)) return;
                czmViewer.sceneGlobeClippingPlanesId = this.applyOnTerrain && id || "";
                // viewer.sceneGlobeClippingPlanes = this.applyOnTerrain && this.computedClippingPlanes || undefined;
            }
            update();
            const event = this.disposeVar(createNextAnimateFrameEvent(this.applyOnTerrainChanged, this.computedClippingPlanesChanged));
            this.ad(event.disposableOn(update));
            this.ad(() => {
                if (!(czmViewer instanceof ESCesiumViewer)) return;
                if (czmViewer.sceneGlobeClippingPlanesId === id)
                    czmViewer.sceneGlobeClippingPlanes = undefined;
            })
        }
        //     return disposer;
        // });
        {
            const update = () => {
                const l = this.minSize;
                const b = this.maxSize;
                const s = [b[0] - l[0], b[1] - l[1], b[2] - l[2]] as [number, number, number];
                const rn = this.reverse ? -1 : 1;

                const matrixArray = [...this.modelMatrix] as ESJNativeNumber16;
                let polylinesPositions: [number, number, number][][] = [];
                do {
                    if (!this.position) break;

                    const posRotMatrix = computeCzmModelMatrix({
                        position: this.position,
                        rotation: this.rotation,
                    });
                    if (!posRotMatrix) break;

                    const nativeMatrix = Cesium.Matrix4.fromArray(this.modelMatrix);
                    const finalMatrix = Cesium.Matrix4.multiply(posRotMatrix, nativeMatrix, new Cesium.Matrix4());
                    Cesium.Matrix4.toArray(finalMatrix, matrixArray);

                    polylinesPositions = computeSkeleton(this.minSize, this.maxSize, finalMatrix);
                } while (false);
                this.polylines.positions = polylinesPositions;

                this._computedClippingPlanes.value = {
                    "planes": [
                        {
                            "normal": [-1 * rn, 0, 0],
                            "distance": (s[0] + l[0]) * rn,
                        },
                        {
                            "normal": [1 * rn, 0, 0],
                            "distance": -l[0] * rn,
                        },
                        {
                            "normal": [0, -1 * rn, 0],
                            "distance": (s[1] + l[1]) * rn,
                        },
                        {
                            "normal": [0, 1 * rn, 0],
                            "distance": -l[1] * rn,
                        },
                        {
                            "normal": [0, 0, -1 * rn],
                            "distance": (s[2] + l[2]) * rn,
                        },
                        {
                            "normal": [0, 0, 1 * rn],
                            "distance": -l[2] * rn,
                        },
                    ],
                    "enabled": this.enabled,
                    "modelMatrix": matrixArray,
                    "unionClippingRegions": !this.reverse, // unionClippingRegions的意思是被多个剖切面裁切后都能看到的部分才真正渲染，否则任意面裁切后能看到的部分都将始终能看得到！
                    "edgeColor": this.edgeColor,
                    "edgeWidth": this.edgeWidth,
                };
            }
            update();
            const event = this.disposeVar(createNextAnimateFrameEvent(
                this.enabledChanged,
                this.positionChanged,
                this.rotationChanged,
                this.modelMatrixChanged,
                this.reverseChanged,
                this.edgeColorChanged,
                this.edgeWidthChanged,
                this.minSizeChanged,
                this.maxSizeChanged,
            ));
            this.dispose(event.disposableOn(update));
        }

        {
            this.dispose(track([this.polylines, 'color'], [this, 'edgeColor']));
            this.dispose(track([this.polylines, 'width'], [this, 'edgeWidth']));
            this.dispose(track([this.polylines, 'show'], [this, 'showHelper']));
        }
    }
}

export namespace CzmBoxClippingPlanes {
    export const createDefaultProps = () => ({
        enabled: true,
        showHelper: true,
        applyOnTerrain: false,
        positionEditing: false,
        position: reactArrayWithUndefined<[number, number, number] | undefined>(undefined), // 经度纬度高度，度为单
        rotation: reactArray<[number, number, number]>([0, 0, 0]), // 偏航俯仰翻转，度为单位
        modelMatrix: reactArray<ESJNativeNumber16>([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
        reverse: false,
        edgeColor: reactArray<[number, number, number, number]>([1, 1, 1, 1]),
        edgeWidth: 2,
        minSize: reactArray<[number, number, number]>([-100, -100, -100]),
        maxSize: reactArray<[number, number, number]>([100, 100, 100]),
    });
}
extendClassProps(CzmBoxClippingPlanes.prototype, CzmBoxClippingPlanes.createDefaultProps);
export interface CzmBoxClippingPlanes extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof CzmBoxClippingPlanes.createDefaultProps>> { }
