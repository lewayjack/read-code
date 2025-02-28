import { GroupProperty, Number3sProperty } from "../../ESJTypes";
import { ESLocalVector } from "../base";
import { extendClassProps, reactPositions, UniteChanged } from "xbsj-base";
export class ESLocalPolygonZ extends ESLocalVector {
    static readonly type = this.register('ESLocalPolygonZ', this, { chsName: '局部坐标多边形', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "ESLocalPolygonZ" });
    get typeName() { return 'ESLocalPolygonZ'; }
    override get defaultProps() { return { ...ESLocalPolygonZ.createDefaultProps() }; }
    constructor(id?: string) {
        super(id);
        this.filled = true;
    }

    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('通用', '通用', [
                new Number3sProperty('本地位置数组', '本地位置数组', true, false, [this, 'points']),
            ]),
        ];
    }
}

export namespace ESLocalPolygonZ {
    export const createDefaultProps = () => ({
        ...ESLocalVector.createDefaultProps(),
        points: reactPositions(undefined),
    });
}
extendClassProps(ESLocalPolygonZ.prototype, ESLocalPolygonZ.createDefaultProps);
export interface ESLocalPolygonZ extends UniteChanged<ReturnType<typeof ESLocalPolygonZ.createDefaultProps>> { }
