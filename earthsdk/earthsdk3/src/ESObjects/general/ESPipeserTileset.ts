import { EnumProperty, FunctionProperty, GroupProperty } from "../../ESJTypes";
import { Event, extendClassProps, UniteChanged } from "xbsj-base";
import { ES3DTileset } from "./ES3DTileset";

/**
 * https://www.wolai.com/earthsdk/oTfNEhFjwzUwkKHrHvSG2H
 */
export class ESPipeserTileset extends ES3DTileset {
    static override readonly type = this.register('ESPipeserTileset', this, { chsName: 'PipeSer图层', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "PipeSer图层" });
    override get typeName() { return 'ESPipeserTileset'; }
    override get defaultProps() { return ESPipeserTileset.createDefaultProps(); }

    static description = {
        colorMode: [["default", 'default'], ['color', 'color'], ['blend', 'blend']] as [string, string][],
    }

    private _setLayerVisibleEvent = this.dv(new Event<[name: string, layerJson: string | ({ [key: string]: any }[])]>());
    get setLayerVisibleEvent() { return this._setLayerVisibleEvent; }
    setLayerVisible(name: string, layerJson: string | ({ [key: string]: any }[])) { this._setLayerVisibleEvent.emit(name, layerJson); }

    private _setLayerColorEvent = this.dv(new Event<[name: string, layerJson: string | ({ [key: string]: any }[])]>());
    get setLayerColorEvent() { return this._setLayerColorEvent; }
    setLayerColor(name: string, layerJson: string | ({ [key: string]: any }[])) { this._setLayerColorEvent.emit(name, layerJson); }

    constructor(id?: string) {
        super(id);
    }

    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('ESPipeserTileset', 'ESPipeserTileset', [
                new FunctionProperty("setLayerVisible", "setLayerVisible", ['string', 'string'], (name, layerJson) => this.setLayerVisible(name, layerJson), ['', '']),
                new FunctionProperty("setLayerColor", "setLayerColor", ['string', 'string'], (name, layerJson) => this.setLayerColor(name, layerJson), ['', '']),
                new EnumProperty('colorMode', 'colorMode', true, false, [this, 'colorMode'], ESPipeserTileset.description.colorMode, 'default'),
            ]),
        ]
    }
}

export namespace ESPipeserTileset {
    export const createDefaultProps = () => ({
        colorMode: 'default',
        ...ES3DTileset.createDefaultProps(),
    });
}
extendClassProps(ESPipeserTileset.prototype, ESPipeserTileset.createDefaultProps);
export interface ESPipeserTileset extends UniteChanged<ReturnType<typeof ESPipeserTileset.createDefaultProps>> { }
