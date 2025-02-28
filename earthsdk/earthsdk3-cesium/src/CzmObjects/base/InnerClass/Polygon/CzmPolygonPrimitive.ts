//类名变更：CzmCoplanarPolygonPrimitive-------------->CzmPolygonPrimitive

import { PickedInfo } from "earthsdk3";
import { CzmMaterialJsonType, PolygonHierarchyType } from "../../../../ESJTypesCzm";
import { Destroyable, Listener, Event, extendClassProps, ReactivePropsToNativePropsAndChanged, reactJsonWithUndefined, createNextAnimateFrameEvent, SceneObjectKey } from "xbsj-base";
import { ESCesiumViewer } from "../../../../ESCesiumViewer";
import { createMaterialRef, flyTo, positionFromCartesian, positionsToUniqueCartesians, createPolygonHierarchy } from "../../../../utils";
import * as Cesium from 'cesium'

const polygonHierarchyMd = `
类型说明：
\`\`\`javascript

type PolygonHierarchyType = {
    positions: [number, number, number][],
    holes?: PolygonHierarchyType[],
}

\`\`\`

polygonHierarchy是一个内部包含三个元素的数组，表示经纬度高度。示例代码如下：
\`\`\`

{
    "positions": [
        [
            93.19429118627504,
            61.48556372186203,
            12824.544175304914
        ],
        [
            71.62096868744942,
            47.45924012009615,
            0.7280036300965961
        ],
        [
            88.38946536737586,
            37.829583176316866,
            0.3838874167831524
        ],
        [
            107.9427992944273,
            38.334598753898184,
            -0.7953822805248424
        ],
        [
            127.5326036793715,
            48.94155332924799,
            1024.1092355217022
        ]
    ]
}

\`\`\`
`;

export class CzmPolygonPrimitive extends Destroyable {
    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    static defaults = {
        allowPicking: false,
        show: true,
        polygonHierarchy: { positions: [] } as PolygonHierarchyType,
        stRotation: 0,
        material: {
            type: 'Color',
            color: [1, 1, 1, 0.5]
        } as CzmMaterialJsonType,
    }

    static polygonHierarchyMd = polygonHierarchyMd

    private _primitive?: Cesium.Primitive;

    constructor(czmViewer: ESCesiumViewer, id?: SceneObjectKey) {
        super();
        const viewer = czmViewer.viewer;
        if (!viewer) return;
        const materialRef = this.disposeVar(createMaterialRef([this, 'material'], CzmPolygonPrimitive.defaults.material));

        const createPrimitive = (material: Cesium.Material) => {
            const appearance = new Cesium.MaterialAppearance({
                material,
                // TODO(vtxf): 需要穷举出所有需要纹理的材质样式！
                materialSupport: material.type === 'Checkerboard' ? Cesium.MaterialAppearance.MaterialSupport.TEXTURED : undefined,
            });
            const geometryInstances: Cesium.GeometryInstance[] = [];

            const polygonGeometry = new Cesium.CoplanarPolygonGeometry({
                // vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
                vertexFormat: Cesium.MaterialAppearance.MaterialSupport.ALL.vertexFormat,
                polygonHierarchy: createPolygonHierarchy(this.polygonHierarchy ?? CzmPolygonPrimitive.defaults.polygonHierarchy),
                stRotation: this.stRotation,
            });

            geometryInstances.push(new Cesium.GeometryInstance({
                geometry: polygonGeometry,
                id: this,
            }));

            const primitive = new Cesium.Primitive({
                geometryInstances,
                appearance,
                asynchronous: false, // 防止闪烁
                allowPicking: this.allowPicking, // 不允许拾取
                compressVertices: false, // 提升效率
            });
            //@ts-ignore
            Cesium.Primitive.prototype && (primitive.ESSceneObjectID = id)
            return primitive;
        }

        const boundingSphere = new Cesium.BoundingSphere();

        const resetPrimitive = () => {
            if (!this._primitive) {
                return;
            }

            viewer.scene.primitives.remove(this._primitive);
            this._primitive = undefined;
        };
        this.dispose(resetPrimitive);

        const recreateFunc = () => {
            resetPrimitive();
            if (!this.polygonHierarchy) {
                return;
            }

            const cartesians = positionsToUniqueCartesians(this.polygonHierarchy.positions);

            if (cartesians.length < 3 || !materialRef.value) {
                boundingSphere.radius = -1;
                return;
            }

            Cesium.BoundingSphere.fromPoints(cartesians, boundingSphere);
            this._primitive = createPrimitive(materialRef.value);
            this._primitive && viewer.scene.primitives.add(this._primitive);
        }

        const updateFunc = () => {
            if (!this._primitive) {
                return;
            }
            this._primitive.show = this.show ?? true;
        };

        recreateFunc();
        updateFunc();

        const recreateEvent = this.disposeVar(createNextAnimateFrameEvent(
            this.polygonHierarchyChanged,
            this.stRotationChanged,
            this.allowPickingChanged,
            materialRef.changed,
        ));
        this.dispose(recreateEvent.disposableOn(() => {
            recreateFunc();
            updateFunc();
        }));

        const updateEvent = this.disposeVar(createNextAnimateFrameEvent(
            this.showChanged,
        ));
        this.dispose(updateEvent.disposableOn(() => {
            updateFunc();
        }));

        this.dispose(this.flyToEvent.disposableOn(duration => {
            if (!czmViewer.actived) {
                return;
            }

            if (boundingSphere.radius > 0) {
                const target = positionFromCartesian(boundingSphere.center);
                target && flyTo(viewer, target, boundingSphere.radius * 4.0, undefined, duration);
            }
        }));
    }
}

export namespace CzmPolygonPrimitive {
    export const createDefaultProps = () => ({
        show: undefined as boolean | undefined, // boolean} [show=true] A boolean Property specifying the visibility
        allowPicking: undefined as boolean | undefined,
        // TODO(vtxf): reactJson是权宜之计，以后得写一个专门的reactPolygonHierarchyType来判断，性能会高点！
        polygonHierarchy: reactJsonWithUndefined<PolygonHierarchyType | undefined>(undefined), // A Property specifying the array of Cartesian3 positions that define the line strip.
        stRotation: undefined as number | undefined, // undfined时为1.0，A numeric Property specifying the width in pixels.
        material: reactJsonWithUndefined<CzmMaterialJsonType | undefined>(undefined),
    });
}
extendClassProps(CzmPolygonPrimitive.prototype, CzmPolygonPrimitive.createDefaultProps);
export interface CzmPolygonPrimitive extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof CzmPolygonPrimitive.createDefaultProps>> { }
