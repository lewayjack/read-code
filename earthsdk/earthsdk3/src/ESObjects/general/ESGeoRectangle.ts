import { extendClassProps, react, UniteChanged } from "xbsj-base";
import { ESGeoVector } from "../base";
import { geoArea, getDistancesFromPositions } from "../../utils";
import { ESJVector3DArray, GroupProperty, NumberProperty } from "../../ESJTypes";

/**
 * https://www.wolai.com/earthsdk/pxKbJ5g7Sf59UJgqwZpyzc
 */
export class ESGeoRectangle extends ESGeoVector {
    static readonly type = this.register('ESGeoRectangle', this, { chsName: '矩形', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "矩形" });
    get typeName() { return 'ESGeoRectangle'; }
    override get defaultProps() { return ESGeoRectangle.createDefaultProps(); }

    toPolygon() {
        if (this.points && this.points.length >= 2) {
            const pos0 = [...this.points][0]
            const pos1 = [...this.points][1]
            return [pos0, [pos0[0], pos1[1], pos0[2]], pos1, [pos1[0], pos0[1], pos1[2]]] as ESJVector3DArray
        } else {
            return undefined
        }
    }

    override _updateArea() {
        if (this.points && this.points.length >= 2) {
            const val = [...this.points]
            const pos0 = val[0]
            const pos1 = val[1]
            const pos = [pos0, [pos0[0], pos1[1], pos0[2]], pos1, [pos1[0], pos0[1], pos1[2]]] as ESJVector3DArray
            this._area.value = geoArea(pos)
        } else {
            this._area.value = 0;
        }
    }
    override _updatePerimeter() {
        if (this.points && this.points.length >= 2) {
            const val = [...this.points]
            const pos0 = val[0]
            const pos1 = val[1]
            const pos = [pos0, [pos0[0], pos1[1], pos0[2]], pos1, [pos1[0], pos0[1], pos1[2]]] as ESJVector3DArray
            const posi = [...pos, pos[0]];
            const distance = getDistancesFromPositions(posi, 'NONE');
            const totalDistance = distance[distance.length - 1];
            this._perimeter.value = totalDistance;
        } else {
            this._perimeter.value = 0;
        }
    }

    constructor(id?: string) {
        super(id);
        this.collision = false;
        this.stroked = true;
        this.filled = true;
        this.fillStyle = {
            color: [1, 1, 1, 0.5],
            material: '',
            materialParams: {},
            ground: false,
        };
    }
    static override defaults = { ...ESGeoVector.defaults }

    override getESProperties() {
        return { ...super.getESProperties() };
    };

    override getProperties(language: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('计算', '计算', [
                new NumberProperty('面积', '面积', false, true, [this, 'area']),
                new NumberProperty('周长', '周长', false, true, [this, 'perimeter'])
            ]),
        ];
    }
}

export namespace ESGeoRectangle {
    export const createDefaultProps = () => ({
        ...ESGeoVector.createDefaultProps(),
    })
}
extendClassProps(ESGeoRectangle.prototype, ESGeoRectangle.createDefaultProps);
export interface ESGeoRectangle extends UniteChanged<ReturnType<typeof ESGeoRectangle.createDefaultProps>> { };

