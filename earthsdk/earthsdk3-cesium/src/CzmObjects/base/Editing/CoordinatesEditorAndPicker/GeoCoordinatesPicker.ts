import { CzmPoint, GeoCoordinates } from "../../../../CzmObjects";
import { ESCesiumViewer } from "../../../../ESCesiumViewer";
import * as Cesium from 'cesium';
import { Destroyable, Event, extendClassProps, getEventFromPromise, ObjResettingWithEvent, react, reactArrayWithUndefined, ReactivePropsToNativePropsAndChanged } from "xbsj-base";
import { getSceneScaleForScreenPixelSize, pickPosition } from "../../../../utils";


export type GeoCoordinatesPickerPickingFuncType = ((pointerEvent: PointerEvent) => boolean);

export class GeoCoordinatesPicker extends Destroyable {

    private _overEvent = this.disposeVar(new Event());
    get overEvent() { return this._overEvent; }

    static defaultClickFilterFunc = (pointerEvent: PointerEvent) => {
        if (pointerEvent.button !== 0) {
            return false;
        }
        return true;
    };

    static defaultDbClickFilterFunc = GeoCoordinatesPicker.defaultClickFilterFunc;

    private _clickFilterFunc = this.disposeVar(react<GeoCoordinatesPickerPickingFuncType>(GeoCoordinatesPicker.defaultClickFilterFunc));
    get clickFilterFunc() { return this._clickFilterFunc.value; }
    set clickFilterFunc(value: GeoCoordinatesPickerPickingFuncType) { this._clickFilterFunc.value = value; }
    get clickFilterFuncChanged() { return this._clickFilterFunc.changed; }

    private _dbClickFilterFunc = this.disposeVar(react<GeoCoordinatesPickerPickingFuncType>(GeoCoordinatesPicker.defaultDbClickFilterFunc));
    get dbClickFilterFunc() { return this._dbClickFilterFunc.value; }
    set dbClickFilterFunc(value: GeoCoordinatesPickerPickingFuncType) { this._dbClickFilterFunc.value = value; }
    get dbClickFilterFuncChanged() { return this._dbClickFilterFunc.changed; }

    constructor(czmViewer: ESCesiumViewer) {
        super();
        const viewer = czmViewer.viewer;
        if (!viewer) return;
        // 创建主坐标轴和坐标点
        this._createMainCoordinates(czmViewer);
        this._createPoint(czmViewer);
        this.ad(new ObjResettingWithEvent(this.enabledChanged, () => {
            if (!this.enabled) return undefined;
            return new PickingProcessing(czmViewer, this);
        }))
    }
    private _createMainCoordinates(czmViewer: ESCesiumViewer,) {
        const coordinates = this.disposeVar(new GeoCoordinates(czmViewer));
        {
            const update = () => coordinates.show = this.enabled && !!this.position && this.showCoordinates;
            update();
            this.dispose(this.showCoordinatesChanged.disposableOn(update));
            this.dispose(this.enabledChanged.disposableOn(update));
            this.dispose(this.positionChanged.disposableOn(update));
        }

        const scene = czmViewer.viewer?.scene;
        if (!scene) throw new Error('scene is null');
        {
            // 根据相机视角控制坐标轴的缩放
            const centerCartesian = new Cesium.Cartesian3();
            let centerCartesianValid = false;
            const updateCenter = (position: [number, number, number] | undefined) => {
                centerCartesianValid = !!position;
                if (position) {
                    const tempPos = [...position] as [number, number, number];
                    czmViewer.editingHeightOffset && (tempPos[2] -= czmViewer.editingHeightOffset);
                    Cesium.Cartesian3.fromDegrees(...tempPos, undefined, centerCartesian);
                }
            };
            updateCenter(this.position);
            this.dispose(this.positionChanged.disposableOn(updateCenter));

            this.dispose(scene.preUpdate.addEventListener(() => {
                if (centerCartesianValid) {
                    const scale = getSceneScaleForScreenPixelSize(scene, centerCartesian, this.axisPixelSize);
                    if (scale !== undefined) {
                        coordinates.dimensions = [scale, scale, scale];
                    } else {
                        console.warn(`CzmGeoCoordinatesEditor warn: scale: ${scale ?? 'undefined'}`);
                    }
                }
            }));
        }

        {
            const updateProp = () => {
                if (this.position) {
                    const tempPos = [...this.position] as [number, number, number];
                    czmViewer.editingHeightOffset && (tempPos[2] -= czmViewer.editingHeightOffset);
                    coordinates.position = tempPos;
                }
            };
            updateProp();
            this.dispose(this.positionChanged.disposableOn(updateProp));
        }

        {
            const updateProp = () => {
                coordinates.heading = this.heading;
            };
            updateProp();
            this.dispose(this.headingChanged.disposableOn(updateProp));
        }
    }
    private _createPoint(czmViewer: ESCesiumViewer) {
        const point = this.disposeVar(new CzmPoint(czmViewer));

        point.pixelSize = 4;
        point.outlineColor = [0, 0, 0.8, 1];
        point.outlineWidth = 2;
        point.allowPicking = false;

        {
            const update = () => {
                if (this.position) {
                    const tempPos = [...this.position] as [number, number, number];
                    czmViewer.editingHeightOffset && (tempPos[2] -= czmViewer.editingHeightOffset);
                    point.position = tempPos;
                }
            }
            update();
            this.dispose(this.positionChanged.disposableOn(update));
        }

        {
            const update = () => point.show = this.enabled && !!this.position && this.showPoint;
            update();
            this.dispose(this.showPointChanged.disposableOn(update));
            this.dispose(this.enabledChanged.disposableOn(update));
            this.dispose(this.positionChanged.disposableOn(update));
        }

    }
}

