import { extendClassProps, JsonValue, reactJsonWithUndefined, UniteChanged } from "xbsj-base";
import { ESJResource, GroupProperty, JsonProperty, NumberProperty } from "../../ESJTypes";
import { ESObjectWithLocation } from "../base";

export class ESDatasmithRuntimeModel extends ESObjectWithLocation {
    static readonly type = this.register('ESDatasmithRuntimeModel', this, { chsName: 'Datasmith Model', tags: ['ESObjects', '_ES_Impl_Cesium', '_ES_Impl_UE'], description: "Datasmith Model" });
    get typeName() { return 'ESDatasmithRuntimeModel'; }
    override get defaultProps() { return ESDatasmithRuntimeModel.createDefaultProps(); }

    static override defaults = {
        ...ESObjectWithLocation.defaults,
        url: '',
        importOptions: {
            buildCollisions: "QueryAndPhysics",
            buildHierarchy: "Simplified",
            collisionType: "CTF_UseComplexAsSimple",
            bImportMetaData: true
        },
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
                new JsonProperty('importOptions', '导入参数', true, false, [this, 'importOptions'], ESDatasmithRuntimeModel.defaults.importOptions),
            ],
            dataSource: [
                ...properties.dataSource,
                new JsonProperty('路径', 'url', false, false, [this, 'url']),
            ],

        }
    }
    override getProperties(language?: string) {
        return [
            ...super.getProperties(language),
            new GroupProperty('通用', '通用', [
                new JsonProperty('url', 'url', false, false, [this, 'url']),
                new NumberProperty('下载进度', '下载进度', true, true, [this, 'downloadProgress']),
                new JsonProperty('importOptions', '导入参数', true, false, [this, 'importOptions'], ESDatasmithRuntimeModel.defaults.importOptions),
            ]),
        ];
    }
}

export namespace ESDatasmithRuntimeModel {
    export const createDefaultProps = () => ({
        ...ESObjectWithLocation.createDefaultProps(),
        url: '' as string | ESJResource,
        importOptions: reactJsonWithUndefined<JsonValue | undefined>(undefined),
        downloadProgress: 0
    });
}
extendClassProps(ESDatasmithRuntimeModel.prototype, ESDatasmithRuntimeModel.createDefaultProps);
export interface ESDatasmithRuntimeModel extends UniteChanged<ReturnType<typeof ESDatasmithRuntimeModel.createDefaultProps>> { }
