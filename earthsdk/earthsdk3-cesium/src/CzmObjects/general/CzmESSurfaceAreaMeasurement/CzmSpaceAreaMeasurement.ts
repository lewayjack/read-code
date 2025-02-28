import { ESJNativeNumber16, PickedInfo } from "earthsdk3";
import { CzmCustomPrimitive, CzmPolyline, GeoCustomDivPoi } from "../../../CzmObjects";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { createInnerHtmlWithWhiteTextBlackBackground, getPointerEventButton } from "../../../utils";
import { bind, Destroyable, Event, extendClassProps, Listener, reactArray, reactArrayWithUndefined, ReactivePropsToNativePropsAndChanged, SceneObjectKey, track } from "xbsj-base";
import { updateCenterOfMass } from "../CzmESAreaMeasurement/utils";
import * as Cesium from 'cesium';
import { CzmAttributesType } from "../../../ESJTypesCzm";
import * as turf from '@turf/turf';
import Delaunator from 'delaunator';

export class CzmSpaceAreaMeasurement extends Destroyable {
    private _pickedEvent = this.disposeVar(new Event<[PickedInfo]>());
    get pickedEvent() { return this._pickedEvent; }

    private _startEvent = this.disposeVar(new Event());
    get startEvent(): Listener { return this._startEvent; }
    start() { this._startEvent.emit(); }

    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    private _geoPolyline;
    get geoPolyline() { return this._geoPolyline; }

    private _customPrimitive;
    get customPrimitive() { return this._customPrimitive; }

    private _geoDivPoi;
    get geoDivPoi() { return this._geoDivPoi; }

