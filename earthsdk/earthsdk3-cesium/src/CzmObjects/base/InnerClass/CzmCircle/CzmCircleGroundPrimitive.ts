import { PositionEditing } from "../../../../CzmObjects";
import { ESCesiumViewer } from "../../../../ESCesiumViewer";
import { CzmMaterialJsonType } from "../../../../ESJTypesCzm";
import { createMaterialRef, flyTo, positionToCartesian, toEllipsoid } from "../../../../utils";
import { Destroyable, Listener, Event, reactJsonWithUndefined, reactArrayWithUndefined, extendClassProps, ReactivePropsToNativePropsAndChanged, createNextAnimateFrameEvent, SceneObjectKey, reactArray } from "xbsj-base";
import * as Cesium from 'cesium';

export class CzmCircleGroundPrimitive extends Destroyable {
    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    private _sPositionEditing;
    get sPositionEditing() { return this._sPositionEditing; }

    private _primitive?: Cesium.GroundPrimitive;

    constructor(czmViewer: ESCesiumViewer, id?: SceneObjectKey) {
        super();
        this._sPositionEditing = this.disposeVar(new PositionEditing([this, 'position'], [this, 'editing'], czmViewer));
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        this.dispose(() => {
            this._primitive && viewer.scene.primitives.remove(this._primitive);
            this._primitive = undefined;
        });
        const materialRef = this.disposeVar(createMaterialRef([this, 'material'], CzmCircleGroundPrimitive.defaults.material));
        const createPrimitive = (cartesians: Cesium.Cartesian3, material: Cesium.Material) => {
            if (!cartesians || !this.radius) {
                return undefined;
            }
            const appearance = new Cesium.MaterialAppearance({
                material: material,
            })
            const geometryInstances: Cesium.GeometryInstance[] = [];

            const setGranularity = () => {
                let granularity = this.granularity ?? CzmCircleGroundPrimitive.defaults.granularity;
                if (this.granularity === 0) {
                    console.error('granularity不能设置为0')
                }
                granularity = granularity | 0;
                granularity = Math.max(1, granularity)
                return Cesium.Math.toRadians(granularity)
            }

            const circleInstance = new Cesium.GeometryInstance({
                geometry: new Cesium.CircleGeometry({
                    center: cartesians,
                    radius: this.radius,
                    stRotation: this.stRotation && Cesium.Math.toRadians(this.stRotation),
                    granularity: setGranularity(),
                    vertexFormat: Cesium.MaterialAppearance.MaterialSupport.ALL.vertexFormat,
                    ellipsoid: this.ellipsoid && toEllipsoid(this.ellipsoid),
                }),
                id: this,
            });
            geometryInstances.push(circleInstance);
            const primitive = new Cesium.GroundPrimitive({
                geometryInstances,
                appearance,
                asynchronous: false, // 防止闪烁
                allowPicking: this.allowPicking ?? CzmCircleGroundPrimitive.defaults.allowPicking, // 不允许拾取
                compressVertices: false, // 提升效率
            });
            //@ts-ignore
            Cesium.GroundPrimitive.prototype && (primitive.ESSceneObjectID = id)
            return primitive;
        }
        const recreatePolygon = () => {
            this._primitive && viewer.scene.primitives.remove(this._primitive);
            this._primitive = undefined;
            if (!this.position || !this.radius || !materialRef.value) {
                return;
            }
            const cartesians = positionToCartesian(this.position);
            this._primitive = createPrimitive(cartesians, materialRef.value);
            this._primitive && viewer.scene.primitives.add(this._primitive);
        }
        const updatePolygon = () => {
            const circleShow = this.show ?? CzmCircleGroundPrimitive.defaults.show;
            this._primitive && (this._primitive.show = circleShow);
        };
        recreatePolygon();
        updatePolygon();
        const recreateEvent = this.disposeVar(createNextAnimateFrameEvent(
            this.allowPickingChanged,
            this.positionChanged,
            this.radiusChanged,
            this.stRotationChanged,
            this.granularityChanged,
            this.ellipsoidChanged,
            this.materialChanged,
            materialRef.changed,
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
        this.dispose(this.flyToEvent.disposableOn(() => {
            if (!this.position) {
                console.warn(`GeoPoint当前没有位置信息，无法飞入！`);
                return;
            }
            if (this.radius) {
                flyTo(viewer, this.position, this.radius * 4, undefined, 1000);
            } else {
                const viewDistance = viewer.scene.camera.positionCartographic.height;
                flyTo(viewer, this.position, viewDistance, undefined, 1000);
            }
        }));
    }

    static defaults = {
        show: true,
        editing: true,
        allowPicking: false,
        material: {
            type: 'Color',
            color: [1, 1, 1, 0.5]
        } as CzmMaterialJsonType,
        radius: 0,
        stRotation: 0,
        ellipsoid: [6378137, 6378137, 6356752.314245179] as [number, number, number],
        granularity: 1,
    };
}

export namespace CzmCircleGroundPrimitive {
    export const createDefaultProps = () => ({
        show: undefined as boolean | undefined,
        editing: undefined as boolean | undefined,
        allowPicking: undefined as boolean | undefined,
        material: reactJsonWithUndefined<CzmMaterialJsonType | undefined>(undefined),
        granularity: undefined as number | undefined,
        position: reactArrayWithUndefined<[number, number, number] | undefined>(undefined),
        rotation: reactArray<[number, number, number]>([0, 0, 0]),
        radius: undefined as number | undefined,
        stRotation: undefined as number | undefined,
        ellipsoid: undefined as [x: number, y: number, z: number] | undefined,
    });
}
extendClassProps(CzmCircleGroundPrimitive.prototype, CzmCircleGroundPrimitive.createDefaultProps);
export interface CzmCircleGroundPrimitive extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof CzmCircleGroundPrimitive.createDefaultProps>> { }
