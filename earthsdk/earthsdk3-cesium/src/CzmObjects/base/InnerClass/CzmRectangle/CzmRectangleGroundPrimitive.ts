import { PickedInfo } from "earthsdk3";
import { ESCesiumViewer } from "../../../../ESCesiumViewer";
import { CzmMaterialJsonType } from "../../../../ESJTypesCzm";
import { createMaterialRef, flyTo, positionFromCartesian, toRectangle } from "../../../../utils";
import * as Cesium from 'cesium';
import { Destroyable, Listener, Event, reactJsonWithUndefined, reactArrayWithUndefined, extendClassProps, ReactivePropsToNativePropsAndChanged, createNextAnimateFrameEvent, SceneObjectKey } from "xbsj-base";

export class CzmRectangleGroundPrimitive extends Destroyable {
    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    private _primitive?: Cesium.GroundPrimitive;

    static defaults = {
        material: {
            type: 'Color',
            color: [1, 1, 1, 0.5]
        } as CzmMaterialJsonType,
    }

    constructor(czmViewer: ESCesiumViewer, id?: SceneObjectKey) {
        super();
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }

        const materialRef = this.disposeVar(createMaterialRef([this, 'material'], CzmRectangleGroundPrimitive.defaults.material));

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
            const polygonInstance = new Cesium.GeometryInstance({
                geometry: new Cesium.RectangleGeometry({
                    rectangle: cartesians,
                    rotation: this.rotation && Cesium.Math.toRadians(this.rotation),//转弧度
                    stRotation: this.stRotation && Cesium.Math.toRadians(this.stRotation),
                    vertexFormat: Cesium.MaterialAppearance.MaterialSupport.ALL.vertexFormat,
                }),
                id: this,
            });
            geometryInstances.push(polygonInstance);
            const primitive = new Cesium.GroundPrimitive({
                geometryInstances,
                appearance,
                asynchronous: false, // 防止闪烁
                allowPicking: this.allowPicking ?? false, // 不允许拾取
                compressVertices: false, // 提升效率
            });
            //@ts-ignore
            Cesium.GroundPrimitive.prototype && (primitive.ESSceneObjectID = id)
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
            this.stRotationChanged,
            this.rotationChanged,
            materialRef.changed,
            this.allowPickingChanged,
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
            const boundingSphere = Cesium.BoundingSphere.fromRectangle3D(czmRectangle, undefined, 0);
            // alert('暂时不支持飞行')
            if (boundingSphere.radius > 0) {
                const target = positionFromCartesian(boundingSphere.center);
                target && flyTo(viewer, target, boundingSphere.radius * 4.0, undefined, duration);
            }
        }));
    }
}

export namespace CzmRectangleGroundPrimitive {
    export const createDefaultProps = () => ({
        show: undefined as boolean | undefined,
        allowPicking: undefined as boolean | undefined,
        material: reactJsonWithUndefined<CzmMaterialJsonType | undefined>(undefined),
        positions: reactArrayWithUndefined<[number, number, number, number] | undefined>(undefined),
        rotation: undefined as number | undefined,
        stRotation: undefined as number | undefined,
    });
}
extendClassProps(CzmRectangleGroundPrimitive.prototype, CzmRectangleGroundPrimitive.createDefaultProps);
export interface CzmRectangleGroundPrimitive extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof CzmRectangleGroundPrimitive.createDefaultProps>> { }
