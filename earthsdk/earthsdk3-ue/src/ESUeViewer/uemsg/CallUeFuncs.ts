
import { AttachedPickedInfo, ESJVector2DArray, ESJVector3D, ESSceneObject, PickedInfo, PickedResult } from "earthsdk3";
import { UeCloudViewerBase } from "./UeCloudViewerBase";
import { ESFlyToParam, NavigationModeCallFuncParam, UeFuncsType, UePickedInfo } from "./UeFuncsType";

const flyToCallFunc = async (viewer: UeCloudViewerBase, id?: string, duration?: number, flyToParam?: ESFlyToParam, position?: ESJVector3D) => {
    const res = await viewer.callUeFunc<UeFuncsType['flyTo']['result']>({
        f: 'flyTo',
        p: { id, duration, flyToParam, position }
    })
    if (res.error) {
        console.error(res.error);
        return undefined;
    }
    return res.re;
}
const destroyCallFunc = async (viewer: UeCloudViewerBase, id: string) => {
    const res = await viewer.callUeFunc<UeFuncsType['destroy']['result']>({ f: 'destroy', p: { id } });
    res.error && console.error(res.error);
    return res;
}

const calcFlyToParamCallFunc = (viewer: UeCloudViewerBase, id: string) => {
    viewer.callUeFunc<UeFuncsType['calcFlyToParam']['result']>({
        f: 'calcFlyToParam',
        p: { id }
    }).then(res => {
        if (res.error) {
            console.error(`calcFlyToParam:`, res.error)
        }
    }).catch(err => {
        console.error(`calcFlyToParam:`, err)
    })
}
const refreshTilesetCallFunc = (viewer: UeCloudViewerBase, id: string) => {
    viewer.callUeFunc<UeFuncsType['refreshTileset']['result']>({
        f: 'refreshTileset',
        p: { id }
    }).then(res => {
        if (res.error) {
            console.error(`refreshTileset:`, res.error)
        }
    }).catch(err => {
        console.error(`refreshTileset:`, err)
    })
}
const flyInCallFunc = async (viewer: UeCloudViewerBase, id?: string, position?: ESJVector3D, rotation?: ESJVector3D, duration?: number) => {
    const res = await viewer.callUeFunc<UeFuncsType['flyIn']['result']>({
        f: 'flyIn',
        p: { id, position, rotation, duration }
    })
    if (res.error) {
        console.error(res.error);
        return undefined;
    }
    return res.re;
}
const flyInDefaultCameraCallFunc = async (viewer: UeCloudViewerBase, Duration?: number) => {
    if (!viewer) {
        console.warn('DefaultCameraFlyIn: viewer is undefined')
        return;
    }
    const res = await viewer.callUeFunc<UeFuncsType['DefaultCameraFlyIn']['result']>({
        f: 'DefaultCameraFlyIn',
        p: { Duration: Duration ?? 1 }
    })
    if (res.error) {
        console.error(`DefaultCameraFlyIn:`, res.error)
        return undefined;
    }
    return res;
}
const startVoiceCallFunc = async (viewer: UeCloudViewerBase) => {
    if (!viewer) {
        console.warn('StartVoice:viewer is undefined');
        return;
    }
    const res = await viewer.callUeFunc<UeFuncsType['StartVoice']['result']>({
        f: 'StartVoice',
        p: {}
    })
    if (res.error) {
        console.error(`StartVoice:`, res.error);
        return undefined;
    }
    return res;
}
const stopVoiceCallFunc = async (viewer: UeCloudViewerBase) => {
    if (!viewer) {
        console.warn('StopVoice:viewer is undefined');
        return;
    }
    const res = await viewer.callUeFunc<UeFuncsType['StopVoice']['result']>({
        f: 'StopVoice',
        p: {}
    })
    if (res.error) {
        console.error(`StopVoice:`, res.error);
        return undefined;
    }
    return res;
}
const generateMemReportCallFunc = async (viewer: UeCloudViewerBase) => {
    if (!viewer) {
        console.warn('generateMemReport:viewer is undefined');
        return;
    }
    const res = await viewer.callUeFunc<UeFuncsType['GenerateMemReport']['result']>({
        f: 'GenerateMemReport',
        p: {}
    })
    if (res.error) {
        console.error(`generateMemReport:`, res.error);
        return undefined;
    }
    return res;
}
const resetWithCurrentCameraCallFunc = async (viewer: UeCloudViewerBase, id: string) => {
    const res = await viewer.callUeFunc<UeFuncsType['resetWithCurrentCamera']['result']>({
        f: 'resetWithCurrentCamera',
        p: { id }
    })
    if (res.error) {
        console.error(`resetWithCurrentCamera:`, res.error);
    }
    return res;
}
const smoothMoveWithRotationCallFunc = (viewer: UeCloudViewerBase, id: string, Destination: ESJVector3D, NewRotation: ESJVector3D, Time: number) => {
    viewer.callUeFunc<UeFuncsType['smoothMoveWithRotation']['result']>({
        f: 'smoothMoveWithRotation',
        p: {
            id,
            Destination,
            NewRotation,
            Time
        }
    }).then(res => {
        if (res.error) {
            console.error(`smoothMoveWithRotation:`, res.error)
        }
    }).catch(err => {
        console.error(`smoothMoveWithRotation:`, err)
    })
}
const smoothMoveOnGroundCallFunc = (viewer: UeCloudViewerBase, id: string, Lon: number, Lat: number, Ground: string, Time: number) => {
    viewer.callUeFunc<UeFuncsType['smoothMoveOnGround']['result']>({
        f: 'smoothMoveOnGround',
        p: { id, Lon, Lat, Ground, Time }
    }).then(res => {
        if (res.error) {
            console.error(`smoothMoveOnGround:`, res.error)
        }
    }).catch(err => {
        console.error(`smoothMoveOnGround:`, err)
    })
}
const smoothMoveWithRotationOnGroundCallFunc = (viewer: UeCloudViewerBase, id: string, NewRotation: ESJVector3D, Lon: number, Lat: number, Time: number, Ground: string) => {
    viewer.callUeFunc<UeFuncsType['smoothMoveWithRotationOnGround']['result']>({
        f: 'smoothMoveWithRotationOnGround',
        p: {
            id,
            NewRotation, Lon, Lat, Time, Ground
        }
    }).then(res => {
        if (res.error) {
            console.error(`smoothMoveWithRotationOnGround:`, res.error)
        }
    }).catch(err => {
        console.error(`smoothMoveWithRotationOnGround:`, err)
    })
}
const HighlightFeatureCallFunc = (viewer: UeCloudViewerBase, id: string, HlId: string) => {
    viewer.callUeFunc<UeFuncsType['HighlightFeature']['result']>({
        f: 'HighlightFeature',
        p: { id, HlId }
    }).then(res => {
        if (res.error) {
            console.error(`HighlightFeature:`, res.error)
        }
    }).catch(err => {
        console.error(`HighlightFeature:`, err)
    })
}
const HighlightFeatureAndFlyToCallFunc = (viewer: UeCloudViewerBase, id: string, HlId: string, Duration: number) => {
    viewer.callUeFunc<UeFuncsType['HighlightFeatureAndFlyTo']['result']>({
        f: 'HighlightFeatureAndFlyTo',
        p: { id, HlId, Duration }
    }).then(res => {
        if (res.error) {
            console.error(`HighlightFeatureAndFlyTo:`, res.error)
        }
    }).catch(err => {
        console.error(`HighlightFeatureAndFlyTo:`, err)
    })
}
const SetLayerVisibleCallFunc = (viewer: UeCloudViewerBase, id: string, LayerJson: string) => {
    viewer.callUeFunc<UeFuncsType['SetLayerVisible']['result']>({
        f: 'SetLayerVisible',
        p: { id, LayerJson }
    }).then(res => {
        if (res.error) {
            console.error(`SetLayerVisible:`, res.error)
        }
    }).catch(err => {
        console.error(`SetLayerVisible:`, err)
    })
}
const SetLayerColorCallFunc = (viewer: UeCloudViewerBase, id: string, LayerJson: string) => {
    viewer.callUeFunc<UeFuncsType['SetLayerColor']['result']>({
        f: 'SetLayerColor',
        p: { id, LayerJson }
    }).then(res => {
        if (res.error) {
            console.error(`SetLayerColor:`, res.error)
        }
    }).catch(err => {
        console.error(`SetLayerColor:`, err)
    })
}
const smoothMoveCallFunc = (viewer: UeCloudViewerBase, id: string, Destination: ESJVector3D, Time: number) => {
    viewer.callUeFunc<UeFuncsType['smoothMove']['result']>({
        f: 'smoothMove',
        p: {
            id,
            Destination,
            Time
        }
    }).then(res => {
        if (res.error) {
            console.error(`smoothMove:`, res.error)
        }
    }).catch(err => {
        console.error(`smoothMove:`, err)
    })
}
const callFunctionCallFunc = (viewer: UeCloudViewerBase, id: string, fn: string, p: { [k: string]: any; }) => {
    viewer.callUeFunc<UeFuncsType['callFunction']['result']>({
        f: 'callFunction',
        p: {
            id,
            fn, p
        }
    }).then(res => {
        if (res.error) {
            console.error(`callFunction:`, res.error);
            console.error(`id: ${id} fn: ${fn} param: ${p}`);
        }
    }).catch(err => {
        console.error(`callFunction:`, err)
        console.error(`id: ${id} fn: ${fn} param: ${p}`);
    })
}
const setNodePositionCallFunc = (viewer: UeCloudViewerBase, id: string, NodeName: string, NodePosition: ESJVector3D) => {
    viewer.callUeFunc<UeFuncsType['SetNodePosition']['result']>({
        f: 'SetNodePosition',
        p: {
            id, NodeName, NodePosition
        }
    }).then(res => {
        if (res.error) {
            console.error(`SetNodePosition:`, res.error);
        }
    }).catch(err => {
        console.error(`SetNodePosition:`, err)
    })

}
const setNodeRotationCallFunc = (viewer: UeCloudViewerBase, id: string, NodeName: string, NodeRotation: ESJVector3D) => {
    viewer.callUeFunc<UeFuncsType['SetNodeRotation']['result']>({
        f: 'SetNodeRotation',
        p: {
            id, NodeName, NodeRotation
        }
    }).then(res => {
        if (res.error) {
            console.error(`SetNodeRotation:`, res.error);
        }
    }).catch(err => {
        console.error(`SetNodeRotation:`, err)
    })

}
const setNodeScaleCallFunc = (viewer: UeCloudViewerBase, id: string, NodeName: string, NodeScale: ESJVector3D) => {
    viewer.callUeFunc<UeFuncsType['SetNodeScale']['result']>({
        f: 'SetNodeScale',
        p: {
            id, NodeName, NodeScale
        }
    }).then(res => {
        if (res.error) {
            console.error(`SetNodeScale:`, res.error);
        }
    }).catch(err => {
        console.error(`SetNodeScale:`, err)
    })

}
const changeNavigationModeCallFunc = async (viewer: UeCloudViewerBase, parms: NavigationModeCallFuncParam) => {
    const res = await viewer.callUeFunc<UeFuncsType['ChangeNavigationMode']['result']>({
        f: 'ChangeNavigationMode',
        p: parms
    })
    if (res.error) {
        console.error(`ChangeNavigationMode:`, res.error)
        return undefined;
    }
    return res;
}
const setGlobalPropertyCallFunc = async (viewer: UeCloudViewerBase, params: { [k: string]: any; }) => {
    const res = await viewer.callUeFunc<UeFuncsType['setGlobalProperty']['result']>({
        f: 'setGlobalProperty',
        p: params
    })
    if (res.error) {
        console.error(`setGlobalProperty:`, res.error)
        return undefined;
    }
    return res;
}
const quitCallFunc = async (viewer: UeCloudViewerBase) => {
    const res = await viewer.callUeFunc<UeFuncsType['Quit']['result']>({
        f: 'Quit',
        p: undefined
    })
    if (res.error) {
        console.error(`Quit:`, res.error)
        return undefined;
    }
    return res;
}

