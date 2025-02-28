import { ESPipeFence, ESSceneObject, geoDestination, geoHeading } from "earthsdk3";
import { bind, createNextAnimateFrameEvent, Destroyable, ObjResettingWithEvent, react, track } from "xbsj-base";
import { CzmCustomPrimitive, CzmESGeoVector, CzmPolyline, CzmTexture } from "../../../CzmObjects";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { flyWithPositions, NativeNumber16Type, positionsToLocalPositions } from "../../../utils";
// 构建线框、面
class BuildOutlinesAndCustomPrimitive extends Destroyable {
    // 中心点坐标分成四个点
    divideFourPoints(p1: [number, number, number], p2: [number, number, number]) {
        // 计算夹角
        const angle = geoHeading(p1, p2)
        const p1Left = geoDestination(p1, this._sceneObject.width / 2, 90 + angle) as [number, number, number]
        const p1Right = geoDestination(p1, this._sceneObject.width / 2, angle - 90) as [number, number, number]

        const p2Right = geoDestination(p2, this._sceneObject.width / 2, angle - 90) as [number, number, number]
        const p2Left = geoDestination(p2, this._sceneObject.width / 2, 90 + angle) as [number, number, number]

        const p1LeftTop = [p1Left[0], p1Left[1], p1Left[2] + this._sceneObject.height / 2]
        const p1LeftBottom = [p1Left[0], p1Left[1], p1Left[2] - this._sceneObject.height / 2]

        const p1RightTop = [p1Right[0], p1Right[1], p1Right[2] + this._sceneObject.height / 2]
        const p1RightBottom = [p1Right[0], p1Right[1], p1Right[2] - this._sceneObject.height / 2]

        const p2LeftTop = [p2Left[0], p2Left[1], p2Left[2] + this._sceneObject.height / 2]
        const p2LeftBottom = [p2Left[0], p2Left[1], p2Left[2] - this._sceneObject.height / 2]

        const p2RightTop = [p2Right[0], p2Right[1], p2Right[2] + this._sceneObject.height / 2]
        const p2RightBottom = [p2Right[0], p2Right[1], p2Right[2] - this._sceneObject.height / 2]

        const ps1 = [[p1LeftTop, p1RightTop], [p1LeftTop, p2LeftTop], [p1LeftTop, p1LeftBottom], [p1LeftBottom, p2LeftBottom]]
        const ps2 = [[p1LeftBottom, p1RightBottom], [p1RightTop, p2RightTop], [p1RightTop, p1RightBottom], [p1RightBottom, p2RightBottom]]
        const ps3 = [[p2LeftTop, p2LeftBottom], [p2LeftTop, p2RightTop], [p2LeftBottom, p2RightBottom], [p2RightTop, p2RightBottom]]

        // 构建线框
        const outlinePionts = [...ps1, ...ps2, ...ps3] as [number, number, number][][]
        // 构建面的点位
        const customPrimitivePoints = [p1LeftBottom, p1LeftTop, p1RightTop, p1RightBottom, p2LeftBottom, p2LeftTop, p2RightTop, p2RightBottom] as [number, number, number][]

        return { outlinePionts, customPrimitivePoints }
    }
    // 设置index
    setIndexs(i: number) {
        const ni = i * 16
        const is = [
            // ni + 1, ni + 3, ni + 2,
            // ni + 1, ni + 0, ni + 3,
            ni + 1, ni + 0, ni + 3,
            ni + 1, ni + 3, ni + 2,

            ni + 5, ni + 4, ni + 7,
            ni + 6, ni + 5, ni + 7,

            ni + 9, ni + 8, ni + 11,
            ni + 9, ni + 11, ni + 10,

            ni + 13, ni + 12, ni + 15,
            ni + 13, ni + 15, ni + 14,
            // ni + 6, ni + 4, ni + 7,
            // ni + 6, ni + 5, ni + 4,

        ]
        return is
    }
    // 设置面的坐标
    setFaces(localPositons: [number, number, number][]) {
        const ps: [number, number, number][][] = []
        const l = localPositons.length / 8
        for (let i = 0; i < l; i++) {
            const pi = localPositons.slice(8 * i, 8 * (i + 1))
            ps.push(pi)
        }
        const fs = ps.map(e => {
            return [e[4], e[5], e[1], e[0], e[5], e[6], e[2], e[1], e[6], e[7], e[3], e[2], e[7], e[4], e[0], e[3]]
        })
        // console.log(fs);

        return [...fs.flat()]

    }
    // 计算距离
    getDistances(points: [number, number, number][], czmESPipeFence: CzmESPipeFence) {

        const [localPositons] = positionsToLocalPositions({ originPosition: points[0] }, points);

        const l = localPositons.length;

        const distances = localPositons.reduce<number[]>((p, c, ci, a) => {
            if (ci === 0) {
                p.push(0);
                return p;
            }

            const pi = ci - 1;
            const pc = a[pi];
            const d = Math.sqrt((pc[0] - c[0]) * (pc[0] - c[0]) + (pc[1] - c[1]) * (pc[1] - c[1]));
            p.push(p[pi] + d);
            return p;
        }, []);

        const totalDisReact = distances[l - 1];
        czmESPipeFence.distances = totalDisReact

        const st = distances.map(e => e / totalDisReact);

        return st
    }
    // 设置 纹理坐标
    setTextureCoordinates(sceneObject: ESPipeFence, czmESPipeFence: CzmESPipeFence) {

        if (!sceneObject.points || (sceneObject.points.length < 2)) return undefined;
        const ds = this.getDistances(sceneObject.points, czmESPipeFence)

        const sts: number[][] = []

        for (let i = 1; i < ds.length; i++) {
            let st: number[] = []

            if (i === ds.length - 1) {

                const sort = [
                    1, 0,
                    1, 1,
                    ds[i - 1], 1,
                    ds[i - 1], 0,
                ]

                st = [
                    ...sort,
                    ...sort,
                    ...sort,
                    ...sort,
                ]

            }
            else {

                const sort = [
                    ds[i], 0,
                    ds[i], 1,
                    ds[i - 1], 1,
                    ds[i - 1], 0,
                ]

                st = [
                    ...sort,
                    ...sort,
                    ...sort,
                    ...sort,
                ]
            }
            sts.push(st)
        }

        return sts;

    }
    // 更新 czmCustomPrimitive
    updateCustomPrimitive(czmCustomPrimitive: CzmCustomPrimitive, modelMatrix: NativeNumber16Type, points: any, indexs: any, sts: any) {
        // 设置矩阵
        czmCustomPrimitive.modelMatrix = modelMatrix
        // 设置索引
        czmCustomPrimitive.indexTypedArray = new Uint16Array(indexs);
        // 设置点位局部坐标
        czmCustomPrimitive.attributes = {
            position: {
                // @ts-ignore
                typedArray: new Float32Array(points),
                componentsPerAttribute: 3,
            },
            a_st: {
                typedArray: new Float32Array(sts),
                componentsPerAttribute: 2,
            }
        };
    }
    // 清空 czmCustomPrimitive 和 轮廓线
    clear(czmCustomPrimitive: CzmCustomPrimitive) {
        czmCustomPrimitive.indexTypedArray = undefined
        czmCustomPrimitive.modelMatrix = undefined
        czmCustomPrimitive.attributes = undefined
    }

