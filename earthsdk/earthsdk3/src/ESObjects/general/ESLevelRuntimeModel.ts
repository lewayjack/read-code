import { extendClassProps, reactArray, UniteChanged } from "xbsj-base";
import { ESJResource, ESJVector3D, GroupProperty, JsonProperty, Number3Property, NumberProperty, StringProperty } from "../../ESJTypes";
import { ESObjectWithLocation } from "../base";

export class ESLevelRuntimeModel extends ESObjectWithLocation {
    static readonly type = this.register('ESLevelRuntimeModel', this, { chsName: '关卡包模型', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "关卡包模型" });
    get typeName() { return 'ESLevelRuntimeModel'; }
    override get defaultProps() { return ESLevelRuntimeModel.createDefaultProps(); }
    static override defaults = {
        ...ESObjectWithLocation.defaults,
        url: '',
    };
    constructor(id?: string) {
        super(id);
    }
    override getESProperties() {
        const properties = { ...super.getESProperties() };
        return {
            ...properties,
            basic: [
                ...properties.basic,
                new NumberProperty('下载进度', '下载进度', true, true, [this, 'downloadProgress']),
                new StringProperty('levelName', 'levelName', false, false, [this, 'levelName'], ''),
                new NumberProperty('levelLoadDistance', 'levelLoadDistance', false, false, [this, 'levelLoadDistance'], 1000),
                new Number3Property('levelOffset', 'levelOffset', false, false, [this, 'levelOffset'], [0, 0, 0]),
            ],
            dataSource: [
                ...properties.dataSource,
                new JsonProperty('url', 'url', false, false, [this, 'url'], ''),
            ],

        }
    }
    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('通用', '通用', [
                new JsonProperty('url', 'url', false, false, [this, 'url']),
                new StringProperty('levelName', 'levelName', false, false, [this, 'levelName']),
                new NumberProperty('下载进度', '下载进度', true, true, [this, 'downloadProgress']),
                new NumberProperty('levelLoadDistance', 'levelLoadDistance', false, false, [this, 'levelLoadDistance']),
                new Number3Property('levelOffset', 'levelOffset', false, false, [this, 'levelOffset']),
            ]),
        ];
    }
}

export namespace ESLevelRuntimeModel {
    export const createDefaultProps = () => ({
        ...ESObjectWithLocation.createDefaultProps(),
        url: '' as string | ESJResource,
        downloadProgress: 0,
        levelName: '',
        levelOffset: reactArray<ESJVector3D>([0, 0, 0]),
        levelLoadDistance: 1000
    });
}
extendClassProps(ESLevelRuntimeModel.prototype, ESLevelRuntimeModel.createDefaultProps);
export interface ESLevelRuntimeModel extends UniteChanged<ReturnType<typeof ESLevelRuntimeModel.createDefaultProps>> { }
