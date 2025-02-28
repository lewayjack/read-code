import { PickedInfo } from "earthsdk3";
import { ESCesiumViewer } from "../../../../ESCesiumViewer";
import { CzmMaterialJsonType } from "../../../../ESJTypesCzm";
import { Destroyable, Listener, Event, reactJsonWithUndefined, reactArrayWithUndefined, extendClassProps, ReactivePropsToNativePropsAndChanged, createNextAnimateFrameEvent, SceneObjectKey } from "xbsj-base";
import { createMaterialRef, flyTo, positionFromCartesian, toRectangle } from "../../../../utils";
import * as Cesium from 'cesium';

export class CzmRectanglePrimitive extends Destroyable {
    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }
    
    private _primitive?: Cesium.Primitive;

    constructor(czmViewer: ESCesiumViewer, id?: SceneObjectKey) {
        super();
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }

        const materialRef = this.disposeVar(createMaterialRef([this, 'material']));

        const removePrimitive = () => {
            if (!this._primitive) {
                return;
            }
            viewer.scene.primitives.remove(this._primitive);
            this._primitive = undefined;
        };
        this.dispose(removePrimitive);

        const createPrimitive = (cartesians: Cesium.Rectangle, material: Cesium.Material) => {
            const appearance = new Cesium.MaterialAppearance({
                material: material,
            })
            const geometryInstances: Cesium.GeometryInstance[] = [];
            const rectangleInstance = new Cesium.GeometryInstance({
                geometry: new Cesium.RectangleGeometry({
                    rectangle: cartesians,
                    height: this.height,
                    //会崩溃
                    // granularity: this.granularity === undefined ? Cesium.Math.RADIANS_PER_DEGREE : Cesium.Math.toRadians(this.granularity),
                    rotation: this.rotation && Cesium.Math.toRadians(this.rotation),//转弧度
                    extrudedHeight: this.extrudedHeight,
                    stRotation: this.stRotation && Cesium.Math.toRadians(this.stRotation),
                    vertexFormat: Cesium.MaterialAppearance.MaterialSupport.ALL.vertexFormat,
                }),
                id: this,
            });
            geometryInstances.push(rectangleInstance);
            const primitive = new Cesium.Primitive({
                geometryInstances,
                appearance,
                asynchronous: false, // 防止闪烁
                allowPicking: this.allowPicking ?? false, // 不允许拾取
                compressVertices: false, // 提升效率
            });
            //@ts-ignore
            Cesium.Primitive.prototype && (primitive.ESSceneObjectID = id)
            return primitive;
        }

        const recreatePolygon = () => {
            removePrimitive()
            if (!this.positions) {
                return
            }

            const cartesians = toRectangle(this.positions);
            if (!cartesians || !materialRef.value) {
                return;
            }
            this._primitive = createPrimitive(cartesians, materialRef.value);
            this._primitive && viewer.scene.primitives.add(this._primitive);
        }

        const updatePolygon = () => {
            const polygonShow = this.show ?? true;
            this._primitive && (this._primitive.show = polygonShow);
        };


        recreatePolygon();
        updatePolygon();

        const recreateEvent = this.disposeVar(createNextAnimateFrameEvent(
            this.positionsChanged,
            this.materialChanged,
            this.extrudedHeightChanged,
            this.heightChanged,
            this.stRotationChanged,
            this.rotationChanged,
            materialRef.changed,
            this.allowPickingChanged,
            // this.granularityChanged,
        ));

        this.dispose(recreateEvent.disposableOn(() => {
            recreatePolygon();
            updatePolygon();
        }));

        const updateEvent = this.disposeVar(createNextAnimateFrameEvent(
            this.showChanged,
        ));


        this.dispose(updateEvent.disposableOn(() => {
            updatePolygon();
        }));
        this.dispose(this.flyToEvent.disposableOn(duration => {
            if (!czmViewer.actived) {
                return;
            }

            if (!this.positions) return;

            const czmRectangle = toRectangle(this.positions);
            const boundingSphere = Cesium.BoundingSphere.fromRectangle3D(czmRectangle, undefined, this.height);

            // alert('暂时不支持飞行')
            if (boundingSphere.radius > 0) {
                const target = positionFromCartesian(boundingSphere.center);
                target && flyTo(viewer, target, boundingSphere.radius * 4.0, undefined, duration);
            }
        }));
    }
}

export namespace CzmRectanglePrimitive {
    export const createDefaultProps = () => ({
        show: undefined as boolean | undefined,
        allowPicking: undefined as boolean | undefined,
        material: reactJsonWithUndefined<CzmMaterialJsonType | undefined>(undefined),
        positions: reactArrayWithUndefined<[number, number, number, number] | undefined>(undefined),
        height: undefined as number | undefined,
        extrudedHeight: undefined as number | undefined,
        rotation: undefined as number | undefined,
        stRotation: undefined as number | undefined,
        // granularity: undefined as number | undefined,
    });
}
extendClassProps(CzmRectanglePrimitive.prototype, CzmRectanglePrimitive.createDefaultProps);
export interface CzmRectanglePrimitive extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof CzmRectanglePrimitive.createDefaultProps>> { }