    constructor(private _czmESPipeFence: CzmESPipeFence, private _sceneObject: ESPipeFence) {
        super();
        const sceneObject = this._sceneObject;
        const czmESPipeFence = this._czmESPipeFence;
        const czmCustomPrimitive = czmESPipeFence.czmCustomPrimitive

        if (!sceneObject.points || (sceneObject.points.length < 2)) {
            this.clear(czmCustomPrimitive)
            return;
        }

        const l = sceneObject.points.length

        let points: number[] = []
        let sts: number[] = []
        let indexs: number[] = []
        // 收集每次循环的相对坐标点位
        let allCustomPrimitivePoints: [number, number, number][] = []
        // 收集每次循环的轮廓线点位
        let allLinesPoints: [number, number, number][][] = []

        for (let i = 0; i < l - 1; i++) {
            const { outlinePionts, customPrimitivePoints } = this.divideFourPoints(sceneObject.points[i], sceneObject.points[i + 1])

            allCustomPrimitivePoints.push(...customPrimitivePoints)

            allLinesPoints.push(...outlinePionts)

            // 索引 
            indexs.push(...this.setIndexs(i))

        }

        // 设置GeoPolylines点位坐标
        // lines.positions = allLinesPoints

        // 获取 modelMatrix、局部坐标
        const [localPositons, modelMatrix, inverseModelMatrix] = positionsToLocalPositions({ originPosition: allCustomPrimitivePoints[0] }, allCustomPrimitivePoints);
        const fs = this.setFaces(localPositons)
        points.push(...fs.flat())

        // 计算纹理坐标
        const uv = this.setTextureCoordinates(sceneObject, czmESPipeFence) as number[][]
        sts.push(...uv.flat())

        // 计算包围盒 拉进 customPrimitive 消失的bug
        czmESPipeFence.computeBoundingBox()
        // 更新
        this.updateCustomPrimitive(czmCustomPrimitive, modelMatrix, points, indexs, sts)
    }
}

