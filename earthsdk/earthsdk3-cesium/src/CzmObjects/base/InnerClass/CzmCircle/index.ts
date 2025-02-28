import { ESCesiumViewer } from "../../../../ESCesiumViewer";
import { createNextAnimateFrameEvent, Destroyable, Event, extendClassProps, Listener, react, reactArray, reactArrayWithUndefined, ReactivePropsToNativePropsAndChanged, reactJson, reactJsonWithUndefined, SceneObjectKey, track } from "xbsj-base";
import { CzmMaterialJsonType } from "../../../../ESJTypesCzm";
import { CircleEditing } from "../../../../CzmObjects";
import { CzmCirclePrimitive } from "./CzmCirclePrimitive";
import { CzmCircleGroundPrimitive } from "./CzmCircleGroundPrimitive";
import { CzmCircleOutlinePrimitive } from "./CzmCircleOutlinePrimitive";

export * from './CzmCircleGroundPrimitive';
export * from './CzmCircleOutlinePrimitive';
export * from './CzmCirclePrimitive';

export class CzmCircle extends Destroyable {
    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    static defaults = {
        extrudedHeight: undefined
    }

    constructor(czmViewer: ESCesiumViewer, id?: SceneObjectKey) {
        super();
        this.disposeVar(new CircleEditing(this.positionReact, this.radiusReact, this.editingReact, czmViewer));
        const viewer = czmViewer.viewer;
        if (!viewer) return;
        // 初始化
        const czmCirclePrimitive = this.ad(new CzmCirclePrimitive(czmViewer, id));
        const czmCircleGroundPrimitive = this.ad(new CzmCircleGroundPrimitive(czmViewer, id));
        const czmCircleOutlinePrimitive = this.ad(new CzmCircleOutlinePrimitive(czmViewer, id));

        {
            // 共有属性绑定
            this.dispose(track([czmCirclePrimitive, 'allowPicking'], [this, 'allowPicking']));
            this.dispose(track([czmCircleGroundPrimitive, 'allowPicking'], [this, 'allowPicking']));
            this.dispose(track([czmCircleOutlinePrimitive, 'allowPicking'], [this, 'allowPicking']));
        }
        {
            const update = () => {
                const polygonShow = this.show ?? true;
                const polygonGround = this.ground ?? false;
                const polygonOutline = this.outline ?? false;
                czmCircleOutlinePrimitive.show = polygonShow && !polygonGround && polygonOutline; //显示多边形+不贴地才有外轮廓线
                czmCirclePrimitive.show = polygonShow && !polygonGround;
                // 判断show
                if (!czmCircleOutlinePrimitive.show) {
                    czmCircleOutlinePrimitive.position = undefined;
                } else {
                    czmCircleOutlinePrimitive.position = this.position;
                }
                if (!czmCirclePrimitive.show) {
                    czmCirclePrimitive.position = undefined;
                } else {
                    czmCirclePrimitive.position = this.position;
                }
                czmCirclePrimitive.rotation = czmCircleOutlinePrimitive.rotation = this.rotation;

                czmCircleOutlinePrimitive.radius = czmCirclePrimitive.radius = this.radius;
                czmCircleOutlinePrimitive.extrudedHeight = czmCirclePrimitive.extrudedHeight = this.extrudedHeight;
                if (this.position) {
                    czmCircleOutlinePrimitive.height = czmCirclePrimitive.height = this.position[2];
                }
                if (this.granularity === 0) {
                    console.error('granularity不能设置为0')
                    this.granularity = 1
                }
                czmCirclePrimitive.granularity = czmCircleOutlinePrimitive.granularity = this.granularity;
                czmCirclePrimitive.ellipsoid = czmCircleOutlinePrimitive.ellipsoid = this.ellipsoid as [number, number, number];


                czmCirclePrimitive.material = this.material;
                czmCirclePrimitive.stRotation = this.stRotation;

                czmCircleOutlinePrimitive.outlineColor = this.outlineColor;
                czmCircleOutlinePrimitive.translucent = this.outlineTranslucent;
                czmCircleOutlinePrimitive.numberOfVerticalLines = this.numberOfVerticalLines;
                czmCircleGroundPrimitive.show = polygonShow && polygonGround;
                // 判断show
                if (!czmCircleGroundPrimitive.show) {
                    czmCircleGroundPrimitive.position = undefined;
                } else {
                    czmCircleGroundPrimitive.position = this.position;
                }

                czmCircleGroundPrimitive.radius = this.radius;
                if (this.granularity === 0) {
                    console.error('granularity不能设置为0')
                    czmCircleGroundPrimitive.granularity = 1
                } else {
                    czmCircleGroundPrimitive.granularity = this.granularity;
                }
                czmCircleGroundPrimitive.rotation = this.rotation;

                czmCircleGroundPrimitive.ellipsoid = this.ellipsoid as [number, number, number];

                czmCircleGroundPrimitive.material = this.material;
                czmCircleGroundPrimitive.stRotation = this.stRotation;
            };
            update();
            const updateEvent = this.disposeVar(createNextAnimateFrameEvent(
                this.showChanged,
                this.radiusChanged,
                this.outlineChanged,
                this.extrudedHeightChanged,
                this.materialChanged,
                this.positionChanged,
                this.outlineColorChanged,
                this.stRotationChanged,
                this.outlineTranslucentChanged,
                this.ellipsoidChanged,
                this.granularityChanged,
                this.numberOfVerticalLinesChanged,
                this.groundChanged,
                this.rotationChanged
            ));
            this.dispose(updateEvent.disposableOn(update));

            this.dispose(this.flyToEvent.disposableOn(duration => {
                if (!this.ground) {
                    czmCirclePrimitive.flyTo(duration);
                } else {
                    czmCircleGroundPrimitive.flyTo(duration);
                }
            }));
        }
    }
}

export namespace CzmCircle {
    export const createDefaultProps = () => ({
        show: true,
        allowPicking: false,
        ground: false,
        outline: true,
        outlineTranslucent: true,
        // height: 0,
        extrudedHeight: undefined as number | undefined,
        outlineColor: reactArray<[number, number, number, number]>([1, 1, 1, 1]),
        material: reactJson({ type: 'Color', color: [1, 1, 1, 0.5] } as CzmMaterialJsonType),
        position: reactArrayWithUndefined<[number, number, number] | undefined>(undefined),
        rotation: reactArray<[number, number, number]>([0, 0, 0]),
        editing: react<boolean>(false),
        radius: 0,
        stRotation: 0,
        ellipsoid: reactArray<[number, number, number]>([6378137, 6378137, 6356752.314245179]),
        granularity: 1,
        numberOfVerticalLines: 0,
    });
}
extendClassProps(CzmCircle.prototype, CzmCircle.createDefaultProps);
export interface CzmCircle extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof CzmCircle.createDefaultProps>> { }