    constructor(czmViewer: ESCesiumViewer, id?: SceneObjectKey) {
        super();
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        this._geoPolyline = this.disposeVar(new CzmPolyline(czmViewer, id));
        this._customPrimitive = this.disposeVar(new CzmCustomPrimitive(czmViewer, id));
        this._geoDivPoi = this.disposeVar(new GeoCustomDivPoi(czmViewer, id));
        this.ad(this._geoDivPoi.pickedEvent.don((pickedInfo) => {
            if (getPointerEventButton(pickedInfo) === 0)
                this.pickedEvent.emit(pickedInfo);
        }))
        {
            /**
             * 1.内置customPrimitive绘制三角面
             * 2.计算三角面面积
             */

            this._geoPolyline.loop = true;
            this.dispose(this.flyToEvent.don((e) => {
                if (this._geoPolyline)
                    this._geoPolyline.flyTo(e)
            }))

            this._customPrimitive.primitiveType = 'LINES';
            this._customPrimitive.renderState = {
                "depthTest": {
                    "enabled": false
                },
                "cull": {
                    "enabled": false,
                    "face": 1029
                },
                "depthMask": false,
                "blending": {
                    "enabled": false,
                    "equationRgb": 32774,
                    "equationAlpha": 32774,
                    "functionSourceRgb": 770,
                    "functionSourceAlpha": 1,
                    "functionDestinationRgb": 771,
                    "functionDestinationAlpha": 771
                }
            };

            // this._customPrimitive.primitiveType = 'TRIANGLES';
            this._customPrimitive.fragmentShaderSource = "\nuniform vec4 u_color;\nvoid main()\n{\n    out_FragColor = u_color;\n}\n";
            this._customPrimitive.vertexShaderSource = "in vec3 position;\nvoid main()\n{\n    gl_Position = czm_modelViewProjection * vec4(position, 1.0);\n}\n";
            this._customPrimitive.uniformMap = { u_color: [1, 1, 0, 1] };

            this.dispose(track([this._customPrimitive, 'show'], [this, 'show']))
            this.dispose(track([this._geoPolyline, 'show'], [this, 'show']))
            this.dispose(bind([this._geoPolyline, 'positions'], [this, 'positions']))
            this.dispose(bind([this._geoPolyline, 'editing'], [this, 'editing']))
            this.dispose(bind([this._geoPolyline, 'width'], [this, 'outlineWidth']))
            this.dispose(bind([this._geoPolyline, 'color'], [this, 'outlineColor']))
        }

        {
            /**
             * 内置geoDivPoi显示和更新面积
             */
            const update = () => {
                let text = `暂无分析结果`
                if (this.totalArea) {
                    text = `表面积: ${(this.totalArea ?? 0).toFixed(2)}平方米`
                }
                if (this._geoDivPoi)
                    this._geoDivPoi.innerHTML = createInnerHtmlWithWhiteTextBlackBackground(text, 24);
            };
            update();
            this.dispose(this.totalAreaChanged.don(update));
            this.dispose(track([this._geoDivPoi, 'show'], [this, 'show']))

            this.dispose(this.positionsChanged.don(() => {
                if (this._geoDivPoi)
                    if (this.positions && this.positions.length >= 3) {
                        this._geoDivPoi.position = updateCenterOfMass(this.positions);
                    } else {
                        this._geoDivPoi.position = undefined;
                    }
            }))
        }
        {
            const updateArea = () => {
                if ((!this.positions || this.positions.length < 3) && this.customPrimitive) {
                    this.totalArea = 0;
                    this.customPrimitive.position = undefined;
                    this.customPrimitive.attributes = undefined;
                    this.customPrimitive.indexTypedArray = undefined;
                    this.customPrimitive.show = false;
                    return
                };

                //单位默认为m
                const interpolationDistance = (this.interpolationDistance ?? CzmSpaceAreaMeasurement.defaults.interpolationDistance)
                const interpolation = this.interpolation ?? CzmSpaceAreaMeasurement.defaults.interpolation
                const offsetHeight = this.offsetHeight ?? CzmSpaceAreaMeasurement.defaults.offsetHeight
                const drillDepth = this.drillDepth ?? CzmSpaceAreaMeasurement.defaults.drillDepth;

                const cartesians: Cesium.Cartesian3[] = [];
                if (this.positions)
                    for (let i = 0; i < this.positions.length; ++i) {
                        const p = Cesium.Cartesian3.fromDegrees(this.positions[i][0], this.positions[i][1], this.positions[i][2])
                        cartesians.push(p);
                    }
                // 平均法向量
                var normal = _getApproximateNormal(cartesians);
                if (isNaN(normal.x) || isNaN(normal.y) || isNaN(normal.z)) {
                    console.warn(`法向量计算错误！`);
                    return;
                }
                // 近似平面中心
                var center = _getCenter(cartesians);
                // 中心到地心向量
                var centerNormal = Cesium.Cartesian3.normalize(center, new Cesium.Cartesian3());
                /**
                 * 中心法向量与法向量之间的夹角的余弦值。
                 */
                var cos = Cesium.Cartesian3.dot(centerNormal, normal);
                if (cos < 0) { //夹角大小90度时取反
                    normal = _getCartesian3Inserve(normal);
                    cartesians.reverse();
                }

                /**
                 * 将坐标从地球表面转换为固定坐标系的变换矩阵。
                 */
                let transform = Cesium.Transforms.eastNorthUpToFixedFrame(center);
                /**
                 * 将坐标转换矩阵的逆矩阵应用于给定的笛卡尔坐标。
                 * @param cartesian 笛卡尔坐标。
                 * @returns 转换后的笛卡尔坐标。
                 * 计算给定变换矩阵的逆矩阵。
                 * @param transform - 变换矩阵。
                 * @returns 逆变换矩阵。
                 */
                let transformInverse = Cesium.Matrix4.inverseTransformation(transform, new Cesium.Matrix4());

                if (Math.abs(cos) < 0.999) {
                    const rotation = _getRotationMatrixByNormalAndCenter(normal, centerNormal); // 旋转矩阵
                    var centerInserve = _getCartesian3Inserve(center);
                    var translation = Cesium.Matrix4.fromTranslation(centerInserve, new Cesium.Matrix4()); //平移矩阵
                    transformInverse = Cesium.Matrix4.multiply(rotation, translation, translation); //变换矩阵，世界->局部
                    transform = Cesium.Matrix4.inverse(transformInverse, new Cesium.Matrix4()); //就换矩阵，本地->世界
                }
                var locationPositions = _transformCartesians(cartesians, transformInverse); //世界坐标转本地坐标
                var projectLocationPositions = [];
                var worldRadian: [number, number, number][] = [];
                var worldCartesians: Cesium.Cartesian3[] = [];

                if (interpolation && interpolationDistance > 0) {
                    // 面内插值
                    var bounds = _getBounds2D(locationPositions);
                    var turfpositions = _getTurfPoints(locationPositions);
                    var interpolationInPolygon = _interpolationInPolygon(turfpositions, bounds, interpolationDistance);
                    const interpolationInPolygon1 = _pickFromScene(interpolationInPolygon, transform, transformInverse, normal, viewer.scene, offsetHeight, drillDepth);
                    // 边界插值
                    var interpolationAlongPolygon = _interpolationAlongPolygon(locationPositions, interpolationDistance);
                    const interpolationAlongPolygon1 = _pickFromScene(interpolationAlongPolygon, transform, transformInverse, normal, viewer.scene, offsetHeight, drillDepth);

                    worldCartesians.push(...interpolationInPolygon1.world_cartesian);
                    projectLocationPositions.push(...interpolationInPolygon1.local);
                    worldRadian.push(...interpolationInPolygon1.world);

                    worldCartesians.push(...interpolationAlongPolygon1.world_cartesian);
                    projectLocationPositions.push(...interpolationAlongPolygon1.local);
                    worldRadian.push(...interpolationAlongPolygon1.world);

                    // 处理原有的点
                    locationPositions.forEach(coord => {
                        var polygon = _pickFromScene([coord], transform, transformInverse, normal, viewer.scene, offsetHeight, drillDepth);
                        if (polygon.local.length > 0) {
                            projectLocationPositions.push(...polygon.local);
                            worldRadian.push(...polygon.world);
                            worldCartesians.push(...polygon.world_cartesian);
                        } else {
                            projectLocationPositions.push(coord);
                            var worldPosition = _transformCartesians([coord], transform);
                            for (let i = 0; i < worldPosition.length; ++i) {
                                worldCartesians.push(worldPosition[i]);
                                var projectPoint = Cesium.Cartographic.fromCartesian(worldPosition[i]);
                                worldRadian.push([projectPoint.longitude, projectPoint.latitude, projectPoint.height + offsetHeight]);
                            }
                        }
                    });
                } else {
                    projectLocationPositions = locationPositions;
                    worldCartesians = _transformCartesians(locationPositions, transform);
                    for (let i = 0; i < worldCartesians.length; ++i) {
                        var projectPoint = Cesium.Cartographic.fromCartesian(worldCartesians[i]);
                        worldRadian.push([projectPoint.longitude, projectPoint.latitude, projectPoint.height + offsetHeight]);
                    }
                }

                var indices: Uint32Array = _getIndices(projectLocationPositions);

                const totalArea = _getMeshArea(worldCartesians, indices);
                this.totalArea = totalArea

                const posRay: number[] = []
                projectLocationPositions.forEach(coord => {
                    const p = [coord.x, coord.y, coord.z] as [number, number, number];
                    p && posRay.push(...p)
                });

                const attribute: CzmAttributesType = {
                    position: {
                        typedArray: new Float32Array(posRay),
                        componentsPerAttribute: 3,
                    }
                }
                if (this.customPrimitive) {
                    this.customPrimitive.modelMatrix = Cesium.Matrix4.toArray(transform) as ESJNativeNumber16;
                    this.customPrimitive.attributes = attribute;
                    const indexs = triangleIndicesToLines([...indices]);
                    this.customPrimitive.indexTypedArray = new Uint32Array(indexs);
                    this.customPrimitive.show = true;
                }
            }
            // updateArea()
            // const updateEvent = this.disposeVar(createNextAnimateFrameEvent(
            //     this.positionsChanged,
            //     this.interpolationDistanceChanged,
            //     this.interpolationChanged,
            //     this.offsetHeightChanged,
            //     this.drillDepthChanged
            // ));
            // this.dispose(updateEvent.disposableOn(updateArea));
            this.dispose(this.startEvent.don(updateArea));
        }
    }
    static defaults = {
        positions: [],
        editing: false,
        totalArea: 0,
        interpolation: true,
        interpolationDistance: 0.5,
        offsetHeight: 0,
        drillDepth: 3,
        outlineWidth: 2,
        outlineColor: [1, 1, 1, 1],
    }
}


