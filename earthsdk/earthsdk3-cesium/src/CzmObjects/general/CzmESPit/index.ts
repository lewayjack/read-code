
import * as Cesium from 'cesium';
import { equalsN3, ESJVector3D, ESPit, getMinMaxCorner, lbhToXyz } from "earthsdk3";
import { createNextAnimateFrameEvent, track } from "xbsj-base";
import { CzmCustomPrimitive, CzmTexture } from "../../../CzmObjects";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { flyWithPositions, positionFromCartesian, positionsToLocalPositions } from "../../../utils";
import { CzmESGeoPolygon } from "../CzmESGeoPolygon";
const earcut = require('earcut')
export class CzmESPit extends CzmESGeoPolygon<ESPit> {
    static override readonly type = this.register('ESCesiumViewer', ESPit.type, this);

    // 自定义图元
    czmSideCustomPrimitive;
    czmBottomCustomPrimitive;
    // 自定义纹理
    czmSideTexture;
    czmBottomTexture;

    private _width: number = 0;
    private _height: number = 0;

    constructor(sceneObject: ESPit, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.log('viewer is undefined!');
            return;
        }
        {
            // 覆盖父级绑定
            const update = () => {
                this.geoPolygon && (this.geoPolygon.fill = false);
            }
            update()
            this.d(sceneObject.filledChanged.don(update))
        }
        //初始化
        const czmSideCustomPrimitive = this.czmSideCustomPrimitive = this.dv(new CzmCustomPrimitive(czmViewer, sceneObject.id));
        const czmSideTexture = this.czmSideTexture = this.ad(new CzmTexture(czmViewer));
        const czmBottomCustomPrimitive = this.czmBottomCustomPrimitive = this.dv(new CzmCustomPrimitive(czmViewer, sceneObject.id));
        const czmBottomTexture = this.czmBottomTexture = this.ad(new CzmTexture(czmViewer));
        this.dispose(track([czmSideCustomPrimitive, 'allowPicking'], [sceneObject, 'allowPicking']));
        this.dispose(track([czmBottomCustomPrimitive, 'allowPicking'], [sceneObject, 'allowPicking']));
        {
            const update = () => {
                czmSideCustomPrimitive.show = sceneObject.show && sceneObject.filled;
                czmBottomCustomPrimitive.show = sceneObject.show && sceneObject.filled;
            }
            update()
            const event = this.dv(createNextAnimateFrameEvent(sceneObject.showChanged, sceneObject.filledChanged));
            this.dispose(event.don(update));
        }
        {
            const updateCzmPrimitive = (czmCustomPrimitive: CzmCustomPrimitive, _center: ESJVector3D, localPoints: ESJVector3D[], type: string, isClockwise?: boolean) => {
                czmCustomPrimitive.position = _center;
                // 展开数组
                const position = localPoints.flat();
                let indexes: Uint32Array = type == "bottom" ? earcut(position, null, 3) : this._triangleIndices(localPoints.length);
                // uv对应图片
                let uv = <number[]>[];
                let maxHeight = -Infinity, minHeight = Infinity, maxWidth = -Infinity, minWidth = Infinity, currentWidth = 0;
                if (type == "bottom") {
                    for (let i = 0; i < localPoints.length; i++) {
                        maxWidth = maxWidth > localPoints[i][0] ? maxWidth : localPoints[i][0];
                        minWidth = minWidth < localPoints[i][0] ? minWidth : localPoints[i][0];
                        maxHeight = maxHeight > localPoints[i][1] ? maxHeight : localPoints[i][1];
                        minHeight = minHeight < localPoints[i][1] ? minHeight : localPoints[i][1];
                    }
                    this._width = maxWidth - minWidth;
                    this._height = maxHeight - minHeight;
                    for (let i = 0; i < localPoints.length; i++) {
                        uv.push((localPoints[i][0] - this._width / 2) / this._width, (localPoints[i][1] - this._height / 2) / this._height)
                    }
                } else {
                    for (let i = 0; i < localPoints.length; i++) {
                        this._width += this._getDistance(localPoints[i], localPoints[i - 1 < 0 ? 0 : i - 1]);
                        maxHeight = maxHeight > localPoints[i][2] ? maxHeight : localPoints[i][2];
                        minHeight = minHeight < localPoints[i][2] ? minHeight : localPoints[i][2];
                    }
                    this._height = maxHeight - minHeight;
                    for (let i = 0; i < localPoints.length; i++) {
                        currentWidth += this._getDistance(localPoints[i], localPoints[i - 1 < 0 ? 0 : i - 1]);
                        uv.push(currentWidth / this._width, (localPoints[i][2] - minHeight) / this._height)
                    }
                }
                czmCustomPrimitive.indexTypedArray = new Uint16Array(isClockwise ? indexes : indexes.reverse());
                czmCustomPrimitive.attributes = {
                    position: {
                        typedArray: new Float32Array(position),
                        componentsPerAttribute: 3,
                    },
                    st: {
                        typedArray: new Float32Array(isClockwise ? uv : uv.reverse()),
                        componentsPerAttribute: 2
                    }
                };
                const uDis = type == "bottom" ? sceneObject.bottomImage.uDis ?? 50 : sceneObject.sideImage.uDis ?? 50;
                const vDis = type == "bottom" ? sceneObject.bottomImage.vDis ?? 50 : sceneObject.sideImage.vDis ?? 50;

                czmCustomPrimitive.fragmentShaderSource = `in vec2 v_st;
                                                        uniform sampler2D u_image;
                                                        uniform vec4 u_color;
                                                        void main()
                                                        {
                                                            vec2 st = v_st;
                                                            st.s = fract(st.s * ${(this._width / uDis).toFixed(1)});
                                                            st.t = fract(st.t * ${(this._height / vDis).toFixed(1)});
                                                            vec4 imageColor = texture(u_image, st);
                                                            out_FragColor = imageColor * u_color;
                                                        }
                                                        `
                // 自动计算包围盒
                const minMax = czmCustomPrimitive.computeLocalAxisedBoundingBoxFromAttribute("position");
                if (!minMax) return;
                const { min, max } = minMax;
                czmCustomPrimitive.setLocalAxisedBoundingBox(min, max);
            }
            const update = async () => {
                if (sceneObject.points && sceneObject.points.length > 2) {
                    // 获取中心点和最低点用于计算最低点高程
                    const { minPos, center } = getMinMaxCorner(sceneObject.points as ESJVector3D[]);
                    const bottomDepth = minPos[2] - sceneObject.depth;
                    // 画底面 三个点才可以画
                    if (!equalsN3(sceneObject.points[sceneObject.points.length - 1], sceneObject.points[sceneObject.points.length - 2])) {
                        const localPoints = positionsToLocalPositions({ originPosition: center }, sceneObject.points.map((item, index) => {
                            let TempArr = [...item] as ESJVector3D;
                            TempArr[2] = bottomDepth
                            return TempArr
                        }));
                        updateCzmPrimitive(czmBottomCustomPrimitive, center, localPoints[0], "bottom", true);
                    }
                    // 画侧面
                    // 插值
                    const interpolationPositions = this._interpolationAlongPolygon(sceneObject.points.map((item, index) => {
                        return Cesium.Cartesian3.fromArray(lbhToXyz(item));
                    }), sceneObject.interpolation);
                    // 获取高度
                    const res = await czmViewer.getHeightsByLonLats(interpolationPositions.map(item => {
                        return [item[0], item[1]]
                    }))
                    let TempPoint = [] as ESJVector3D[];
                    for (let i = 0; i < interpolationPositions.length; i++) {
                        const element = interpolationPositions[i];
                        TempPoint.push([element[0], element[1], res[i] ?? element[2]], [element[0], element[1], bottomDepth]);
                    }
                    const localPoints = positionsToLocalPositions({ originPosition: center }, TempPoint);
                    // 判断是顺时针还是逆时针
                    let isClockwise = this._isClockwise(sceneObject.points as ESJVector3D[], czmViewer);
                    updateCzmPrimitive(czmSideCustomPrimitive, center, localPoints[0], "side", isClockwise);
                }
            }
            update();
            // 点变化、深度变化、图像变化都重绘
            const event = this.dv(createNextAnimateFrameEvent(
                sceneObject.depthChanged,
                sceneObject.interpolationChanged,
                sceneObject.pointsChanged,
                sceneObject.bottomImageChanged,
                sceneObject.sideImageChanged,
            ))
            this.ad(event.don(update));
        }
        {
            const update = () => {
                czmSideTexture.uri = sceneObject.sideImage.url;
                czmBottomTexture.uri = sceneObject.bottomImage.url;
                czmSideCustomPrimitive.uniformMap = {
                    "u_image": {
                        "type": "texture",
                        "id": czmSideTexture.id
                    },
                    "u_color": [
                        1,
                        1,
                        1,
                        sceneObject.opacity
                    ]
                }
                czmBottomCustomPrimitive.uniformMap = {
                    "u_image": {
                        "type": "texture",
                        "id": czmBottomTexture.id
                    },
                    "u_color": [
                        1,
                        1,
                        1,
                        sceneObject.opacity
                    ]
                }
            }
            update();
            const event = this.ad(createNextAnimateFrameEvent(
                sceneObject.opacityChanged,
                sceneObject.bottomImageChanged,
                sceneObject.sideImageChanged,
            ))
            this.d(event.don(update));
        }
    }
    override flyTo(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            return super.flyTo(duration, id);
        } else {
            if (sceneObject.points) {
                flyWithPositions(czmViewer, sceneObject, id, sceneObject.points, duration)
                return true;
            }
            return false;
        }
    }
    private _interpolationAlongPolygon(positions: Cesium.Cartesian3[], interpolationDistance: number) {
        var result = [];
        for (let i = 0; i < positions.length; ++i) {
            var a = positions[i];
            var b = positions[(i + 1) % positions.length];
            var points = this._interpolationAlongLine(a, b, interpolationDistance);
            result.push(...points);
        }
        result.push(result[0]);
        return result;
    }
    // 插值点
    private _interpolationAlongLine(p1: Cesium.Cartesian3, p2: Cesium.Cartesian3, interpolationDistance: number) {
        var result = [];
        var totalLength = Cesium.Cartesian3.distance(p1, p2);
        var v = Cesium.Cartesian3.subtract(p2, p1, new Cesium.Cartesian3());
        if (!v.equals(Cesium.Cartesian3.ZERO)) Cesium.Cartesian3.normalize(v, v);
        var length = 0;
        while (length < totalLength) {
            var project = new Cesium.Cartesian3(v.x * length, v.y * length, v.z * length);
            var interpolation = Cesium.Cartesian3.add(p1, project, new Cesium.Cartesian3());
            const position = positionFromCartesian(interpolation)
            position && result.push(position);
            length += interpolationDistance;
        }
        return result;
    }
    private _isClockwise(points: ESJVector3D[], czmViewer: ESCesiumViewer) {
        // 判断是相对顺时针还是逆时针，根据相机视角作为辅助向量进行计算
        if (!czmViewer.viewer) {
            return;
        }
        for (let i = 0; i < points.length; i++) {
            let one = Cesium.Cartesian3.fromDegrees(...points[i]);
            let two = Cesium.Cartesian3.fromDegrees(...points[(i + 1) % points.length]);
            let three = Cesium.Cartesian3.fromDegrees(...points[(i + 2) % points.length]);
            let start = Cesium.Cartesian3.subtract(two, one, new Cesium.Cartesian3());
            let end = Cesium.Cartesian3.subtract(three, two, new Cesium.Cartesian3());
            if (start.equals(Cesium.Cartesian3.ZERO) || end.equals(Cesium.Cartesian3.ZERO)) return true;
            Cesium.Cartesian3.normalize(start, start);
            Cesium.Cartesian3.normalize(end, end);
            if (Math.abs(Cesium.Cartesian3.dot(start, end)) == 1) {
                if (i == points.length - 1) {
                    return true;
                } else {
                    continue;
                }
            }
            let normalVector = Cesium.Cartesian3.cross(start, end, new Cesium.Cartesian3());
            let isClockwise = Cesium.Cartesian3.dot(normalVector, czmViewer.viewer.camera.directionWC);
            return isClockwise > 0;
        }
    }
    // 构建侧边三角网
    private _triangleIndices(length: number) {
        let lineIndices = new Uint32Array(length * 3);
        for (let i = 0; i < length; ++i) {
            lineIndices[i * 3 + 0] = i;
            lineIndices[i * 3 + 1] = i % 2 ? (i + 2) % length : (i + 1) % length;
            lineIndices[i * 3 + 2] = i % 2 ? (i + 1) % length : (i + 2) % length;
        };
        return lineIndices;
    }
    private _getDistance(start: ESJVector3D, end: ESJVector3D) {
        return Math.sqrt(Math.pow(start[0] - end[0], 2) + Math.pow(start[1] - end[1], 2));
    }
}