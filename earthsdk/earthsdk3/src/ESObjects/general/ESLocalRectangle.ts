import { GroupProperty, NumberProperty } from "../../ESJTypes";
import { ESLocalVector2D } from "../base";
import { extendClassProps, UniteChanged } from "xbsj-base";
export class ESLocalRectangle extends ESLocalVector2D {
    static readonly type = this.register('ESLocalRectangle', this, { chsName: '局部坐标四边形', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "ESLocalRectangle" });
    get typeName() { return 'ESLocalRectangle'; }
    override get defaultProps() { return { ...ESLocalRectangle.createDefaultProps() }; }

    static override defaults = {
        ...ESLocalVector2D.defaults,
        width: 500000,
        height: 300000,
    };
    constructor(id?: string) {
        super(id);
        this.filled = true;
    }

    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('ESLocalRectangle', 'ESLocalRectangle', [
                new NumberProperty('宽度', '宽度', false, false, [this, 'width']),
                new NumberProperty('高度', '高度', false, false, [this, 'height']),
            ]),
        ];
    }
}

export namespace ESLocalRectangle {
    export const createDefaultProps = () => ({
        ...ESLocalVector2D.createDefaultProps(),
        width: 500000,
        height: 300000,
    });
}
extendClassProps(ESLocalRectangle.prototype, ESLocalRectangle.createDefaultProps);
export interface ESLocalRectangle extends UniteChanged<ReturnType<typeof ESLocalRectangle.createDefaultProps>> { }
