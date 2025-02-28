import { extendClassProps, JsonValue, react, reactJson, reactPositions, UniteChanged } from "xbsj-base";
import { BooleanProperty, ColorProperty, EnumProperty, ESJFillStyle, ESJPointStyle, ESJRenderType, ESJStrokeStyle, ESJVector2D, ESJVector3D, ESJVector3DArray, GroupProperty, JsonProperty, NumberProperty, StringProperty } from "../../ESJTypes";
import { geoArea, geoBuffer, geoDifference, geoIntersect, geoPolygonOverlap, geoUnion, getDistancesFromPositions } from "../../utils";
import { ESVisualObject } from "./ESVisualObject";
function countNestingDepth(arr: any) {
    let depth = 0;
    function count(array: any, currentDepth: number) {
        currentDepth++;
        depth = Math.max(currentDepth, depth);
        array.forEach((item: any) => {
            if (Array.isArray(item)) {
                count(item, currentDepth);
            }
        });
    }
    count(arr, 0);
    return depth;
}

/**
 * https://www.wolai.com/earthsdk/u1Uc89HHrBjiGGB67BdFLc
 */
export abstract class ESGeoVector extends ESVisualObject {

    private _editing = this.dv(react<boolean>(false));
    get editing() { return this._editing.value; }
    set editing(value: boolean) { this._editing.value = value; }
    get editingChanged() { return this._editing.changed; }

    protected _area = this.dv(react(0));
    get area() { return this._area.value; }
    get areaChanged() { return this._area.changed; }

    protected _perimeter = this.dv(react(0));
    get perimeter() { return this._perimeter.value; }
    get perimeterChanged() { return this._perimeter.changed; }

    protected _updateArea() {
        this._area.value = this.getArea() ?? 0;
    }
    protected _updatePerimeter() {
        this._perimeter.value = this.getPerimeter() ?? 0;
    }

    constructor(id?: string) {
        super(id);
        const update = () => {
            this._updateArea();
            this._updatePerimeter();
        }
        update();
        this.d(this.pointsChanged.don(update));
    }

    getArea() {
        if (this.points && this.points.length >= 3) {
            return geoArea([...this.points])
        } else {
            return undefined
        }
    }

    getDistance() {
        if (this.points && this.points.length >= 2) {
            const distances = getDistancesFromPositions(this.points, 'NONE');
            return distances[distances.length - 1];
        } else {
            return undefined
        }
    }
    getPerimeter() {
        if (this.points && this.points.length >= 3) {
            const pos = [...this.points, this.points[0]];
            const distances = getDistancesFromPositions(pos, 'NONE');
            return distances[distances.length - 1];
        } else {
            return undefined
        }
    }

    //交集计算
    getIntersect(position: ESJVector3DArray) {
        if (this.points && this.points.length >= 3 && position.length >= 3) {
            const pos = geoIntersect(this.points, position)
            if (!pos) return undefined;
            const e1 = pos[0][0][0]
            if (Array.isArray(e1)) {
                const p1 = [...pos] as ESJVector2D[][][]
                const list: ESJVector3DArray[] = []
                p1.forEach(el => {
                    const arr = el[0].map(ex => [...ex, 0] as ESJVector3D)
                    list.push(arr)
                })
                return list
            } else {
                const p2 = [...pos] as ESJVector2D[][]
                const p3 = p2[0].map(e => [...e, 0] as ESJVector3D)
                return [p3]
            }
        } else {
            return undefined
        }
    }
    //并集计算
    getUnion(position: ESJVector3DArray) {
        if (this.points && this.points.length >= 3 && position.length >= 3) {
            const pos = geoUnion(this.points, position)
            if (!pos) return undefined;
            const e1 = pos[0][0][0]
            if (Array.isArray(e1)) {
                const p1 = [...pos] as ESJVector2D[][][]
                const list: ESJVector3DArray[] = []
                p1.forEach(el => {
                    const arr = el[0].map(ex => [...ex, 0] as ESJVector3D)
                    list.push(arr)
                })
                return list
            } else {
                const p2 = [...pos] as ESJVector2D[][]
                const p3 = p2[0].map(e => [...e, 0] as ESJVector3D)
                return [p3]
            }
        } else {
            return undefined
        }
    }