export class CzmESPipeFence<T extends ESPipeFence = ESPipeFence> extends CzmESGeoVector<T> {
    static readonly type = this.register<ESPipeFence, ESCesiumViewer>('ESCesiumViewer', ESPipeFence.type, this);
    private _line = this.dv(new CzmPolyline(this.czmViewer, this.sceneObject.id));
    get line() { return this._line; }
    // 自定义纹理
    private _czmTexture = this.ad(new CzmTexture(this.czmViewer, this.sceneObject.id));
    czmTexture() { return this._czmTexture; }
    // 自定义 primitive
    private _czmCustomPrimitive = this.dv(new CzmCustomPrimitive(this.czmViewer, this.sceneObject.id));
    get czmCustomPrimitive() { return this._czmCustomPrimitive; }

    private _distances = this.dv(react<number>(0));
    get distances() { return this._distances.value; }
    set distances(value: number) { this._distances.value = value; }
    get distancesChanged() { return this._distances.changed; }

    // 计算包围盒
    computeBoundingBox() {
        const minMax = this._czmCustomPrimitive.computeLocalAxisedBoundingBoxFromAttribute("position");
        if (!minMax) return;
        const { min, max } = minMax;
        this._czmCustomPrimitive.setLocalAxisedBoundingBox(min, max);
    }

    // CustomPrimitive 属性 绑定
    bindCustomPrimitive(sceneObject: ESPipeFence) {
        const czmCustomPrimitive = this._czmCustomPrimitive;
        // czmViewer.add(czmCustomPrimitive);
        // this.d(() => czmViewer.delete(czmCustomPrimitive));

        {
            this.d(track([czmCustomPrimitive, 'allowPicking'], [sceneObject, 'allowPicking']));
        }
        czmCustomPrimitive.renderState = {
            "depthTest": {
                "enabled": true
            },
            "cull": {
                "enabled": false,
                "face": 1029
            },
            "depthMask": false,
            "blending": {
                "enabled": true,
                "equationRgb": 32774,
                "equationAlpha": 32774,
                "functionSourceRgb": 770,
                "functionSourceAlpha": 1,
                "functionDestinationRgb": 771,
                "functionDestinationAlpha": 771
            }
        }

        czmCustomPrimitive.vertexShaderSource = `\
            in vec3 position;
            in vec2 a_st;
            out vec2 v_st;
            void main()
            {
                v_st = a_st;
                gl_Position = czm_modelViewProjection * vec4(position, 1.0);
            }
        `;

        czmCustomPrimitive.fragmentShaderSource = `\
            in vec2 v_st;
            uniform sampler2D u_image;
            uniform vec4 u_color;
            uniform vec2 u_speed;
            uniform vec2 u_stScale;
            void main()
            {
                vec2 addst = u_speed * (czm_frameNumber / 60.0);
                vec4 imageColor = texture(u_image, fract(v_st * u_stScale -  addst));
                vec4 tempColor = u_color;
                tempColor.a = u_color.a * (1.0 - abs(fract(v_st.t * u_stScale.t) - 0.5) * 2.0);
                tempColor.rgb = imageColor.rgb*imageColor.a + tempColor.rgb*(1.0-imageColor.a);
                out_FragColor =tempColor;
            }
        `;
        // 计算包围盒 解决拉远拉进 面消失的问题
        this.computeBoundingBox()

        {
            const update = () => {
                czmCustomPrimitive.show = sceneObject.show && sceneObject.filled;
            }
            update()
            const event = this.dv(createNextAnimateFrameEvent(sceneObject.showChanged, sceneObject.filledChanged));
            this.d(event.don(update));
        }

        return czmCustomPrimitive
    }