const pickCallFunc = async (viewer: UeCloudViewerBase, screenPosition_?: [number, number], attachedInfo?: any, parentInfo_?: boolean) => {
    console.log('pickCallFunc', screenPosition_, attachedInfo, parentInfo_);
    const res = await viewer.callUeFunc<UeFuncsType['pick']['result']>({
        f: 'pick',
        p: { screenPosition: screenPosition_, parentInfo: parentInfo_ }
    })
    if (!res.re && (res.error || res.error == "")) {
        console.error(`pick:`, res.error == "" ? "未获取到结果" : res.error);
        return undefined;
    }
    // const pickedInfo = new UePickedInfo(res.re, new AttachedPickedInfo(attachedInfo), res.re.features);
    const id = res.re.id;
    const sceneObject = id ? ESSceneObject.getSceneObjectById(id) : undefined;
    if (sceneObject && Reflect.has(sceneObject, 'allowPicking') && Reflect.has(sceneObject, 'pickedEvent')) {
        //@ts-ignore
        if (sceneObject.allowPicking ?? false) {
            //@ts-ignore
            sceneObject.pickedEvent.emit({ attachedInfo });
        }
    }
    const result = new PickedResult(res.re, sceneObject, res.re.features, res.re.add, attachedInfo);
    return result;
}

