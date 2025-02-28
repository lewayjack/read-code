import { PickedInfo } from "earthsdk3";
import { ESCesiumViewer } from "../../../../ESCesiumViewer";
import { createNextAnimateFrameEvent, Destroyable, Event, extendClassProps, Listener, reactArray, reactArrayWithUndefined, ReactivePropsToNativePropsAndChanged, reactJson, reactJsonWithUndefined, SceneObjectKey, track } from "xbsj-base";
import { CzmMaterialJsonType } from "../../../../ESJTypesCzm";
import { CzmRectanglePrimitive } from "./CzmRectanglePrimitive";
import { CzmRectangleGroundPrimitive } from "./CzmRectangleGroundPrimitive";
import { CzmRectangleOutlinePrimitive } from "./CzmRectangleOutlinePrimitive";
import { RectangleEditing } from "../../../../CzmObjects";

export class CzmRectangle extends Destroyable {
    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    static defaults = {
        material: { type: 'Color', color: [1, 1, 1, 0.5] } as CzmMaterialJsonType,
        rectangle: undefined,
        extrudedHeight: undefined,
    }

    constructor(czmViewer: ESCesiumViewer, id?: SceneObjectKey) {
        super();
        this.disposeVar(new RectangleEditing(this.heightReact, this.rectangleReact, [this, 'editing'], [this, 'pointEditing'], czmViewer));
        const viewer = czmViewer.viewer;
        if (!viewer) return;
        // 初始化
        const czmRectanglePrimitive = this.ad(new CzmRectanglePrimitive(czmViewer, id));
        const czmRectangleGroundPrimitive = this.ad(new CzmRectangleGroundPrimitive(czmViewer, id));
        const czmRectangleOutlinePrimitive = this.ad(new CzmRectangleOutlinePrimitive(czmViewer, id));

        {
            // 共有属性绑定
            this.dispose(track([czmRectanglePrimitive, 'allowPicking'], [this, 'allowPicking']));
            this.dispose(track([czmRectangleGroundPrimitive, 'allowPicking'], [this, 'allowPicking']));
        }
        {
            const createRectangle = () => {
                const polygonShow = this.show ?? true;
                const polygonGround = this.ground ?? false;
                const polygonOutline = this.outline ?? false;
                czmRectangleOutlinePrimitive.show = polygonShow && !polygonGround && polygonOutline; //显示多边形+不贴地才有外轮廓线
                czmRectanglePrimitive.show = polygonShow && !polygonGround;
                // 判断show
                if (!czmRectangleOutlinePrimitive.show) {
                    czmRectangleOutlinePrimitive.positions = undefined;
                } else {
                    czmRectangleOutlinePrimitive.positions = this.rectangle;
                }
                if (!czmRectanglePrimitive.show) {
                    czmRectanglePrimitive.positions = undefined;
                } else {
                    czmRectanglePrimitive.positions = this.rectangle;
                }

                czmRectangleOutlinePrimitive.rotation = czmRectanglePrimitive.rotation = this.rotation;
                czmRectanglePrimitive.material = this.material ?? CzmRectangle.defaults.material;
                czmRectanglePrimitive.stRotation = this.stRotation;
                czmRectangleOutlinePrimitive.extrudedHeight = czmRectanglePrimitive.extrudedHeight = this.extrudedHeight;
                czmRectangleOutlinePrimitive.height = czmRectanglePrimitive.height = this.height;
                czmRectangleOutlinePrimitive.color = this.outlineColor;
                czmRectangleOutlinePrimitive.translucent = this.outlineTranslucent;

                czmRectangleGroundPrimitive.show = polygonShow && polygonGround;
                // 判断show
                if (!czmRectangleGroundPrimitive.show) {
                    czmRectangleGroundPrimitive.positions = undefined;
                } else {
                    czmRectangleGroundPrimitive.positions = this.rectangle;
                }
                czmRectangleGroundPrimitive.rotation = this.rotation;
                czmRectangleGroundPrimitive.material = this.material ?? CzmRectangle.defaults.material;
                czmRectangleGroundPrimitive.stRotation = this.stRotation;
            }
            createRectangle()
            const createNextFrameEvent = this.disposeVar(createNextAnimateFrameEvent(
                this.showChanged,
                this.outlineChanged,
                this.heightChanged,
                this.extrudedHeightChanged,
                this.materialChanged,
                this.rectangleChanged,
                this.outlineColorChanged,
                this.stRotationChanged,
                this.rotationChanged,
                this.outlineTranslucentChanged,
                this.groundChanged
            ));
            this.dispose(createNextFrameEvent.disposableOn(() => {
                createRectangle();
            }));
            this.dispose(this.flyToEvent.disposableOn(duration => {
                if (!this.ground) {
                    czmRectanglePrimitive.flyTo(duration);
                } else {
                    czmRectangleGroundPrimitive.flyTo(duration);
                }
            }));
        }
    }
}

export namespace CzmRectangle {
    export const createDefaultProps = () => ({
        show: true,
        allowPicking: false,
        strokeGround: false,
        ground: false,
        outlineTranslucent: true,
        outline: false,
        outlineColor: reactArray<[number, number, number, number]>([1, 1, 1, 1]),
        height: 0,
        extrudedHeight: undefined as number | undefined,
        material: reactJsonWithUndefined<CzmMaterialJsonType | undefined>(undefined),
        rectangle: reactArrayWithUndefined<[number, number, number, number] | undefined>(undefined),
        rotation: 0,
        stRotation: 0,
        editing: false,
        pointEditing: false,
    });
}
extendClassProps(CzmRectangle.prototype, CzmRectangle.createDefaultProps);
export interface CzmRectangle extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof CzmRectangle.createDefaultProps>> { }
