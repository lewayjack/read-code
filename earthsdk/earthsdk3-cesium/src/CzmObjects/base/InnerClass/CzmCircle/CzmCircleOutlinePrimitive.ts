import { ESCesiumViewer } from "../../../../ESCesiumViewer";
import { Destroyable, Listener, Event, reactArrayWithUndefined, extendClassProps, ReactivePropsToNativePropsAndChanged, createNextAnimateFrameEvent, SceneObjectKey, reactArray } from "xbsj-base";
import * as Cesium from 'cesium';
import { computeCzmModelMatrix, flyTo, positionToCartesian, toColor, toEllipsoid } from "../../../../utils";

export class CzmCircleOutlinePrimitive extends Destroyable {
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

        this.dispose(() => {
            this._primitive && viewer.scene.primitives.remove(this._primitive);
            this._primitive = undefined;
        });

        const scratchColor = new Cesium.Color();

        const createPrimitive = (cartesians: Cesium.Cartesian3) => {
            if (!cartesians || !this.radius) {
                return undefined;
            }
            const appearance = new Cesium.PerInstanceColorAppearance({
                flat: true,
                translucent: this.translucent ?? true,
            })
            const geometryInstances: Cesium.GeometryInstance[] = [];

            const solidWhite = Cesium.ColorGeometryInstanceAttribute.fromColor(
                Cesium.Color.WHITE
            );

            const setGranularity = () => {
                let granularity = this.granularity ?? CzmCircleOutlinePrimitive.defaults.granularity;
                if (this.granularity === 0) {
                    console.error('granularity不能设置为0')
                }
                granularity = granularity | 0;
                granularity = Math.max(1, granularity)
                return Cesium.Math.toRadians(granularity)
            }
            const sceneObjectOutlineInstance = new Cesium.GeometryInstance({
                geometry: new Cesium.CircleOutlineGeometry({
                    center: cartesians,
                    radius: this.radius,
                    height: this.height,
                    extrudedHeight: this.extrudedHeight,
                    ellipsoid: this.ellipsoid && toEllipsoid(this.ellipsoid),
                    granularity: setGranularity(),
                    numberOfVerticalLines: this.numberOfVerticalLines
                }),
                attributes: {
                    color: this.outlineColor ? Cesium.ColorGeometryInstanceAttribute.fromColor(toColor(this.outlineColor, scratchColor)) : solidWhite,

                },
                id: this,
            });
            const originTransform = computeCzmModelMatrix({
                initialRotation: 'yForwardzUp',
                // reverseInitialRotation: true,
                rotation: [0, 0, 0],
                position: this.position,
            });
            const modelMatrix = computeCzmModelMatrix({
                initialRotation: 'yForwardzUp',
                // reverseInitialRotation: true,
                rotation: this.rotation ? [this.rotation[0], this.rotation[2], -this.rotation[1]] : [0, 0, 0],
                position: this.position,
            });
            if (!modelMatrix || !originTransform) {
                console.warn(`modelMatrix is undefined!`);
                return;
            }
            const originTransformInv = Cesium.Matrix4.inverseTransformation(originTransform, new Cesium.Matrix4())
            Cesium.Matrix4.multiply(modelMatrix, originTransformInv, sceneObjectOutlineInstance.modelMatrix);
            geometryInstances.push(sceneObjectOutlineInstance);
            const primitive = new Cesium.Primitive({
                geometryInstances,
                appearance,
                asynchronous: false, // 防止闪烁
                allowPicking: this.allowPicking ?? CzmCircleOutlinePrimitive.defaults.allowPicking, // 不允许拾取
                compressVertices: false, // 提升效率
            });
            //@ts-ignore
            Cesium.Primitive.prototype && (primitive.ESSceneObjectID = id);
            return primitive;
        }

        const recreatePolygon = () => {
            this._primitive && viewer.scene.primitives.remove(this._primitive);
            this._primitive = undefined;
            if (!this.position) {
                return;
            }
            const cartesians = positionToCartesian(this.position);
            if (!cartesians) {
                return;
            }
            this._primitive = createPrimitive(cartesians);
            this._primitive && viewer.scene.primitives.add(this._primitive);
        }

        const updatePolygon = () => {
            const sceneObjectShow = this.show ?? true;
            this._primitive && (this._primitive.show = sceneObjectShow);

        };
        recreatePolygon();
        updatePolygon();

        const recreateEvent = this.disposeVar(createNextAnimateFrameEvent(
            this.allowPickingChanged,
            this.positionChanged,
            this.radiusChanged,
            this.extrudedHeightChanged,
            this.heightChanged,
            this.outlineColorChanged,
            this.translucentChanged,
            this.ellipsoidChanged,
            this.granularityChanged,
            this.numberOfVerticalLinesChanged,
            this.rotationChanged
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
            const viewDistance = viewer.scene.camera.positionCartographic.height;
            flyTo(viewer, this.position, viewDistance, undefined, 1000);
        }));
    }

    static defaults = {
        show: true,
        translucent: true,
        allowPicking: false,
        outlineColor: [1, 1, 1, 1] as [number, number, number, number],
        position: [0, 0, 0] as [number, number, number],
        height: 0,
        extrudedHeight: 0,
        radius: 0,
        ellipsoid: [6378137, 6378137, 6356752.314245179] as [number, number, number],
        granularity: 1,
        numberOfVerticalLines: 0
    };
}

export namespace CzmCircleOutlinePrimitive {
    export const createDefaultProps = () => ({
        show: true as boolean,
        translucent: undefined as boolean | undefined,
        allowPicking: undefined as boolean | undefined,
        outlineColor: reactArrayWithUndefined<[number, number, number, number] | undefined>(undefined),
        position: reactArrayWithUndefined<[number, number, number] | undefined>(undefined),
        rotation: reactArray<[number, number, number]>([0, 0, 0]),
        height: undefined as number | undefined,
        extrudedHeight: undefined as number | undefined,
        radius: undefined as number | undefined,
        ellipsoid: undefined as [x: number, y: number, z: number] | undefined,
        granularity: undefined as number | undefined,
        numberOfVerticalLines: undefined as number | undefined,
    });
}
extendClassProps(CzmCircleOutlinePrimitive.prototype, CzmCircleOutlinePrimitive.createDefaultProps);
export interface CzmCircleOutlinePrimitive extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof CzmCircleOutlinePrimitive.createDefaultProps>> { }
