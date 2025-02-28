import { CzmModelPrimitive, CzmPoint, PositionEditing } from "../../../../../CzmObjects";
import { ESCesiumViewer } from "../../../../../ESCesiumViewer";
import { computeCzmModelMatrix, positionToCartesian } from "../../../../../utils";
import * as Cesium from 'cesium';
import { Destroyable, Event, extendClassProps, Listener, ObjResettingWithEvent, react, reactArray, reactArrayWithUndefined, ReactivePropsToNativePropsAndChanged, track } from "xbsj-base";
import { ESJNativeNumber16 } from "earthsdk3";
import { RotatorPlaneType } from "./RotatorPlaneType";
import { HeadingPlane } from "./HeadingPlane";
import { PitchPlane } from "./PitchPlane";
import { RollPlane } from "./RollPlane";
import { BasePlane } from "./BasePlane";
import { RotatorRunning } from "./RotatorRunning";
import { GeoRotatorCircleWrapper } from "./GeoRotatorCircleWrapper";

export class GeoRotator extends Destroyable {
    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    private _sPositionEditing;
    get sPositionEditing() { return this._sPositionEditing; }

    static defaults = {
        position: [116.39, 39.9, 0] as [number, number, number], // 经度纬度高度，度为单位
    };

    private _pointer;
    get pointer() { return this._pointer; }

    private _cameraModel;
    get cameraModel() { return this._cameraModel; }

    private _hoveredPlaneType = this.disposeVar(react<RotatorPlaneType>('none'));
    get hoveredPlaneType() { return this._hoveredPlaneType.value; }
    set hoveredPlaneType(value: RotatorPlaneType) { this._hoveredPlaneType.value = value; }
    get hoveredPlaneTypeChanged() { return this._hoveredPlaneType.changed; }

    private _movingPlaneType = this.disposeVar(react<RotatorPlaneType>('none'));
    get movingPlaneType() { return this._movingPlaneType.value; }
    set movingPlaneType(value: RotatorPlaneType) { this._movingPlaneType.value = value; }
    get movingPlaneTypeChanged() { return this._movingPlaneType.changed; }


    static rotationNum = { heading: 0, pitch: 1, roll: 2 };

    static rotationFuncs = {
        heading: ([heading, pitch, roll]: [number, number, number]): [number, number, number] => [0, 0, 0],
        pitch: ([heading, pitch, roll]: [number, number, number]): [number, number, number] => [heading, 0, -90],
        roll: ([heading, pitch, roll]: [number, number, number]): [number, number, number] => [heading, pitch + 90, 0],
    };

    private _circles;
    get circles() { return this._circles; }

    private _cartesian = undefined as Cesium.Cartesian3 | undefined;
    get cartesian() { return this._cartesian; }
    private _cartesianInit = (() => {
        const update = () => {
            this._cartesian = this.position && positionToCartesian(this.position) || undefined;
        };
        update();
        this.dispose(this.positionChanged.disposableOn(update));
    })();

    private _planes = {
        heading: this.disposeVar(new HeadingPlane(this)),
        pitch: this.disposeVar(new PitchPlane(this)),
        roll: this.disposeVar(new RollPlane(this)),
    }

    getPlane(type: Exclude<RotatorPlaneType, 'none'>): BasePlane {
        // @ts-ignore
        if (type === 'none') throw new Error('Invalid plane type: none');
        return this._planes[type];
    }

    private _rotatorRunningResetting = this.disposeVar(new ObjResettingWithEvent(this.enabledChanged, () => {
        if (!this.enabled) return undefined;
        if (!this.position) return undefined;
        return new RotatorRunning(this);
    }));
    get rotatorRunningResetting() { return this._rotatorRunningResetting; }
    get czmViewer() { return this._czmViewer; }
    constructor(private _czmViewer: ESCesiumViewer) {
        super();
        this._circles = {
            heading: this.disposeVar(new GeoRotatorCircleWrapper(this, 'heading')),
            pitch: this.disposeVar(new GeoRotatorCircleWrapper(this, 'pitch')),
            roll: this.disposeVar(new GeoRotatorCircleWrapper(this, 'roll')),
        };
        const czmViewer = this._czmViewer;
        const viewer = czmViewer.viewer;
        if (!viewer) return;
        this._sPositionEditing = this.disposeVar(new PositionEditing([this, 'position'], [this, 'positionEditing'], _czmViewer));
        this._pointer = this.disposeVar(new CzmPoint(czmViewer));
        this._cameraModel = this.disposeVar(new CzmModelPrimitive(czmViewer));
        if (this.cameraModel) {
            this.cameraModel.url = '${earthsdk3-assets-script-dir}/assets/glb/camera1/camera1.gltf';
            this.cameraModel.localRotation = [90, 0, 0];
            this.cameraModel.allowPicking = false;
            this.cameraModel.opaquePass = 'OVERLAY';

            this.dispose(track([this.cameraModel, 'pixelSize'], [this, 'pixelSize'], (v: number) => v * .1));
            this.dispose(track([this.cameraModel, 'position'], [this, 'position']));
            this.dispose(track([this.cameraModel, 'rotation'], [this, 'rotation']));

            {
                const update = () => {
                    const rm = computeCzmModelMatrix({
                        rotation: this.selfRotation,
                    });
                    if (!rm) throw new Error(`!rm`);
                    if (this.cameraModel)
                        this.cameraModel.localModelMatrix = Cesium.Matrix4.toArray(rm) as ESJNativeNumber16;
                }
                update();
                this.dispose(this.selfRotationChanged.disposableOn(update));
            }
            {
                const update = () => {
                    this.circles.heading.circle.show = this.enabled;
                    this.circles.pitch.circle.show = this.enabled;
                    this.circles.roll.circle.show = this.enabled;
                    if (this.cameraModel)
                        this.cameraModel.show = this.enabled && this.showHelper;
                };
                update();
                this.dispose(this.enabledChanged.disposableOn(update));
                this.dispose(this.showHelperChanged.disposableOn(update));
            }
        }
    }
}

export namespace GeoRotator {
    export const createDefaultProps = () => ({
        enabled: false,
        position: reactArrayWithUndefined<[number, number, number] | undefined>(undefined), // 经度纬度高度，度为单位
        positionEditing: false,
        rotation: reactArray<[number, number, number]>([0, 0, 0]),
        selfRotation: reactArray<[number, number, number]>([0, 0, 0]),
        pixelSize: 300,
        showHelper: true,
        debug: false,
    });
}
extendClassProps(GeoRotator.prototype, GeoRotator.createDefaultProps);
export interface GeoRotator extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof GeoRotator.createDefaultProps>> { }