    /**
     * 裁切
     * @param positions 用来裁切多边形的多边形
     * @returns 如果返回对象自身的positions,表示用来裁切的多边形完全包含在对象多边形之中，裁切出来中空的多边形需要自行处理；
     * 其他情况正常返回多边形值。
     */
    getDifference(position: [number, number, number][]) {
        if (this.points && this.points.length >= 3 && position.length >= 3) {
            let posi = [...position]
            const pos0 = position[0]
            const posn = position[position.length - 1]
            //判断第一个点是否和最后一个点相等
            if (!(pos0[0] === posn[0] && pos0[1] === posn[1] && pos0[2] === posn[2])) {
                posi.push(pos0)
            }
            const pos = geoDifference([...this.points, this.points[0]], [...posi])
            if (!pos) return {
                status: 'undefined',
                positions: undefined
            };
            const p = [...pos] as any
            if (countNestingDepth(p) === 3) {
                const p1 = p.map((e: any) => e.map((a: any) => [...a, 0]))
                if (p1.length <= 1) {
                    return {
                        status: 'notIncluded',
                        positions: p1
                    }
                }
                const diff0 = p1[0] as [number, number, number][]
                const diff1 = p1[1] as [number, number, number][]
                const overlap = geoPolygonOverlap([...diff0], [...diff1])
                if (overlap === "oneBig") {
                    return {
                        status: 'included',
                        positions: p1
                    }
                } else {
                    return {
                        status: 'notIncluded',
                        positions: p1
                    }
                }
            } else if (countNestingDepth(p) === 4) {
                const p1 = p.map((e: any) => e.map((a: any) => a.map((b: any) => [...b, 0])))
                const a = [...p1]
                const b: number[][] = []
                a.forEach((item) => {
                    b.push(item[0])
                })
                return {
                    status: 'notIncluded',
                    positions: b
                }
            } else {
                return {
                    status: 'undefined',
                    positions: undefined
                };
            }
        } else {
            return {
                status: 'undefined',
                positions: undefined
            };
        }
    }
    //缓冲计算
    getBuffer(radius: number = 500, units?: string) {
        if (this.points && this.points.length >= 2) {
            const pos = geoBuffer(this.points, radius, units)
            if (!pos) return undefined;
            return [pos[0].map((e: ESJVector2D) => [...e, 0] as ESJVector3D)]
        } else {
            return undefined
        }
    }
    //计算是否一个多边形在另一个多边形内部
    geoPolygonOverlap(position: ESJVector3DArray) {
        if (this.points && this.points.length >= 3 && position.length >= 3) {
            const pos = geoPolygonOverlap(this.points, position);
            if (pos === "oneBig") {
                return true;
            } else if (pos === "twoBig") {
                return false;
            } else {
                return undefined;
            }
        } else {
            return undefined
        }
    }

    static override defaults = {
        ...ESVisualObject.defaults,
        points: [] as ESJVector3DArray,
        pointStyle: {
            size: 1,
            sizeType: 'screen',
            color: [1, 1, 1, 1],
            material: '',
            materialParams: {}
        } as ESJPointStyle,
        strokeStyle: {
            width: 1,
            widthType: 'screen',
            color: [1, 1, 1, 1],
            material: '',
            materialParams: {},
            ground: false
        } as ESJStrokeStyle,
        fillStyle: {
            color: [1, 1, 1, 1],
            material: '',
            materialParams: {},
            ground: false
        } as ESJFillStyle,
        pointed: false,
        stroked: false,
        filled: false
    };

