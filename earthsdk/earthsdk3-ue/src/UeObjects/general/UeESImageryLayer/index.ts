import { EngineObject, ESImageryLayer, ESSceneObject, ESVisualObject } from "earthsdk3"
import { calcFlyToParamCallFunc, ESUeViewer, flyInCallFunc, flyToCallFunc, UeFuncsType } from "../../../ESUeViewer"
import { createNextAnimateFrameEvent, createProcessingFromAsyncFunc, react } from "xbsj-base"


const getTipInfo = (num: number) => {
    switch (num) {
        case 0:
            return '成功绑定'
        case 1:
            return '解绑之前的内容,成功绑定'
        case 2:
            return '没搜索到ActorTag,无法绑定'
        case 3:
            return '搜索到ActorTag对应的Actor是地形,无法绑定'
        case 4:
            return '没搜索到ComponentTag,无法绑定'
        default:
            return '未知错误'
    }
}

export class UeESImageryLayer extends EngineObject<ESImageryLayer> {
    static readonly type = this.register('ESUeViewer', ESImageryLayer.type, this);

    constructor(sceneObject: ESImageryLayer, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);

        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }

        let bindedActorTag: string | undefined = undefined;
        let createdUrl: string | undefined = undefined;
        type RecreatInfoType = ({ type: 'CreatedUrl', url: string } | { type: 'ActorTag', actorTag: string, componentTag: string })
        const recreatInfo = this.dv(react<RecreatInfoType | undefined>(undefined));
        const urlReact = this.dv(ESSceneObject.context.createEnvStrReact([sceneObject, 'url']));

        const updateProps = async () => {
            if (!bindedActorTag && !createdUrl) return
            await viewer.callUeFunc({
                f: 'update',
                p: {
                    id: sceneObject.id,
                    show: sceneObject.show ?? true,
                    rectangle: sceneObject.rectangle ?? [-180, -90, 180, 90],
                    collision: sceneObject.collision ?? true,
                    allowPicking: sceneObject.allowPicking ?? false,
                    flyToParam: sceneObject.flyToParam ?? ESVisualObject.defaults.flyToParam,
                    flyInParam: sceneObject.flyInParam ?? ESVisualObject.defaults.flyInParam,
                    url: urlReact.value ?? "",
                    zIndex: sceneObject.zIndex ?? 0,
                    maximumLevel: sceneObject.maximumLevel ?? ESImageryLayer.defaults.maximumLevel,
                    minimumLevel: sceneObject.minimumLevel ?? ESImageryLayer.defaults.minimumLevel,
                    options: sceneObject.options ?? ESImageryLayer.defaults.options,
                    targetID: sceneObject.targetID,
                }
            })
        };
        const updateEvent = this.dv(createNextAnimateFrameEvent(
            sceneObject.showChanged,
            urlReact.changed,
            sceneObject.flyToParamChanged,
            sceneObject.flyInParamChanged,
            sceneObject.zIndexChanged,
            sceneObject.collisionChanged,
            sceneObject.allowPickingChanged,
            sceneObject.maximumLevelChanged,
            sceneObject.minimumLevelChanged,
            sceneObject.rectangleChanged,
            sceneObject.optionsChanged,
            sceneObject.targetIDChanged,
        ));
        this.d(updateEvent.don(updateProps));

        const unBindOrDestroy = async () => {
            const { id } = sceneObject;
            if (bindedActorTag !== undefined) {
                bindedActorTag = undefined;
                try {
                    const result = await ueViewer.unBindImageryById(id);
                    if (!result) return;
                    if (result.error !== "") {
                        console.warn(`UeESImageryLayer UnImageryByID: ${result.error}`);
                        return;
                    }
                } catch (error) {
                    console.warn(`UeESImageryLayer UnImageryByID promise: ${error}`);
                    return;
                }
            }

            if (createdUrl !== undefined) {
                createdUrl = undefined;
                try {
                    const result = await viewer.callUeFunc<UeFuncsType['destroy']['result']>({ f: 'destroy', p: { id, test: 'UeESImageryLayer' } });
                    if (!result) return;
                    if (result.error !== "") {
                        console.warn(`UeESImageryLayer Destroy: ${result.error}`);
                        return;
                    }
                } catch (error) {
                    console.warn(`UeESImageryLayer Destroy promise: ${error}`);
                    return;
                }
            };
        }

        this.d(() => { unBindOrDestroy(); });
        {
            const processing = this.dv(createProcessingFromAsyncFunc(async cancelsManager => {
                if (recreatInfo.value === undefined) {
                    await cancelsManager.promise(unBindOrDestroy());
                    return;
                }
                if (recreatInfo.value.type === 'ActorTag') {
                    const { actorTag, componentTag } = recreatInfo.value;
                    // 解绑
                    if (bindedActorTag !== actorTag) {
                        await cancelsManager.promise(unBindOrDestroy());
                    }
                    // 绑定
                    if (bindedActorTag !== undefined) return;
                    if (actorTag === undefined) return;

                    try {
                        bindedActorTag = actorTag;
                        const result = await cancelsManager.promise(ueViewer.bindImageryByTag(sceneObject.id, actorTag, componentTag))

                        if (!result) return;
                        if (result.error !== "") {
                            console.warn(`ESImageryLayer BindImageryByTag: ${result.error}`);
                            return;
                        }
                        if (result.re.type === 0) {
                            // do nothing
                        } else if (result.re.type === 1) {
                            console.warn(`ESImageryLayer BindImageryByTag: ${getTipInfo(result.re.type)}`);
                        } else {
                            console.warn(`ESImageryLayer BindImageryByTag: ${getTipInfo(result.re.type)}`);
                            return;
                        }
                    } catch (error) {
                        console.warn(`ESImageryLayer BindImageryByTag promise: ${error}`);
                        return;
                    }
                } else if (recreatInfo.value.type === 'CreatedUrl') {
                    const { url } = recreatInfo.value;
                    // destroy
                    if (url !== createdUrl) {
                        await cancelsManager.promise(unBindOrDestroy());
                    };

                    // create
                    if (createdUrl !== undefined) return;
                    if (url === undefined) return;

                    try {
                        createdUrl = url;
                        const result = await cancelsManager.promise(viewer.callUeFunc<UeFuncsType['create']['result']>({
                            f: 'create',
                            p: {
                                type: 'ESImageryLayer',
                                id: sceneObject.id,
                            }
                        }));

                        if (!result) return;
                        if (result.error !== "") {
                            console.warn(`ESImageryLayer create: ${result.error}`);
                            return;
                        }
                    } catch (error) {
                        console.warn(`ESImageryLayer create: create promise error`);
                        return;
                    }
                }
                // 更新属性
                await cancelsManager.promise(updateProps());
            }));

            const update = async () => { processing.restart(); }
            update();
            this.d(recreatInfo.changed.don(update));
        }

        {
            const event = this.dv(createNextAnimateFrameEvent(
                sceneObject.actorTagChanged,
                urlReact.changed,
                sceneObject.componentTagChanged,
            ));
            const update = () => {
                if (sceneObject.actorTag && sceneObject.componentTag) {
                    recreatInfo.value = {
                        type: 'ActorTag',
                        actorTag: sceneObject.actorTag,
                        componentTag: sceneObject.componentTag,
                    };
                } else if (urlReact.value) {
                    recreatInfo.value = {
                        type: 'CreatedUrl',
                        url: urlReact.value,
                    };
                } else {
                    recreatInfo.value = undefined;
                }
            };
            update();
            this.d(event.don(update));
        }

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
        this.d(sceneObject.flyInEvent.don(async (duration, id) => {
            if (!bindedActorTag && !createdUrl) return
            const res = await flyInCallFunc(viewer, sceneObject.id, sceneObject.flyInParam?.position, sceneObject.flyInParam?.rotation, (duration ?? 1))
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
    }
}
