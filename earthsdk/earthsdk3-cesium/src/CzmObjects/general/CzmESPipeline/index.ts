import { Destroyable, ObjResettingWithEvent, createNextAnimateFrameEvent, track } from 'xbsj-base';
import * as Cesium from 'cesium';
import { CzmESGeoLineString } from '../CzmESGeoLineString';
import { ESPipeline, ESSceneObject, getDistancesFromPositions } from "earthsdk3";
import { ESCesiumViewer } from '../../../ESCesiumViewer';
import { CzmCustomPrimitive, CzmTexture } from "../../../CzmObjects";
import { positionsToLocalPositions } from '../../../utils';

export class CzmESPipeline extends CzmESGeoLineString<ESPipeline> {
    static override readonly type = this.register('ESCesiumViewer', ESPipeline.type, this);
    // 自定义图元
    czmCustomPrimitive;
    // 自定义纹理
    czmTexture;

    constructor(sceneObject: ESPipeline, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }

        const czmCustomPrimitive = this.dv(new CzmCustomPrimitive(czmViewer, sceneObject.id));
        const czmTexture = this.ad(new CzmTexture(czmViewer, sceneObject.id));
        this.czmCustomPrimitive = czmCustomPrimitive;
        this.czmTexture = czmTexture;

        {
            this.d(track([czmCustomPrimitive, 'allowPicking'], [sceneObject, 'allowPicking']));
        }

        const event = this.dv(createNextAnimateFrameEvent(
            sceneObject.pointsChanged,
            sceneObject.radiusChanged,
            sceneObject.sidesChanged,
        ))
        this.dv(new ObjResettingWithEvent(event, () => {
            if (sceneObject.radius > 0 && sceneObject.sides >= 3 && sceneObject.points && sceneObject.points.length >= 2) {
                return new CreateCustomPrimitive(sceneObject, this);
            }
            czmCustomPrimitive.attributes = undefined;
            return undefined;
        }))
    }
}

