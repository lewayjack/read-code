import { ESSceneObject, PickedInfo, SceneObjectPickedInfo } from "earthsdk3";
import { Destroyable, Event, extendClassProps, Listener, reactArray, reactArrayWithUndefined, ReactivePropsToNativePropsAndChanged, track } from "xbsj-base";
// import { PositionEditing } from "../../EditingImpl/PositionEditing";
import { ESCesiumViewer } from "../../../../../ESCesiumViewer";
import { CzmTexture } from "../../../../../CzmObjects";
import { CustomPrimitiveForCircle } from "./CustomPrimitiveForCicle";
import { CircleCanvas } from "./CircleCanvas";
import { DebugAxis } from "./DebugAxis";

export class GeoRotatorCircle extends Destroyable {
    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    static defaults = {
        // 属性的类型若存在undefined的情况，这里配置为undefined时应该使用的默认值
        position: [116.39, 39.9, 100] as [number, number, number],
    }

    // 位置编辑
    // private _positionEditing = this.disposeVar(new PositionEditing([this, 'position'], [this, 'editing'], this._czmViewer));
    // get positionEditing() { return this._positionEditing; }

    private _czmTexture;
    get czmTexture() { return this._czmTexture; }

    private _customPrimitiveForCircle;
    get customPrimitiveForCircle() { return this._customPrimitiveForCircle; }

    private _circleCanvas;
    get circleCanvas() { return this._circleCanvas; }

    private _debugAxis;
    get debugAxis() { return this._debugAxis; }

    get czmViewer() { return this._czmViewer; }

    constructor(private _czmViewer: ESCesiumViewer) {
        super();
        const viewer = this.czmViewer.viewer;
        this._czmTexture = this.disposeVar(new CzmTexture(this._czmViewer))
        this.czmTexture.uri = ''; // 不能是空字符串，否则绘制创建白纹理！
        // this.dispose(() => this.czmTexture.destroy());
        this._circleCanvas = this.disposeVar(new CircleCanvas(this))
        this._customPrimitiveForCircle = this.disposeVar(new CustomPrimitiveForCircle(this))
        this._debugAxis = this.disposeVar(new DebugAxis(this))
        if (!viewer) return;
        this.dispose(track([this.customPrimitiveForCircle.customPrimitive, 'show'], [this, 'show']));

        this.dispose(this.flyToEvent.disposableOn(duration => {
            if (!this.czmViewer.actived) return;
            this.customPrimitiveForCircle.customPrimitive.flyTo(duration);
        }));
    }
}

export namespace GeoRotatorCircle {
    export const createDefaultProps = () => ({
        // 属性配置
        show: true,
        allowPicking: false,
        editing: false,
        position: reactArrayWithUndefined<[number, number, number]>(undefined),
        rotation: reactArray<[number, number, number]>([0, 0, 0]),
        selfRotation: reactArray<[number, number, number]>([0, 0, 0]),
        pixelSize: 300,
        color: reactArray<[number, number, number, number]>([1, 1, 1, 1]),
        circleRotation: 0,
        circleStartRotation: 0,
        circleEndRotation: 0,
        debug: false,
    });
}
extendClassProps(GeoRotatorCircle.prototype, GeoRotatorCircle.createDefaultProps);
export interface GeoRotatorCircle extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof GeoRotatorCircle.createDefaultProps>> { }