    override getESProperties() {
        const properties = { ...super.getESProperties() };
        return {
            ...properties,
            defaultMenu: 'style',
            coordinate: [
                ...properties.coordinate,
                new BooleanProperty('编辑', '编辑', false, false, [this, 'editing'], false),
                new JsonProperty('位置数组', '位置数组(经纬高数组)', true, false, [this, 'points'], ESGeoVector.defaults.points),
                new NumberProperty('面积', '面积', false, true, [this, 'area']),
                new NumberProperty('周长', '周长', false, true, [this, 'perimeter'])
            ],
            style: [
                ...properties.style,
                new GroupProperty('点样式', '点样式集合', []),
                new BooleanProperty('开启', '开启点样式', false, false, [this, 'pointed'], false),
                new NumberProperty('点大小', '点大小(pointSize)', false, false, [this, 'pointSize'], 1),
                new EnumProperty('点类型', '点类型(pointSizeType)', false, false, [this, 'pointSizeType'], [['screen', 'screen'], ['world', 'world']], 'screen'),
                new ColorProperty('点颜色', '点颜色(pointColor)', false, false, [this, 'pointColor'], [1, 1, 1, 1]),
                new GroupProperty('线样式', '线样式集合', []),
                new BooleanProperty('开启', '开启线样式', false, false, [this, 'stroked'], true),
                new BooleanProperty('贴地', '是否贴地', false, false, [this, 'strokeGround'], false),
                new NumberProperty('线宽', '线宽(strokeWidth)', false, false, [this, 'strokeWidth'], 1),
                new EnumProperty('线类型', '线类型(strokeWidthType)', false, false, [this, 'strokeWidthType'], [['screen', 'screen'], ['world', 'world']], 'screen'),
                new ColorProperty('线颜色', '线颜色(strokeColor)', false, false, [this, 'strokeColor'], [1, 1, 1, 1]),
                new GroupProperty('面样式', '面样式集合', []),
                new BooleanProperty('开启', '开启填充样式', false, false, [this, 'filled'], false),
                new BooleanProperty('贴地', '是否贴地', false, false, [this, 'fillGround'], false),
                new ColorProperty('填充颜色', '填充颜色(fillColor)', false, false, [this, 'fillColor'], [1, 1, 1, 1]),
            ],
        };
    };

    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('ESGeoVector', 'ESGeoVector', [
                new BooleanProperty('是否编辑', '是否编辑', false, false, [this, 'editing']),
                new JsonProperty('位置数组', '位置数组(经纬高数组)', false, false, [this, 'points']),
                new GroupProperty('点样式', '点样式', [
                    new BooleanProperty('开启点样式', '开启点样式', false, false, [this, 'pointed']),
                    new NumberProperty('点大小', '点大小(pointSize)', false, false, [this, 'pointSize']),
                    new EnumProperty('点类型', '点类型(pointSizeType)', false, false, [this, 'pointSizeType'], [['screen', 'screen'], ['world', 'world']]),
                    new ColorProperty('点颜色', '点颜色(pointColor)', false, false, [this, 'pointColor']),
                    new StringProperty('点材质', '点材质(pointMaterial)', false, false, [this, 'pointMaterial']),
                    new JsonProperty('点材质参数', '点材质参数(pointMaterialParams)', false, false, [this, 'pointMaterialParams']),

                ]),
                new GroupProperty('线样式', '线样式', [
                    new BooleanProperty('开启线样式', '开启线样式', false, false, [this, 'stroked']),
                    new NumberProperty('线宽', '线宽(strokeWidth)', false, false, [this, 'strokeWidth']),
                    new EnumProperty('线类型', '线类型(strokeWidthType)', false, false, [this, 'strokeWidthType'], [['screen', 'screen'], ['world', 'world']]),
                    new ColorProperty('线颜色', '线颜色(strokeColor)', false, false, [this, 'strokeColor']),
                    new StringProperty('线材质', '线材质(strokeMaterial)', false, false, [this, 'strokeMaterial']),
                    new JsonProperty('线材质参数', '线材质参数(strokeMaterialParams)', false, false, [this, 'strokeMaterialParams']),
                    new BooleanProperty('是否贴地', '是否贴地', false, false, [this, 'strokeGround']),
                ]),
                new GroupProperty('填充样式', '填充样式', [
                    new BooleanProperty('开启填充样式', '开启填充样式', false, false, [this, 'filled']),
                    new ColorProperty('填充颜色', '填充颜色(fillColor)', false, false, [this, 'fillColor']),
                    new StringProperty('面材质', '面材质(fillMaterial)', false, false, [this, 'fillMaterial']),
                    new JsonProperty('面材质参数', '面材质参数(fillMaterialParams)', false, false, [this, 'fillMaterialParams']),
                    new BooleanProperty('是否贴地', '是否贴地', false, false, [this, 'fillGround']),
                ]),
            ]),
        ];
    }

    get pointSize() { return this.pointStyle.size; }
    set pointSize(value: number) { this.pointStyle = { ...this.pointStyle, size: value } }
    get pointSizeChanged() { return this.pointStyleChanged; }

    get pointSizeType() { return this.pointStyle.sizeType }
    set pointSizeType(value: ESJRenderType) { this.pointStyle = { ...this.pointStyle, sizeType: value } }
    get pointSizeTypeChanged() { return this.pointStyleChanged; }

    get pointColor() { return this.pointStyle.color }
    set pointColor(value: [number, number, number, number]) { this.pointStyle = { ...this.pointStyle, color: [...value] } }
    get pointColorChanged() { return this.pointStyleChanged; }

    get pointMaterial() { return this.pointStyle.material; }
    set pointMaterial(value: string) { this.pointStyle = { ...this.pointStyle, material: value } }
    get pointMaterialChanged() { return this.pointStyleChanged; }

    get pointMaterialParams() { return this.pointStyle.materialParams; }
    set pointMaterialParams(value: JsonValue) { this.pointStyle = { ...this.pointStyle, materialParams: value } }
    get pointMaterialParamsChanged() { return this.pointStyleChanged; }

    get strokeWidth() { return this.strokeStyle.width; }
    set strokeWidth(value: number) { this.strokeStyle = { ...this.strokeStyle, width: value } }
    get strokeWidthChanged() { return this.strokeStyleChanged; }

    get strokeWidthType() { return this.strokeStyle.widthType; }
    set strokeWidthType(value: ESJRenderType) { this.strokeStyle = { ...this.strokeStyle, widthType: value } }
    get strokeWidthTypeChanged() { return this.strokeStyleChanged; }

    get strokeColor() { return this.strokeStyle.color; }
    set strokeColor(value: [number, number, number, number]) { this.strokeStyle = { ...this.strokeStyle, color: [...value] } }
    get strokeColorChanged() { return this.strokeStyleChanged; }

    get strokeMaterial() { return this.strokeStyle.material; }
    set strokeMaterial(value: string) { this.strokeStyle = { ...this.strokeStyle, material: value } }
    get strokeMaterialChanged() { return this.strokeStyleChanged; }

    get strokeMaterialParams() { return this.strokeStyle.materialParams; }
    set strokeMaterialParams(value: JsonValue) { this.strokeStyle = { ...this.strokeStyle, materialParams: value } }
    get strokeMaterialParamsChanged() { return this.strokeStyleChanged; }

    get strokeGround() { return this.strokeStyle.ground; }
    set strokeGround(value: boolean) { this.strokeStyle = { ...this.strokeStyle, ground: value } }
    get strokeGroundChanged() { return this.strokeStyleChanged; }

    get fillColor() { return this.fillStyle.color; }
    set fillColor(value: [number, number, number, number]) { this.fillStyle = { ...this.fillStyle, color: [...value] } }
    get fillColorChanged() { return this.fillStyleChanged; }

    get fillMaterial() { return this.fillStyle.material; }
    set fillMaterial(value: string) { this.fillStyle = { ...this.fillStyle, material: value } }
    get fillMaterialChanged() { return this.fillStyleChanged; }

    get fillMaterialParams() { return this.fillStyle.materialParams; }
    set fillMaterialParams(value: JsonValue | undefined) { this.fillStyle = { ...this.fillStyle, materialParams: value } }
    get fillMaterialParamsChanged() { return this.fillStyleChanged; }

    get fillGround() { return this.fillStyle.ground; }
    set fillGround(value: boolean) { this.fillStyle = { ...this.fillStyle, ground: value } }
    get fillGroundChanged() { return this.fillStyleChanged; }
}

export namespace ESGeoVector {
    export const createDefaultProps = () => ({
        ...ESVisualObject.createDefaultProps(),
        pointed: false,
        pointStyle: reactJson<ESJPointStyle>(ESGeoVector.defaults.pointStyle),
        stroked: false,
        strokeStyle: reactJson<ESJStrokeStyle>(ESGeoVector.defaults.strokeStyle),
        filled: false,
        fillStyle: reactJson<ESJFillStyle>(ESGeoVector.defaults.fillStyle),
        points: reactPositions(undefined),
    });
}
extendClassProps(ESGeoVector.prototype, ESGeoVector.createDefaultProps);
export interface ESGeoVector extends UniteChanged<ReturnType<typeof ESGeoVector.createDefaultProps>> { }