export namespace GeoCoordinatesPicker {
    export const createDefaultProps = () => ({
        enabled: false,
        position: reactArrayWithUndefined<[number, number, number] | undefined>(undefined), // 经度纬度高度，度为单位
        heading: 0, // 偏航角，度为单位
        axisPixelSize: 100,
        axisSnapPixelSize: 5,
        virtualHeight: undefined as number | undefined,
        showCoordinates: false,
        showCircle: false,
        showPoint: true,
        clickEnabled: true,
        dbClickEnabled: false,
    });
}
extendClassProps(GeoCoordinatesPicker.prototype, GeoCoordinatesPicker.createDefaultProps);
export interface GeoCoordinatesPicker extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof GeoCoordinatesPicker.createDefaultProps>> { }

// 点击拾取
class PickingProcessing extends Destroyable {
    private _pickingPosition = this.disposeVar(new PickingPosition(this));
    get owner() { return this._owner; }

    get czmViewer() { return this._czmViewer; }

    constructor(private _czmViewer: ESCesiumViewer, private _owner: GeoCoordinatesPicker) {
        super();
        const czmViewer = this._czmViewer;
        const { viewer } = czmViewer;
        if (!viewer) return;
        this.dispose(this._pickingPosition.resultEvent.disposableOn(position => {
            if (!position) return;
            const tempPos = [...position] as [number, number, number];
            czmViewer.editingHeightOffset && (tempPos[2] += czmViewer.editingHeightOffset);
            this.owner.position = tempPos;
        }));

        const offFuncInner = czmViewer.pointerMoveEvent.don(pointerEvent => {
            pointerEvent.pointerEvent && this._pickingPosition.do(pointerEvent.pointerEvent as PointerEvent);
        });

        const offFunc = () => {
            offFuncInner();
            this._pickingPosition.reset();
        }

        this.dispose(offFunc);

        const overFunc = (pointerEvent: PointerEvent) => {
            _owner.overEvent.emit();
            _owner.enabled = false;
        };

        this.dispose(czmViewer.clickEvent.don((pointerEvent) => {
            if (!_owner.clickEnabled) return;
            if (pointerEvent.pointerEvent && _owner.clickFilterFunc && !_owner.clickFilterFunc(pointerEvent.pointerEvent as PointerEvent)) return;
            offFunc();
            overFunc(pointerEvent.pointerEvent as PointerEvent);
        }));

        this.dispose(czmViewer.dblclickEvent.don(pointerEvent => {
            if (!_owner.dbClickEnabled) return;
            if (pointerEvent.pointerEvent && _owner.dbClickFilterFunc && !_owner.dbClickFilterFunc(pointerEvent.pointerEvent as PointerEvent)) return;
            offFunc();
            overFunc(pointerEvent.pointerEvent as PointerEvent);
        }));
    }
}

class PickingPosition extends Destroyable {
    private _doings: PickingPositionDo[] = [];
    private _doingsInit = this.dispose(() => this.reset());
    get owner() { return this._owner; }

    private _resultEvent = this.disposeVar(new Event<[[number, number, number] | undefined]>());
    get resultEvent() { return this._resultEvent; }

    constructor(private _owner: PickingProcessing) {
        super();
    }

    do(pointerEvent: PointerEvent) {
        const doing = new PickingPositionDo(this, pointerEvent, position => {
            this._resultEvent.emit(position);
            // 执行完毕后，从数组中移除
            const deletedItems = this._doings.splice(0, this._doings.indexOf(doing) + 1);
            deletedItems.forEach(item => item.destroy());
        });
        this._doings.push(doing);
    }

    reset() {
        for (let doing of this._doings) {
            doing.destroy();
        }
        this._doings.length = 0;
    }
}

class PickingPositionDo extends Destroyable {
    constructor(private _owner: PickingPosition, pointerEvent: PointerEvent, resultFunc: (position: [number, number, number] | undefined) => void) {
        super();

        const { czmViewer } = this._owner.owner;
        const promise = pickPosition(czmViewer, pointerEvent, this._owner.owner.owner.virtualHeight);
        const [event, errorEvent] = getEventFromPromise(promise);
        // this.disposeVar(event);
        // this.disposeVar(errorEvent);
        this.dispose(event.disposableOn(resultFunc));
    }
}
