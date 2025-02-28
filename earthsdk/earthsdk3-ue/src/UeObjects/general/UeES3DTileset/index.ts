import { EngineObject, ES3DTileset, ESJFeatureStyleType, ESJResource, ESVisualObject, FeatureColorJsonType, FeatureVisableJsonType } from "earthsdk3"
import { createNextAnimateFrameEvent, createProcessingFromAsyncFunc, react } from "xbsj-base"
import { calcFlyToParamCallFunc, flyToCallFunc, refreshTilesetCallFunc, unBind3DTilesetByIdCallFunc } from "../../../ESUeViewer/uemsg/CallUeFuncs"
import { UeFuncsType } from "../../../ESUeViewer/uemsg/UeFuncsType"
import { ESUeViewer } from "@ueSrc/ESUeViewer"

const getTipInfo = (num: number) => {
    switch (num) {
        case 0:
            return '成功绑定'
        case 1:
            return '解绑之前的内容,成功绑定'
        case 2:
            return '没搜索到ActorTag,无法绑定'
        case 3:
            return '搜索到ActorTag但对应的Actor不是3dTileset,无法绑定'
        default:
            return '未知错误'
    }
}

export class UeES3DTileset<T extends ES3DTileset = ES3DTileset> extends EngineObject<T> {
    static readonly type = this.register<ES3DTileset, ESUeViewer>('ESUeViewer', ES3DTileset.type, this);
    constructor(sceneObject: T, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);

        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`UeES3DTileset: viewer is undefined!`);
            return;
        }
        let bindedActorTag: string | undefined = undefined;
        let createdUrl: string | undefined | ESJResource = undefined;

        const updateProps = async () => {
            if (!bindedActorTag && !createdUrl) return
            await viewer.callUeFunc({
                f: 'update',
                p: {
                    id: sceneObject.id,
                    url: sceneObject.url,
                    show: sceneObject.show,
                    collision: sceneObject.collision,
                    allowPicking: sceneObject.allowPicking,
                    flyToParam: sceneObject.flyToParam ?? ESVisualObject.defaults.flyToParam,
                    flyInParam: sceneObject.flyInParam ?? ESVisualObject.defaults.flyInParam,
                    highlightID: sceneObject.highlightID,
                    highlightColor: sceneObject.highlightColor,
                    highlight: sceneObject.highlight,
                    materialMode: sceneObject.materialMode,
                    maximumScreenSpaceError: sceneObject.maximumScreenSpaceError,
                    //ESPipeserTileset 属性更新
                    //@ts-ignore
                    colorMode: Reflect.has(sceneObject, 'colorMode') ? sceneObject.colorMode : undefined,
                    offset: sceneObject.offset,
                    editing: sceneObject.editing,
                    rotationEditing: sceneObject.rotationEditing,
                    rotation: sceneObject.rotation,
                    cacheBytes: sceneObject.cacheBytes,
                    colorBlendMode: sceneObject.colorBlendMode,
                }
            })
        };
        const updateEvent = this.dv(createNextAnimateFrameEvent(
            sceneObject.urlChanged,
            sceneObject.showChanged,
            sceneObject.flyToParamChanged,
            sceneObject.flyInParamChanged,
            sceneObject.collisionChanged,
            sceneObject.allowPickingChanged,
            sceneObject.highlightIDChanged,
            sceneObject.highlightColorChanged,
            sceneObject.highlightChanged,
            sceneObject.materialModeChanged,
            sceneObject.maximumScreenSpaceErrorChanged,
            sceneObject.offsetChanged,
            sceneObject.editingChanged,
            sceneObject.rotationEditingChanged,
            sceneObject.rotationChanged,
            sceneObject.cacheBytesChanged,
            sceneObject.colorBlendModeChanged,
        ));
        updateProps()
        this.d(updateEvent.don(updateProps));

        {
            //ESPipeserTileset 属性更新
            const flag = Reflect.has(sceneObject, 'colorMode')
            if (flag) {
                //@ts-ignore
                this.d(sceneObject.colorModeChanged.don(() => updateProps()));
            }
        }

        type RecreatInfoType = ({ type: 'CreatedUrl', url: string | ESJResource } | { type: 'ActorTag', actorTag: string })
        const recreatInfo = this.dv(react<RecreatInfoType | undefined>(undefined));

        {
            const event = this.dv(createNextAnimateFrameEvent(
                sceneObject.actorTagChanged,
                sceneObject.urlChanged,
            ));
            const update = () => {
                if (sceneObject.actorTag) {
                    recreatInfo.value = {
                        type: 'ActorTag',
                        actorTag: sceneObject.actorTag,
                    };
                } else if (sceneObject.url) {
                    recreatInfo.value = {
                        type: 'CreatedUrl',
                        url: sceneObject.url,
                    };
                } else {
                    recreatInfo.value = undefined;
                }
                sceneObject.editing = false;
            };
            update();
            this.d(event.don(update));
        }

        const unBindOrDestroy = async () => {
            const { id } = sceneObject;
            if (bindedActorTag !== undefined) {
                bindedActorTag = undefined;
                try {
                    const result = await ueViewer.unBind3DTilesetById(id);
                    if (!result) return;
                    if (result.error !== "") {
                        console.warn(`UeES3DTileset UnBind3DTilesetById: ${result.error}`);
                        return;
                    }
                } catch (error) {
                    console.warn(`UeES3DTileset UnBind3DTilesetById: ${error}`);
                    return;
                }
            }

            if (createdUrl !== undefined) {
                createdUrl = undefined;
                try {
                    const result = await viewer.callUeFunc<UeFuncsType['destroy']['result']>({ f: 'destroy', p: { id } });
                    if (!result) return;
                    if (result.error !== "") {
                        console.warn(`UeES3DTileset Destroy: ${result.error}`);
                        return;
                    }
                } catch (error) {
                    console.warn(`UeES3DTileset Destroy: ${error}`);
                    return;
                }
            };
        }

        this.d(() => { unBindOrDestroy() });
        {
            const processing = this.dv(createProcessingFromAsyncFunc(async cancelsManager => {
                if (recreatInfo.value === undefined) {
                    await cancelsManager.promise(unBindOrDestroy());
                    return;
                }
                if (recreatInfo.value.type === 'ActorTag') {
                    const { actorTag } = recreatInfo.value;

                    // 解绑
                    if (bindedActorTag !== actorTag) {
                        await cancelsManager.promise(unBindOrDestroy());
                    }

                    // 绑定
                    if (bindedActorTag !== undefined) return;
                    if (actorTag === undefined) return;

                    try {
                        bindedActorTag = actorTag;
                        const result = await cancelsManager.promise(ueViewer.bind3DTilesetByTag(sceneObject.id, actorTag))

                        if (!result) return;
                        if (result.error !== "") {
                            console.warn(`UeES3DTileset Bind3DTilesetByTag: ${result.error}`);
                            return;
                        }
                        if (result.re.type === 0) {
                            // do nothing
                        } else if (result.re.type === 1) {
                            console.warn(`UeES3DTileset Bind3DTilesetByTag: ${getTipInfo(result.re.type)}`);
                        } else {
                            console.warn(`UeES3DTileset Bind3DTilesetByTag: ${getTipInfo(result.re.type)}`);
                            return;
                        }
                    } catch (error) {
                        console.warn(`UeES3DTileset Bind3DTilesetByTag: ${error}`);
                        return;
                    }
                } else if (recreatInfo.value.type === 'CreatedUrl') {
                    const { url } = recreatInfo.value;

                    // destroy
                    if (url !== createdUrl) {
                        await unBindOrDestroy();
                    };

                    // create
                    if (createdUrl !== undefined) return;
                    if (url === undefined) return;

                    try {
                        createdUrl = url;
                        const result = await cancelsManager.promise(viewer.callUeFunc<UeFuncsType['create']['result']>({
                            f: 'create',
                            p: {
                                type: sceneObject.typeName,
                                id: sceneObject.id
                            }
                        }));

                        if (!result) return;
                        if (result.error !== "") {
                            console.warn(`UeES3DTileset create: ${result.error}`);
                            return;
                        }
                    } catch (error) {
                        console.warn(`UeES3DTileset create: ${error}`);
                        return;
                    }
                }

                // 更新属性
                await cancelsManager.promise(updateProps());
            }));

            const update = async () => {
                processing.restart();
            }
            update();
            this.d(recreatInfo.changed.don(update));
        }

        this.d(sceneObject.refreshTilesetEvent.don(() => {
            refreshTilesetCallFunc(viewer, sceneObject.id)
        }));

        this.d(sceneObject.flyToEvent.don(async (duration, id) => {
            if (!bindedActorTag && !createdUrl) return
            const res = await flyToCallFunc(viewer, sceneObject.id, duration)
            let mode: 'cancelled' | 'over' | 'error' = 'over';
            if (res === undefined) {
                mode = 'error'
            } else if (res.endType === 0) {
                mode = 'over'
            } else if (res.endType === 1) {
                mode = 'cancelled'
            }
            sceneObject.flyOverEvent.emit(id, mode, ueViewer);
        }));

        this.d(sceneObject.calcFlyToParamEvent.don(() => {
            if (!bindedActorTag && !createdUrl) return
            calcFlyToParamCallFunc(viewer, sceneObject.id)

        }));

        this.d(sceneObject.calcFlyInParamEvent.don(async () => {
            if (!bindedActorTag && !createdUrl) return
            if (!ueViewer.actived) return;
            const cameraInfo = await ueViewer.getCurrentCameraInfo();
            if (!cameraInfo) return;
            const { position, rotation } = cameraInfo;
            sceneObject.flyInParam = { position, rotation, flyDuration: 1 };
        }));


        this.d(ueViewer.propChanged.don((info) => {
            if (!bindedActorTag && !createdUrl) return
            if (info.objId !== sceneObject.id) return
            Object.keys(info.props).forEach(key => {
                const prop = info.props[key] === null ? undefined : info.props[key]
                //@ts-ignore
                sceneObject[key] = prop
            });
        }));

        this.d(ueViewer.objectEvent.don((info) => {
            if (!bindedActorTag && !createdUrl) return;
            if (info.id !== sceneObject.id || info.type !== '3DTilesetReady') return;
            sceneObject.tilesetReady.emit(info.p);
        }));

        {
            const setFeatureColor = async (featureName: string, json: FeatureColorJsonType[]) => {
                if (!bindedActorTag && !createdUrl) return
                const result = await viewer.callUeFunc({
                    f: 'SetFeatureColor',
                    p: { id: sceneObject.id, featureName, json }
                })
                if (!result) return;
                //@ts-ignore
                if (result.error !== "") {
                    //@ts-ignore
                    console.warn(`UeES3DTileset SetFeatureColor: ${result.error}`);
                    return;
                }
            };
            const setFeatureVisable = async (featureName: string, json: FeatureVisableJsonType[]) => {
                if (!bindedActorTag && !createdUrl) return
                const result = await viewer.callUeFunc({
                    f: 'SetFeatureVisable',
                    p: { id: sceneObject.id, featureName, json }
                })
                if (!result) return;
                //@ts-ignore
                if (result.error !== "") {
                    //@ts-ignore
                    console.warn(`UeES3DTileset SetFeatureVisable: ${result.error}`);
                    return;
                }
            };
            const resetFeatureStyle = async () => {
                if (!bindedActorTag && !createdUrl) return
                const result = await viewer.callUeFunc({
                    f: 'ResetFeatureStyle',
                    p: { id: sceneObject.id }
                })
                if (!result) return;
                //@ts-ignore
                if (result.error !== "") {
                    //@ts-ignore
                    console.warn(`UeES3DTileset ResetFeatureStyle: ${result.error}`);
                    return;
                }
            };
            const setFeatureStyle = async (json: ESJFeatureStyleType) => {
                if (!bindedActorTag && !createdUrl) return;
                const result = await viewer.callUeFunc({
                    f: 'SetFeatureStyle',
                    p: { id: sceneObject.id, json }
                })
                if (!result) return;
                //@ts-ignore
                if (result.error !== "") {
                    //@ts-ignore
                    console.warn(`UeES3DTileset SetFeatureStyle: ${result.error}`);
                    return;
                }
            };
            this.d(sceneObject.setFeatureColorEvent.don((name, json) => {
                const features = [...this.styleColor, ...json];
                this.styleColor = [...features];
                setFeatureColor(name, features)
            }));
            this.d(sceneObject.setFeatureVisableEvent.don((name, json) => {
                const features = [...this.styleVisable, ...json];
                this.styleVisable = [...features];
                setFeatureVisable(name, features)
            }));
            this.d(sceneObject.resetFeatureStyleEvent.don(() => {
                resetFeatureStyle();
                this.styleColor = [];
                this.styleVisable = [];
            }));

            this.d(sceneObject.setFeatureStyleEvent.don((json) => { setFeatureStyle(json) }));
        }

        {
            type GetFeatureTableResType = {
                re: {
                    table: { key: string, type: string | number }[];
                }
                error: string | undefined;
            }

            const getFeatureTable = async () => {
                if (!bindedActorTag && !createdUrl) {
                    sceneObject._featureTableResultEvent.emit(undefined);
                    return;
                };
                try {
                    const result = await viewer.callUeFunc<GetFeatureTableResType>({
                        f: 'GetFeatureTable',
                        p: { id: sceneObject.id }
                    })
                    if (result.error !== "") {
                        console.warn(`UeES3DTileset GetFeatureTable: ${result.error}`);
                    }
                    sceneObject._featureTableResultEvent.emit(result.re.table);
                } catch (error) {
                    console.warn(`UeES3DTileset GetFeatureTable: ${error}`);
                    sceneObject._featureTableResultEvent.emit(undefined);
                }
            };

            this.d(sceneObject.getFeatureTableEvent.don(() => { getFeatureTable() }));
        }

    }

    private _styleColor = this.dv(react<FeatureColorJsonType[]>([]));
    get styleColor() { return this._styleColor.value; }
    set styleColor(value: FeatureColorJsonType[]) { this._styleColor.value = value; }

    private _styleVisable = this.dv(react<FeatureVisableJsonType[]>([]));
    get styleVisable() { return this._styleVisable.value; }
    set styleVisable(value: FeatureVisableJsonType[]) { this._styleVisable.value = value; }
}