export namespace CzmSpaceAreaMeasurement {
    export const createDefaultProps = () => ({
        positions: reactArrayWithUndefined<[number, number, number][] | undefined>(undefined),
        editing: false,
        show: undefined as boolean | undefined,
        totalArea: undefined as number | undefined,
        interpolationDistance: undefined as number | undefined,
        interpolation: undefined as boolean | undefined,
        offsetHeight: undefined as number | undefined,
        drillDepth: undefined as number | undefined,
        outlineWidth: undefined as number | undefined,
        outlineColor: reactArray<[number, number, number, number]>([1, 1, 1, 1]), // default [1, 1, 1, 1]
    });
}
extendClassProps(CzmSpaceAreaMeasurement.prototype, CzmSpaceAreaMeasurement.createDefaultProps);
export interface CzmSpaceAreaMeasurement extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof CzmSpaceAreaMeasurement.createDefaultProps>> { }

function triangleIndicesToLines(triangleIndices: number[]) {
    if (triangleIndices.length % 3 !== 0) {
        console.warn(`当前传入的索引不是3的倍数,可能不是三角片的索引!`);
    }
    const l = triangleIndices.length / 3 | 0;
    const lineIndices: number[] = new Array(l * 6);
    for (let i = 0; i < l; ++i) {
        lineIndices[i * 6 + 0] = triangleIndices[i * 3 + 0];
        lineIndices[i * 6 + 1] = triangleIndices[i * 3 + 1];
        lineIndices[i * 6 + 2] = triangleIndices[i * 3 + 2];
        lineIndices[i * 6 + 3] = triangleIndices[i * 3 + 1];
        lineIndices[i * 6 + 4] = triangleIndices[i * 3 + 2];
        lineIndices[i * 6 + 5] = triangleIndices[i * 3 + 0];
    };
    return lineIndices;
}
function _getApproximateNormal(cartesian3s: Cesium.Cartesian3[]) {
    var va = new Cesium.Cartesian3(0, 0, 0);
    var vb = new Cesium.Cartesian3(0, 0, 0);
    var normal = new Cesium.Cartesian3(0, 0, 0);
    var sum_normal = new Cesium.Cartesian3(0, 0, 0);
    if (cartesian3s[0].equals(cartesian3s[cartesian3s.length - 1])) {
        cartesian3s.pop();
    }
    var position_count = cartesian3s.length;
    for (let i = 0; i < position_count; ++i) {
        var origin = cartesian3s[i];
        var a;
        if (i == 0) {
            a = cartesian3s[cartesian3s.length - 1];
        } else {
            a = cartesian3s[i - 1];
        }
        var b;
        if (i == cartesian3s.length - 1) {
            b = cartesian3s[0];
        } else {
            b = cartesian3s[i + 1];
        }
        // 取两条边
        va = Cesium.Cartesian3.subtract(origin, a, va);
        vb = Cesium.Cartesian3.subtract(origin, b, vb);

        // 叉乘得到法向量并归一化
        normal = Cesium.Cartesian3.cross(va, vb, normal);
        normal = Cesium.Cartesian3.normalize(normal, normal);
        sum_normal = Cesium.Cartesian3.add(sum_normal, normal, sum_normal);
    }
    normal.x = sum_normal.x / position_count;
    normal.y = sum_normal.y / position_count;
    normal.z = sum_normal.z / position_count;
    return normal
}