const pickPositionCallFunc = async (viewer: UeCloudViewerBase, screenPosition_?: [number, number]) => {
    const res = await viewer.callUeFunc<UeFuncsType['pickPosition']['result']>({
        f: 'pickPosition',
        p: { screenPosition: screenPosition_ }
    })
    if (!res.re && (res.error || res.error == "")) {
        console.error(`pickPosition`, res.error == "" ? "未获取到结果" : res.error);
        return undefined;
    }
    const { position } = res.re;
    return position;
}

export const getHeightByLonLatCallFunc = async (viewer: UeCloudViewerBase, Lon: number, Lat: number, Channel: string = "ECC_Visibility") => {
    const res = await viewer.callUeFunc<UeFuncsType['GetHeightByLonLat']['result']>({
        f: 'GetHeightByLonLat',
        p: { Lon, Lat, Channel }
    })
    if (res.error) {
        console.warn(`GetHeightByLonLat:${res.error}`);
        return undefined;
    }
    return res.re;
}
export const getHeightByLonLatsCallFunc = async (viewer: UeCloudViewerBase, LonLats: ESJVector2DArray, Channel: string = "ECC_Visibility") => {
    const res = await viewer.callUeFunc<UeFuncsType['GetHeightsByLonLats']['result']>({
        f: 'GetHeightsByLonLats',
        p: { LonLats, Channel }
    })
    if (res.error) {
        console.warn(`GetHeightsByLonLats:${res.error}`);
        return undefined;
    }
    if (res.re.heights.includes(null)) {
        console.warn('注意! GetHeightsByLonLats: 存在高度为null的点. there are points with a height of null');
    }
    try {
        return res.re.heights;
    } catch (error) {
        return undefined;
    }
}