    constructor(sceneObject: T, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);

        const viewer = czmViewer.viewer;

        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        // 纹理
        const czmTexture = this._czmTexture;
        const line = this._line;

        this.d(bind([line, 'positions'], [sceneObject, 'points']));
        this.d(bind([line, 'editing'], [sceneObject, 'editing']));
        this.d(track([this.line, 'allowPicking'], [sceneObject, 'allowPicking']));
        this.d(track([this.line, 'color'], [sceneObject, 'strokeColor']));
        this.d(track([this.line, 'width'], [sceneObject, 'strokeWidth']));
        this.d(track([this.line, 'ground'], [sceneObject, 'strokeGround']));

        {
            const event = this.dv(createNextAnimateFrameEvent(
                this.sceneObject.pointsChanged,
                this.sceneObject.strokeWidthChanged,
                this.sceneObject.strokeColorChanged,
                this.sceneObject.heightChanged,
                this.sceneObject.widthChanged,
                this.sceneObject.fillColorChanged
            ));

            const resetting = this.dv(new ObjResettingWithEvent(event, () => {
                return new BuildOutlinesAndCustomPrimitive(this, this.sceneObject);
            }))
        }


        {
            const update = () => {
                line.show = sceneObject.show && sceneObject.stroked;
            }
            update();
            const event = this.dv(createNextAnimateFrameEvent(sceneObject.showChanged, sceneObject.strokedChanged));
            this.d(event.don(update));
        }

        this.bindCustomPrimitive(sceneObject);

        let url: string = ""
        const singleArrowUrl = ESSceneObject.getStrFromEnv('${earthsdk3-assets-script-dir}/assets/img/path/singleArrow.png')
        const multipleArrowsUrl = ESSceneObject.getStrFromEnv('${earthsdk3-assets-script-dir}/assets/img/path/multipleArrows.png')

        // 设置面的颜色
        {
            const update = () => {
                if (sceneObject.materialMode === 'multipleArrows' || sceneObject.materialMode === "blue") {
                    url = multipleArrowsUrl
                } else {
                    url = singleArrowUrl
                }
                czmTexture.uri = url

                this._czmCustomPrimitive.uniformMap = {
                    "u_image": {
                        "type": "texture",
                        "id": czmTexture.id
                    },
                    "u_stScale": [
                        this.distances / 50,
                        1,
                    ],
                    "u_speed": [1 / 50, 0],
                    "u_color": sceneObject.fillColor
                }
            }
            update()
            this.dispose(this.sceneObject.fillColorChanged.disposableOn(update))
            this.d(this.sceneObject.materialModeChanged.don(update))
            this.d(this.distancesChanged.don(update))
        }
    }
    override flyTo(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            return super.flyTo(duration, id);
        } else {
            if (this.line.positions) {
                flyWithPositions(czmViewer, sceneObject, id, this.line.positions, duration);
                return true;
            }
            return false;
        }
    }
}
