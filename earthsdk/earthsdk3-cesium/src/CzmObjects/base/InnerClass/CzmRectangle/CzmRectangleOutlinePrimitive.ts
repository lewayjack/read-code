import { ESCesiumViewer } from "../../../../ESCesiumViewer";
import { Destroyable, Listener, Event, reactArrayWithUndefined, extendClassProps, ReactivePropsToNativePropsAndChanged, createNextAnimateFrameEvent, SceneObjectKey } from "xbsj-base";
import * as Cesium from 'cesium';
import { flyTo, positionFromCartesian, toColor, toRectangle } from "../../../../utils";

export class CzmRectangleOutlinePrimitive extends Destroyable {
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

        // const materialRef = this.disposeVar(createMaterialRef([this, 'outlineColor']));

        const removePrimitive = () => {
            if (!this._primitive) {
                return;
            }
            viewer.scene.primitives.remove(this._primitive);
            this._primitive = undefined;
        };
        this.dispose(removePrimitive);

        const scratchColor = new Cesium.Color();

        const createPrimitive = (cartesians: Cesium.Rectangle) => {

            const appearance = new Cesium.PerInstanceColorAppearance({
                flat: true,
                translucent: this.translucent ?? true,
            })

            const geometryInstances: Cesium.GeometryInstance[] = [];
            const rectangleOutlineInstance = new Cesium.GeometryInstance({
                geometry: new Cesium.RectangleOutlineGeometry({
                    rectangle: cartesians,
                    height: this.height ?? 0,
                    extrudedHeight: this.extrudedHeight,
                    rotation: this.rotation && Cesium.Math.toRadians(this.rotation),//转弧度
                }),
                attributes: {
                    color: this.color ? Cesium.ColorGeometryInstanceAttribute.fromColor(toColor(this.color, scratchColor)) : Cesium.ColorGeometryInstanceAttribute.fromColor(new Cesium.Color(1.0, 1.0, 1.0, 1.0)),
                },
                id: this,
            });
            geometryInstances.push(rectangleOutlineInstance);
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
            if (!cartesians) {
                return;
            }
            this._primitive = createPrimitive(cartesians);
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
            this.colorChanged,
            this.translucentChanged,
            this.extrudedHeightChanged,
            this.heightChanged,
            this.rotationChanged,
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
            const boundingSphere = Cesium.BoundingSphere.fromRectangle3D(czmRectangle, undefined, this.height);

            // alert('暂时不支持飞行')
            if (boundingSphere.radius > 0) {
                const target = positionFromCartesian(boundingSphere.center);
                target && flyTo(viewer, target, boundingSphere.radius * 4.0, undefined, duration);
            }
        }));
    }
}

export namespace CzmRectangleOutlinePrimitive {
    export const createDefaultProps = () => ({
        show: undefined as boolean | undefined,
        allowPicking: undefined as boolean | undefined,

        translucent: undefined as boolean | undefined,
        color: reactArrayWithUndefined<[number, number, number, number] | undefined>(undefined),
        height: undefined as number | undefined,
        extrudedHeight: undefined as number | undefined,
        rotation: undefined as number | undefined,
        positions: reactArrayWithUndefined<[number, number, number, number] | undefined>(undefined),
    });
}
extendClassProps(CzmRectangleOutlinePrimitive.prototype, CzmRectangleOutlinePrimitive.createDefaultProps);
export interface CzmRectangleOutlinePrimitive extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof CzmRectangleOutlinePrimitive.createDefaultProps>> { }