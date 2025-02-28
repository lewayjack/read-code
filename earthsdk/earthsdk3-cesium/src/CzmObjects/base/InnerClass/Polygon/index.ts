import { PickedInfo } from "earthsdk3";
import { ESCesiumViewer } from "../../../../ESCesiumViewer";
import { createNextAnimateFrameEvent, Destroyable, Event, extendClassProps, Listener, ReactivePropsToNativePropsAndChanged, reactJson, reactJsonWithUndefined, SceneObjectKey, track } from "xbsj-base";
import { CzmPolygonPrimitive } from "./CzmPolygonPrimitive";
import { CzmPolygonGroundPrimitive } from "./CzmPolygonGroundPrimitive";
import { CzmMaterialJsonType, PolygonHierarchyType } from "../../../../ESJTypesCzm";

export * from './CzmPolygonPrimitive';
export * from './CzmPolygonGroundPrimitive';

export class CzmPolygon extends Destroyable {
    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    constructor(czmViewer: ESCesiumViewer, id?: SceneObjectKey) {
        super();
        const viewer = czmViewer.viewer;
        if (!viewer) return;
        // 初始化
        const czmPolygonPrimitive = this.ad(new CzmPolygonPrimitive(czmViewer, id));
        const czmPolygonGroundPrimitive = this.ad(new CzmPolygonGroundPrimitive(czmViewer, id));

        {
            // 共有属性绑定
            this.dispose(track([czmPolygonPrimitive, 'allowPicking'], [this, 'allowPicking']));
            this.dispose(track([czmPolygonGroundPrimitive, 'allowPicking'], [this, 'allowPicking']));
            this.dispose(track([czmPolygonPrimitive, 'polygonHierarchy'], [this, 'polygonHierarchy']));
            this.dispose(track([czmPolygonGroundPrimitive, 'polygonHierarchy'], [this, 'polygonHierarchy']));
            this.dispose(track([czmPolygonPrimitive, 'stRotation'], [this, 'stRotation']));
            this.dispose(track([czmPolygonGroundPrimitive, 'stRotation'], [this, 'stRotation']));
            this.dispose(track([czmPolygonPrimitive, 'material'], [this, 'material']));
            this.dispose(track([czmPolygonGroundPrimitive, 'material'], [this, 'material']));
        }
        {
            const createPolygon = () => {
                const PolygonGround = this.ground ?? false;
                const PolygonShow = this.show ?? true;
                czmPolygonPrimitive.show = (PolygonShow && !PolygonGround);
                czmPolygonGroundPrimitive.show = (PolygonShow && PolygonGround);

                czmPolygonGroundPrimitive.arcType = this.arcType as 'NONE' | 'GEODESIC' | 'RHUMB';
                czmPolygonGroundPrimitive.height = this.height ?? 1;
                czmPolygonGroundPrimitive.extrudedHeight = this.extrudedHeight;
                czmPolygonGroundPrimitive.ellipsoid = this.ellipsoid;
                czmPolygonGroundPrimitive.granularity = this.granularity;
                czmPolygonGroundPrimitive.perPositionHeight = this.perPositionHeight;
                czmPolygonGroundPrimitive.closeTop = this.closeTop;
                czmPolygonGroundPrimitive.closeBottom = this.closeBottom;
            }
            createPolygon()
            const createNextFrameEvent = this.disposeVar(createNextAnimateFrameEvent(
                this.showChanged,
                this.groundChanged,
                this.arcTypeChanged,
                this.heightChanged,
                this.extrudedHeightChanged,
                this.ellipsoidChanged,
                this.granularityChanged,
                this.perPositionHeightChanged,
                this.closeTopChanged,
                this.closeBottomChanged,
            ));
            this.dispose(createNextFrameEvent.disposableOn(() => {
                createPolygon();
            }));
            this.dispose(this.flyToEvent.disposableOn(duration => {
                if (!this.ground) {
                    czmPolygonPrimitive.flyTo(duration);
                } else {
                    czmPolygonGroundPrimitive.flyTo(duration);
                }
            }));
        }
    }
}

export namespace CzmPolygon {
    export const createDefaultProps = () => ({
        show: true, // boolean} [show=true] A boolean Property specifying the visibility
        allowPicking: false,
        polygonHierarchy: reactJsonWithUndefined<PolygonHierarchyType | undefined>(undefined), // A Property specifying the array of Cartesian3 positions that define the line strip.
        stRotation: undefined as number | undefined, // undfined时为1.0，A numeric Property specifying the width in pixels.
        material: reactJson({ type: 'Color' } as CzmMaterialJsonType),
        //GroundPrimitive特有属性
        arcType: 'GEODESIC' as 'NONE' | 'GEODESIC' | 'RHUMB',
        height: undefined as number | undefined,
        extrudedHeight: undefined as number | undefined,
        ellipsoid: undefined as [x: number, y: number, z: number] | undefined,
        granularity: 1,
        perPositionHeight: false,
        closeTop: true,
        closeBottom: true,
        //区分显示那个类
        ground: false,
    });
}
extendClassProps(CzmPolygon.prototype, CzmPolygon.createDefaultProps);
export interface CzmPolygon extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof CzmPolygon.createDefaultProps>> { }