function _getCenter(cartesian3s: Cesium.Cartesian3[]) {
    var center = new Cesium.Cartesian3(0, 0, 0);
    var position_count = cartesian3s.length;
    for (let i = 0; i < position_count; ++i) {
        var origin = cartesian3s[i];
        center = Cesium.Cartesian3.add(center, origin, center);
    }
    center.x = center.x / position_count;
    center.y = center.y / position_count;
    center.z = center.z / position_count;
    return center;
}
function _getCartesian3Inserve(cartesian3: Cesium.Cartesian3) {
    return new Cesium.Cartesian3(-1 * cartesian3.x, -1 * cartesian3.y, -1 * cartesian3.z);
}
function _getRotationMatrixByNormalAndCenter(normal: Cesium.Cartesian3, center: Cesium.Cartesian3) {
    var normalX = Cesium.Cartesian3.cross(normal, center, new Cesium.Cartesian3());
    normalX = Cesium.Cartesian3.normalize(normalX, normalX);
    var normalY = Cesium.Cartesian3.cross(normal, normalX, new Cesium.Cartesian3());
    normalY = Cesium.Cartesian3.normalize(normalY, normalY);
    var normalZ = normal;
    var transform = new Cesium.Matrix4(normalX.x, normalX.y, normalX.z, 0,
        normalY.x, normalY.y, normalY.z, 0,
        normalZ.x, normalZ.y, normalZ.z, 0,
        0, 0, 0, 1);
    return transform;
}