export const captureCallFunc = async (viewer: UeCloudViewerBase, resx: number = 64, resy: number = 64) => {
    const res = await viewer.callUeFunc<UeFuncsType['capture']['result']>({
        f: 'capture',
        p: { resx, resy }
    });
    if (res.error) {
        console.warn(res.error);
        return undefined;
    }
    return res.re.image;
}


export const getLonLatAltToScreenPositionCallFunc = async (viewer: UeCloudViewerBase, position: ESJVector3D) => {
    const res = await viewer.callUeFunc<UeFuncsType['LonLatAltToScreenPosition']['result']>({
        f: 'LonLatAltToScreenPosition',
        p: { LonLatAlt: position }
    });
    if (res.error) console.warn(res.error);

    return res.re
}

export const uePositionToLonLatAltCallFunc = async (viewer: UeCloudViewerBase, UEPosition: ESJVector3D) => {
    const res = await viewer.callUeFunc<UeFuncsType['UEPositionToLonLatAlt']['result']>({
        f: 'UEPositionToLonLatAlt',
        p: { UEPosition }
    });
    if (res.error) {
        console.warn(res.error);
        return undefined;
    }
    return [...res.re.LonLatAlt] as ESJVector3D;
}

export const getAllSocketNamesByActorTagCallFunc = async (viewer: UeCloudViewerBase, ActorTag: string) => {
    const res = await viewer.callUeFunc<UeFuncsType['GetAllSocketNamesByActorTag']['result']>({
        f: 'GetAllSocketNamesByActorTag',
        p: { ActorTag }
    });
    if (res.error) {
        console.warn(res.error);
        return undefined;
    }
    return [...res.re.socketNames] as string[];

}

export const getVersionCallFunc = async (viewer: UeCloudViewerBase) => {
    const res = await viewer.callUeFunc<UeFuncsType['GetVersion']['result']>({
        f: 'GetVersion',
        p: undefined
    });
    if (res.error) {
        console.warn(`GetVersion:`, res.error);
        return undefined;
    }
    return res.re.version;
}

export const getgetBoundSphereCallFunc = async (viewer: UeCloudViewerBase, id: string) => {
    const res = await viewer.callUeFunc<UeFuncsType['GetBoundSphere']['result']>({
        f: 'GetBoundSphere',
        p: { id }
    });
    if (res.error) {
        console.warn(res.error);
        return undefined;
    }
    return res.re;
}

