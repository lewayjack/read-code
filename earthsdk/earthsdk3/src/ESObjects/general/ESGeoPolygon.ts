import { ESJFillStyle, ESJStrokeStyle, GroupProperty } from "../../ESJTypes";
import { ESGeoVector } from "../base/ESGeoVector";
import { extendClassProps, UniteChanged } from "xbsj-base";

export class ESGeoPolygon extends ESGeoVector {
    static readonly type = this.register('ESGeoPolygon', this, { chsName: '地理多边形', tags: ['ESObjects'], description: "地理多边形" });
    get typeName() { return 'ESGeoPolygon'; }
    override get defaultProps() { return ESGeoPolygon.createDefaultProps(); }

    static override defaults = {
        ...ESGeoVector.defaults,
        fillStyle: {
            color: [1, 1, 1, 0.5],
            material: '',
            materialParams: {},
            ground: false,
        } as ESJFillStyle,
        strokeStyle: {
            width: 1,
            widthType: 'screen',
            color: [1, 1, 1, 1],
            material: '',
            materialParams: {},
            ground: false,
        } as ESJStrokeStyle,
        filled: true,
        stroked: false,
        collision: false
    };

    constructor(id?: string) {
        super(id);
        this.collision = ESGeoPolygon.defaults.collision;
        this.filled = ESGeoPolygon.defaults.filled;
        this.stroked = ESGeoPolygon.defaults.stroked;
        this.fillStyle = ESGeoPolygon.defaults.fillStyle;
        this.strokeStyle = ESGeoPolygon.defaults.strokeStyle;
    }

    override getProperties(language: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('ESGeoPolygon', 'ESGeoPolygon', [

            ]),
        ];
    }
}

export namespace ESGeoPolygon {
    export const createDefaultProps = () => ({
        ...ESGeoVector.createDefaultProps(),
    });
}
extendClassProps(ESGeoPolygon.prototype, ESGeoPolygon.createDefaultProps);
export interface ESGeoPolygon extends UniteChanged<ReturnType<typeof ESGeoPolygon.createDefaultProps>> { }