function _transformCartesians(cartesians: Cesium.Cartesian3[], transform: Cesium.Matrix4) {
    var localPositions: Cesium.Cartesian3[] = [];
    for (let i = 0; i < cartesians.length; ++i) {
        var cartesian = cartesians[i];
        var projectPoint = Cesium.Matrix4.multiplyByPoint(transform, cartesian, new Cesium.Cartesian3());
        localPositions.push(projectPoint);
    }
    return localPositions;
}

function _getBounds2D(positions: Cesium.Cartesian3[]) {
    var minx = positions[0].x;
    var miny = positions[0].y;
    var maxx = positions[0].x;
    var maxy = positions[0].y;
    positions.forEach(coord => {
        minx = Math.min(minx, coord.x);
        miny = Math.min(miny, coord.y);
        maxx = Math.max(maxx, coord.x);
        maxy = Math.max(maxy, coord.y);
    });
    return { minx: minx, miny: miny, maxx: maxx, maxy: maxy };
}
function _getTurfPoints(positions: Cesium.Cartesian3[]) {
    var turfpositions: [number, number][] = [];
    positions.forEach(coord => {
        turfpositions.push([coord.x, coord.y]);
    });
    turfpositions.push(turfpositions[0]);
    return turfpositions;
}

function _getSTS(positions: Cesium.Cartesian3[], scale: number) {
    var sts: number[] = [];
    positions.forEach(coord => {
        var x = coord.x / scale;
        var y = coord.y / scale;
        sts.push(x);
        sts.push(y);
    });
    return sts;
}

function _getIndices(positions: Cesium.Cartesian3[]) {
    var indices: [number, number][] = [];
    positions.forEach(coord => {
        const p = [coord.x, coord.y] as [number, number]
        indices.push(p)
    });
    var triangles = Delaunator.from(indices).triangles;
    return triangles.reverse();
}

function _getMeshArea(positions: Cesium.Cartesian3[], indices: Uint32Array) {
    var area = 0;
    for (var i = 0; i < indices.length; i += 3) {
        const p = [positions[indices[i]], positions[indices[i + 1]], positions[indices[i + 2]]]
        area += _getTriangleArea(p);
    }
    return area;
}

function _getTriangleArea(p: Cesium.Cartesian3[]) {
    var length1 = Cesium.Cartesian3.distance(p[0], p[1]);
    var length2 = Cesium.Cartesian3.distance(p[1], p[2]);
    var length3 = Cesium.Cartesian3.distance(p[2], p[0]);
    var ps = (length1 + length2 + length3) / 2; //半周长;
    var area = Math.sqrt(ps * (ps - length1) * (ps - length2) * (ps - length3));
    return area;
}