export const getBoundSphereWithChildrenCallFunc = async (viewer: UeCloudViewerBase, id: string) => {
    const res = await viewer.callUeFunc<UeFuncsType['GetBoundSphereWithChildren']['result']>({
        f: 'GetBoundSphereWithChildren',
        p: { id }
    });
    if (res.error) {
        console.warn(`GetBoundSphereWithChildren:${res.error}`);
        return undefined;
    }
    return res.re;
}

export const getStrokeMaterialParamInfoCallFunc = async (viewer: UeCloudViewerBase, id: string) => {
    const res = await viewer.callUeFunc<UeFuncsType['GetStrokeMaterialParamInfo']['result']>({
        f: 'GetStrokeMaterialParamInfo',
        p: { id }
    });
    if (res.error) {
        console.warn(`GetStrokeMaterialParamInfo:${res.error}`);
        return undefined;
    }
    return res.re;
}
export const getFillMaterialParamInfoCallFunc = async (viewer: UeCloudViewerBase, id: string) => {
    const res = await viewer.callUeFunc<UeFuncsType['GetFillMaterialParamInfo']['result']>({
        f: 'GetFillMaterialParamInfo',
        p: { id }
    });
    if (res.error) {
        console.warn(`GetFillMaterialParamInfo:${res.error}`);
        return undefined;
    }
    return res.re;
}

export const getGlobalPropertyCallFunc = async (viewer: UeCloudViewerBase, props: string[]) => {
    const res = await viewer.callUeFunc<UeFuncsType['getGlobalProperty']['result']>({
        f: 'getGlobalProperty',
        p: { props }
    })
    if (res.error) {
        console.warn(`getGlobalProperty:${res.error}`);
        return undefined;
    }
    return res.re;
}

export const getObjectByInfoCallFunc = async (viewer: UeCloudViewerBase, info: { actorTag: string, componentTag?: string }) => {
    const res = await viewer.callUeFunc<UeFuncsType['GetObjectByInfo']['result']>({
        f: 'GetObjectByInfo',
        p: { info }
    })
    if (res.error) {
        console.warn(`GetObjectByInfo:${res.error}`);
        return undefined;
    }
    return res.re;
}

export const bindActorByTagCallFunc = async (viewer: UeCloudViewerBase, ID: string, ActorTag: string) => {
    const res = await viewer.callUeFunc<UeFuncsType['BindActorByTag']['result']>({
        f: 'BindActorByTag',
        p: { ID, ActorTag }
    });
    return res;
}

export const restoreOriginalSceneCallFunc = async (viewer: UeCloudViewerBase) => {
    const res = await viewer.callUeFunc<UeFuncsType['RestoreOriginalScene']['result']>({
        f: 'RestoreOriginalScene',
        p: undefined
    });
    return res;
}

export const unBindActorByIDCallFunc = async (viewer: UeCloudViewerBase, ID: string) => {
    const res = await viewer.callUeFunc<UeFuncsType['UnBindActorByID']['result']>({
        f: 'UnBindActorByID',
        p: { ID }
    });
    return res;
}

export const unBindActorByTagCallFunc = async (viewer: UeCloudViewerBase, ActorTag: string) => {
    const res = await viewer.callUeFunc<UeFuncsType['UnBindActorByTag']['result']>({
        f: 'UnBindActorByTag',
        p: { ActorTag }
    });
    return res;
}

export const createActorByClassCallFunc = async (viewer: UeCloudViewerBase, ID: string, ActorClass: string) => {
    const res = await viewer.callUeFunc<UeFuncsType['CreateActorByClass']['result']>({
        f: 'CreateActorByClass',
        p: { ID, ActorClass }
    });
    return res;
}

export const bind3DTilesetByTagCallFunc = async function (viewer: UeCloudViewerBase, ID: string, ActorTag: string) {
    const res = await viewer.callUeFunc<UeFuncsType['Bind3DTilesetByTag']['result']>({
        f: 'Bind3DTilesetByTag',
        p: { ID, ActorTag }
    });
    return res;
}

export const unBind3DTilesetByTagCallFunc = async function (viewer: UeCloudViewerBase, ActorTag: string) {
    const res = await viewer.callUeFunc<UeFuncsType['UnBind3DTilesetByTag']['result']>({
        f: 'UnBind3DTilesetByTag',
        p: { ActorTag }
    });
    return res;
}

export const unBind3DTilesetByIdCallFunc = async function (viewer: UeCloudViewerBase, ID: string) {
    const res = await viewer.callUeFunc<UeFuncsType['UnBind3DTilesetById']['result']>({
        f: 'UnBind3DTilesetById',
        p: { ID }
    });
    return res;
}