class CreateCustomPrimitive extends Destroyable {
    constructor(private _sceneObject: ESPipeline, private _czmESPipeline: CzmESPipeline) {
        super();
        const sceneObject = this._sceneObject;
        const czmESPipeline = this._czmESPipeline;

        const czmCustomPrimitive = czmESPipeline.czmCustomPrimitive;
        const czmTexture = czmESPipeline.czmTexture;
        if (!czmCustomPrimitive || !czmTexture) return;

        {
            const update = () => {
                czmCustomPrimitive.show = sceneObject.show && sceneObject.filled;
            }
            update();
            const event = this.dv(createNextAnimateFrameEvent(sceneObject.showChanged, sceneObject.filledChanged))
            this.d(event.don(update))
        }
        const singleArrowUrl = ESSceneObject.getStrFromEnv('${earthsdk3-assets-script-dir}/assets/img/path/singleArrow.png')
        const multipleArrowsUrl = ESSceneObject.getStrFromEnv('${earthsdk3-assets-script-dir}/assets/img/path/multipleArrows.png')
        {
            const update = () => {
                if (sceneObject.materialImage.url != "") {
                    czmTexture.uri = typeof sceneObject.materialImage.url == 'string' ? sceneObject.materialImage.url : sceneObject.materialImage.url.url;
                }
                else if (sceneObject.materialMode === 'multipleArrows' || sceneObject.materialMode === "blue") {
                    czmTexture.uri = multipleArrowsUrl;
                } else {
                    czmTexture.uri = singleArrowUrl;
                }
                const distance = getDistancesFromPositions(sceneObject.points as [number, number, number][], 'NONE');
                const totalDistance = distance[distance.length - 1];
                const repeat = totalDistance / sceneObject.materialImage.uDis
                czmCustomPrimitive.uniformMap = {
                    "u_image": {
                        "type": "texture",
                        "id": czmTexture.id
                    },
                    "u_stScale": [
                        repeat,
                        2 * Math.PI * sceneObject.radius / sceneObject.materialImage.vDis,
                    ],
                    "u_speed": [sceneObject.speed / sceneObject.materialImage.uDis, 0],
                    "u_color": sceneObject.fillColor
                };
            }
            update()
            const event = this.dv(createNextAnimateFrameEvent(
                sceneObject.speedChanged,
                sceneObject.materialImageChanged,
                sceneObject.materialModeChanged,
                sceneObject.fillColorChanged
            ));
            this.d(event.don(update))
        }
        // 绘制图元
        {
            const update = () => {
                if (!sceneObject.points) return;
                const { position, modelMatrix, indexes, uvCoordinates } = this.coordinateTransformation(sceneObject.points, sceneObject.sides);
                czmCustomPrimitive.modelMatrix = modelMatrix;
                czmCustomPrimitive.attributes = {
                    position: {
                        typedArray: new Float32Array(position),
                        componentsPerAttribute: 3,
                    },
                    st: {
                        typedArray: new Float32Array([...uvCoordinates, ...uvCoordinates.reverse()]),
                        componentsPerAttribute: 2,
                    }
                }
                czmCustomPrimitive.indexTypedArray = new Uint16Array([...indexes, ...indexes.reverse()]);
                czmCustomPrimitive.fragmentShaderSource = `
                    in vec2 v_st;
                    uniform sampler2D u_image;
                    uniform vec4 u_color;
                    uniform vec2 u_speed;
                    uniform vec2 u_stScale;
                    void main(){
                        vec2 addSt = u_speed * (czm_frameNumber / 60.0);
                        vec4 imageColor = texture(u_image,fract(v_st * u_stScale - addSt));
                        vec4 tempColor = u_color;
                        tempColor.a = u_color.a * (1.0 - abs(fract(v_st.t * u_stScale.t) - 0.5) * 2.0);
                        tempColor.rgb = imageColor.rgb*imageColor.a + tempColor.rgb*(1.0-imageColor.a);
                        out_FragColor =tempColor;
                    }
                `;
                czmCustomPrimitive.vertexShaderSource = `
                    in vec3 position;
                    in vec2 a_st;
                    out vec2 v_st;
                    void main(){
                        v_st = a_st;
                        gl_Position = czm_modelViewProjection * vec4(position,1.0);
                    }
                `
                //自动计算包围盒
                const minMax = czmCustomPrimitive.computeLocalAxisedBoundingBoxFromAttribute('position');
                if (!minMax) return;
                const { min, max } = minMax;
                czmCustomPrimitive.setLocalAxisedBoundingBox(min, max);
            }
            update();
        }
    }
    private coordinateTransformation(points: [number, number, number][], sides: number) {
        // 计算距离
        const distance = getDistancesFromPositions(points, 'NONE');
        const totalDistance = distance[distance.length - 1];
        const { circlePoints, uvCoordinates } = this.getCircularCoordinates(points, totalDistance);
        const [localPosition, modelMatrix, inverseModelMatrix] = positionsToLocalPositions({ originPosition: circlePoints[0] }, circlePoints);
        const indexes = this.triangleIndices(sides);
        return {
            modelMatrix,
            position: localPosition.flat(),
            indexes,
            uvCoordinates
        }
    }
    private getCircularCoordinates(points: [number, number, number][], lineDistance: number) {
        // 都是在笛卡尔坐标下进行计算的
        const { _sceneObject } = this;
        const radius = _sceneObject.radius;
        const sides = _sceneObject.sides;
        const circlePoints = [] as [number, number, number][];
        const uvCoordinates = [];
        let nextLength = 0;
        let Cartesian3_to_WGS84 = function (point: Cesium.Cartesian3): [number, number, number] {
            let cartesian33 = new Cesium.Cartesian3(point.x, point.y, point.z);
            let cartographic = Cesium.Cartographic.fromCartesian(cartesian33);
            let lat = Cesium.Math.toDegrees(cartographic.latitude);
            let lng = Cesium.Math.toDegrees(cartographic.longitude);
            let alt = cartographic.height;
            return [lng, lat, alt];
        }
        for (let i = 0; i < points.length - 1; i++) {
            const start = points[i];
            const end = points[i + 1];
            const currentLength = nextLength;
            nextLength += getDistancesFromPositions([start, end], "NONE")[0];
            const u = currentLength / lineDistance;
            const nextU = nextLength / lineDistance;
            const startCartesian = Cesium.Cartesian3.fromDegrees(...start);
            const endCartesian = Cesium.Cartesian3.fromDegrees(...end);
            // 终点方向就是法向量方向
            const endLocalVector = Cesium.Cartesian3.subtract(endCartesian, startCartesian, new Cesium.Cartesian3());
            //法向量
            const normalVector = Cesium.Cartesian3.normalize(endLocalVector, new Cesium.Cartesian3());
            // 辅助向量
            const auxiliaryVectorZ = new Cesium.Cartesian3(0, 0, 1);
            const auxiliaryVectorX = new Cesium.Cartesian3(1, 0, 0);
            // 向量点乘结果为正负1就是平行
            const circleStartPoint = Cesium.Cartesian3.cross(
                normalVector,
                Math.abs(Cesium.Cartesian3.dot(normalVector, auxiliaryVectorZ)) != 1 ? auxiliaryVectorZ : auxiliaryVectorX,
                new Cesium.Cartesian3()
            );
            // 归一化，乘半径
            Cesium.Cartesian3.normalize(circleStartPoint, circleStartPoint);
            Cesium.Cartesian3.multiplyByScalar(circleStartPoint, radius, circleStartPoint);
            // 通过旋转，计算圆点结果
            for (let j = 0; j <= sides; j++) {
                //获取旋转矩阵
                let quat = Cesium.Quaternion.fromAxisAngle(normalVector, j * 2 * Math.PI / sides);
                let rot_mat3 = Cesium.Matrix3.fromQuaternion(quat);
                let m = Cesium.Matrix4.fromRotationTranslation(rot_mat3, Cesium.Cartesian3.ZERO);
                Cesium.Matrix4.multiplyByTranslation(m, circleStartPoint, m);
                const startPoint = Cesium.Matrix4.getTranslation(m, new Cesium.Cartesian3());
                Cesium.Cartesian3.add(startCartesian, startPoint, startPoint);
                const endPoint = Cesium.Cartesian3.add(startPoint, endLocalVector, new Cesium.Cartesian3());
                circlePoints.push(
                    Cartesian3_to_WGS84(startPoint),
                    Cartesian3_to_WGS84(endPoint)
                )
                uvCoordinates.push(u, j / sides, nextU, j / sides);
            }
        }
        return { circlePoints, uvCoordinates };
    }
    private triangleIndices(sides: number) {
        // 连接三角网，最后一个节点连接起点
        const { _sceneObject } = this;
        const pointLength = _sceneObject.points?.length as number;
        const indicesLength = (pointLength - 1) * (sides + 1);
        let lineIndices = new Uint32Array(indicesLength * 6);
        for (let i = 0; i < indicesLength; i++) {
            lineIndices[i * 6 + 0] = i * 2 + 0
            lineIndices[i * 6 + 1] = i * 2 + 1
            lineIndices[i * 6 + 2] = (i + 1) % (sides + 1) == 0 ? (i - sides) * 2 : i * 2 + 2
            lineIndices[i * 6 + 3] = i * 2 + 1
            lineIndices[i * 6 + 4] = (i + 1) % (sides + 1) == 0 ? (i - sides) * 2 + 1 : i * 2 + 3
            lineIndices[i * 6 + 5] = (i + 1) % (sides + 1) == 0 ? (i - sides) * 2 : i * 2 + 2
        }
        return lineIndices;
    }
}