function _interpolationInPolygon(polygon: [number, number][], bounds: {
    minx: number;
    miny: number;
    maxx: number;
    maxy: number;
}, distance: number) {
    var positions = [];
    for (var startx = bounds.minx; startx < bounds.maxx; startx += distance) {
        for (var starty = bounds.miny; starty < bounds.maxy; starty += distance) {
            if (!_pointInPolygon([startx, starty], polygon)) {
                continue;
            }
            positions.push(new Cesium.Cartesian3(startx, starty, 0));
        }
    }
    return positions;
}
function _interpolationAlongPolygon(positions: Cesium.Cartesian3[], interpolationDistance: number) {
    var result = [];
    for (let i = 0; i < positions.length; ++i) {
        var a = positions[i];
        var b;
        if (i == positions.length - 1) {
            b = positions[0];
        } else {
            b = positions[i + 1];
        }
        var points = _interpolationAlongLine(a, b, interpolationDistance);
        result.push(...points);
    }
    return result;
}
function _interpolationAlongLine(p1: Cesium.Cartesian3, p2: Cesium.Cartesian3, interpolationDistance: number) {
    var result = [];
    var totalLength = Cesium.Cartesian3.distance(p1, p2);
    var v = Cesium.Cartesian3.subtract(p2, p1, new Cesium.Cartesian3());
    v = Cesium.Cartesian3.normalize(v, v);
    var length = interpolationDistance;
    var count = 1;
    while (length < totalLength) {
        var project = new Cesium.Cartesian3(v.x * length, v.y * length, v.z * length);
        var interpolation = Cesium.Cartesian3.add(p1, project, new Cesium.Cartesian3());
        result.push(interpolation);
        length += interpolationDistance;
    }
    return result;
}

function _pointInPolygon(point: [number, number], polygon: [number, number][]) {
    var pt = turf.point(point);
    if (!turf.booleanEqual(turf.point(polygon[0]), turf.point(polygon[polygon.length - 1]))) {
        return false;
    }
    var turfPolygon = [];
    turfPolygon.push(polygon);
    var poly = turf.polygon(turfPolygon);
    return turf.booleanPointInPolygon(pt, poly);
}

function _pickFromScene(cartesians: Cesium.Cartesian3[],
    transform: Cesium.Matrix4,
    transformInverse: Cesium.Matrix4,
    normal: Cesium.Cartesian3, scene: Cesium.Scene, offsetHeight: number, drillDepth: number) {
    var cartesiansWithHeight: Cesium.Cartesian3[] = [];
    cartesians.forEach(coord => {
        var c = coord.clone();
        c.z = 100000; //太低的话，可能在地形下面，导致相交失败
        cartesiansWithHeight.push(c);
    });
    var positions_world = _transformCartesians(cartesiansWithHeight, transform);
    var normalInverse = new Cesium.Cartesian3(-1 * normal.x, -1 * normal.y, -1 * normal.z);
    var positions_world_ray: [number, number, number][] = [];
    var positions_local = [];
    var world_cartesian = [];
    for (let i = 0; i < positions_world.length; ++i) {
        var cartesian = positions_world[i];
        var ray = new Cesium.Ray(cartesian, normalInverse);
        var projectPoints = [];
        try {
            //@ts-ignore
            projectPoints = scene.drillPickFromRay(ray, drillDepth);
        } catch { }
        if (projectPoints.length === 0) {
            ray = new Cesium.Ray(cartesian, normal);
            try {
                //@ts-ignore
                projectPoints = scene.drillPickFromRay(ray, drillDepth);
            } catch { }
        }
        if (projectPoints.length === 0) {
            continue;
        }
        var projectPoint;
        for (var p = 0; p < projectPoints.length; p++) {
            var obj = projectPoints[p];

            if ((!obj.object || obj.object.content) && obj.position) {
                projectPoint = obj.position;
                break;
            }
        }
        if (!projectPoint || !projectPoint.x || isNaN(projectPoint.x)) {
            continue;
        }
        // 转为局部坐标加上抬高高度再转回世界坐标
        var localPositions = _transformCartesians([projectPoint], transformInverse);
        localPositions.forEach(p => {
            p.z += offsetHeight;
        })
        projectPoint = _transformCartesians(localPositions, transform)[0];
        world_cartesian.push(projectPoint);
        projectPoint = Cesium.Cartographic.fromCartesian(projectPoint);
        positions_world_ray.push([projectPoint.longitude, projectPoint.latitude, projectPoint.height]);
        positions_local.push(cartesians[i]);

    }
    return { local: positions_local, world: positions_world_ray, world_cartesian: world_cartesian };
}