export const bindImageryByTagCallFunc = async function (viewer: UeCloudViewerBase, ID: string, ActorTag: string, ComponentTag: string) {
    const res = await viewer.callUeFunc<UeFuncsType['BindImageryByTag']['result']>({
        f: 'BindImageryByTag',
        p: { ID, ActorTag, ComponentTag }
    });
    return res;
}
export const unBindImageryByTagCallFunc = async function (viewer: UeCloudViewerBase, ActorTag: string, ComponentTag: string) {
    const res = await viewer.callUeFunc<UeFuncsType['UnBindImageryByTag']['result']>({
        f: 'UnBindImageryByTag',
        p: { ActorTag, ComponentTag }
    });
    return res;
}
export const unBindImageryByIdCallFunc = async function (viewer: UeCloudViewerBase, ID: string) {
    const res = await viewer.callUeFunc<UeFuncsType['UnBindImageryById']['result']>({
        f: 'UnBindImageryById',
        p: { ID }
    });
    return res;
}
export const getIdByComponentNameAndHitItemCallFunc = async function (viewer: UeCloudViewerBase, id: string, ComponentName: string, HitItem: number) {
    const res = await viewer.callUeFunc<UeFuncsType['GetIdByComponentNameAndHitItem']['result']>({
        f: 'GetIdByComponentNameAndHitItem',
        p: { id, ComponentName, HitItem }
    })
    return res;
}

export const getCameraRelativeHeightCallFunc = async function (viewer: UeCloudViewerBase, Channel: string = 'ECC_Visibility') {
    const res = await viewer.callUeFunc<UeFuncsType['GetCameraRelativeHeight']['result']>({
        f: 'GetCameraRelativeHeight',
        p: { Channel }
    })
    return res;
}

export const saveStringToFileCallFunc = async function (viewer: UeCloudViewerBase, str: string, Path?: string, File?: string) {
    const res = await viewer.callUeFunc<UeFuncsType['SaveStringToFile']['result']>({
        f: 'SaveStringToFile',
        p: {
            String: str,
            Path: Path ?? "undefine",
            File: File ?? "data.txt"
        }
    })
    if (res.error !== "") {
        console.warn('SaveStringToFile: ', res.error);
    }
    return res;
}

export const highlightActorByTagCallFunc = async function (viewer: UeCloudViewerBase, actorTag: string, isHighlight: boolean = true) {
    const res = await viewer.callUeFunc<UeFuncsType['HighlightActorByTag']['result']>({
        f: 'HighlightActorByTag',
        p: {
            ActorTag: actorTag,
            Highlight: isHighlight
        }
    })
    if (res.error !== "") {
        console.warn('HighlightActorByTag: ', res.error);
    }
    return res;
}

export const sendCustomMessageCallFunc = async function (viewer: UeCloudViewerBase, Message: string) {
    const res = await viewer.callUeFunc<UeFuncsType['SendCustomMessage']['result']>({
        f: 'SendCustomMessage',
        p: { Message }
    })
    if (res.error !== "") {
        console.warn('SendCustomMessage: ', res.error);
    }
    return res;
}


export const getStatusCallFunc = async function (viewer: UeCloudViewerBase) {
    const res = await viewer.callUeFunc<UeFuncsType['GetStatus']['result']>({
        f: 'GetStatus',
        p: undefined
    });
    if (res.error) {
        console.warn(`GetStatus:${res.error}`);
        return undefined;
    }
    return res.re;
}


export {
    generateMemReportCallFunc, startVoiceCallFunc, pickCallFunc, stopVoiceCallFunc, HighlightFeatureAndFlyToCallFunc,
    HighlightFeatureCallFunc, SetLayerColorCallFunc, SetLayerVisibleCallFunc, calcFlyToParamCallFunc,
    callFunctionCallFunc, changeNavigationModeCallFunc, destroyCallFunc, flyInCallFunc, flyInDefaultCameraCallFunc,
    flyToCallFunc, pickPositionCallFunc, quitCallFunc, refreshTilesetCallFunc, resetWithCurrentCameraCallFunc,
    setGlobalPropertyCallFunc, setNodePositionCallFunc, setNodeRotationCallFunc, setNodeScaleCallFunc, smoothMoveCallFunc,
    smoothMoveOnGroundCallFunc, smoothMoveWithRotationCallFunc, smoothMoveWithRotationOnGroundCallFunc
};

