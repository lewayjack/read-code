import {
    ESJFlyToParam, ESJsonObjectType, ESJVector2D,
    ESJVector2DArray, ESJVector3D, ESJVector3DArray, ESJVector4D, ESViewer,
    ESVOption, ESVOptionUe, getGeoBoundingSphereFromPositions,
} from "earthsdk3";
import { Event, extendClassProps, ObjResettingWithEvent, react, UniteChanged } from 'xbsj-base';
import { createReactProps, reactPropDefaults } from './inner/ReactProps';
import { ViewerCreating } from './inner/ViewerCreating';
import { bind3DTilesetByTagCallFunc, bindActorByTagCallFunc, bindImageryByTagCallFunc, captureCallFunc, changeNavigationModeCallFunc, createActorByClassCallFunc, flyInCallFunc, flyInDefaultCameraCallFunc, flyToCallFunc, generateMemReportCallFunc, getAllSocketNamesByActorTagCallFunc, getBoundSphereWithChildrenCallFunc, getCameraRelativeHeightCallFunc, getFillMaterialParamInfoCallFunc, getgetBoundSphereCallFunc, getGlobalPropertyCallFunc, getHeightByLonLatCallFunc, getHeightByLonLatsCallFunc, getIdByComponentNameAndHitItemCallFunc, getLonLatAltToScreenPositionCallFunc, getObjectByInfoCallFunc, getStatusCallFunc, getStrokeMaterialParamInfoCallFunc, getVersionCallFunc, highlightActorByTagCallFunc, pickCallFunc, pickPositionCallFunc, quitCallFunc, resetWithCurrentCameraCallFunc, restoreOriginalSceneCallFunc, saveStringToFileCallFunc, sendCustomMessageCallFunc, setGlobalPropertyCallFunc, startVoiceCallFunc, stopVoiceCallFunc, uePositionToLonLatAltCallFunc, unBind3DTilesetByIdCallFunc, unBind3DTilesetByTagCallFunc, unBindActorByIDCallFunc, unBindActorByTagCallFunc, unBindImageryByIdCallFunc, unBindImageryByTagCallFunc } from './uemsg/CallUeFuncs';
import { UeCloudViewerBase } from './uemsg/UeCloudViewerBase';
import { UeEventsType } from './uemsg/UeEventsType';
import { NavigationModeCallFuncParam } from './uemsg/UeFuncsType';
export class ESUeViewer extends ESViewer {
    static readonly type = this.register('ESUeViewer', this);
    override get defaultProps() { return ESUeViewer.createDefaultProps(); }

    private _viewer = this.dv(react<UeCloudViewerBase | undefined>(undefined));
    set viewer(value: UeCloudViewerBase | undefined) { this._viewer.value = value; }
    get viewer() { return this._viewer.value; }

    private _speechRecognition = this.dv(new Event<[UeEventsType['speechRecognition']]>());
    get speechRecognition() { return this._speechRecognition; }

    private _propChanged = this.dv(new Event<[UeEventsType['propChanged']]>());
    get propChanged() { return this._propChanged; }

    private _objectEvent = this.dv(new Event<[UeEventsType['objectEvent']]>());
    get objectEvent() { return this._objectEvent; }

    private _widgetEvent = this.dv(new Event<[UeEventsType['widgetEvent']]>());
    get widgetEvent() { return this._widgetEvent; }

    private _customMessage = this.dv(new Event<[UeEventsType['customMessage']]>());
    get customMessage() { return this._customMessage; }

    private _statusUpdateEvent = this.dv(new Event<[UeEventsType['statusUpdate']]>());
    get statusUpdateEvent() { return this._statusUpdateEvent; }

    private _statusUpdateEventdon = (() => {
        this.d(this.statusUpdateEvent.don((data) => {
            this._statusInfo.fps = data.FPS ?? 0;
            this._statusInfo.length = data.length ?? 0;
            this._statusInfo.position = data.position ?? [0, 0, 0];
            this._statusInfo.rotation = data.rotation ?? [0, 0, 0];
        }))
    })()

    //自身函数----------------------------------
    async uePositionToLonLatAlt(UEPosition: ESJVector3D) {
        if (!this.viewer) {
            console.warn('UEPositionToLonLatAlt: viewer is undefined')
            return undefined;
        }
        const res = await uePositionToLonLatAltCallFunc(this.viewer, UEPosition);
        return res;
    }
    async changeNavigationMode(parms: NavigationModeCallFuncParam) {//修改相机漫游模式
        if (!this.viewer) {
            console.warn('ChangeNavigationMode: viewer is undefined')
            return undefined;
        }
        const res = await changeNavigationModeCallFunc(this.viewer, parms);
        (res && !res.error) && ((this._navigationMode.value = parms.mode))
        return res;
    }

    async resetWithCurrentCamera(id: string) {
        if (!this.viewer) {
            console.warn('resetWithCurrentCamera: viewer is undefined')
            return undefined;
        }
        const res = await resetWithCurrentCameraCallFunc(this.viewer, id);
        return res;
    }

    async getAllSocketNamesByActorTag(ActorTag: string) {
        if (!this.viewer) {
            console.warn('GetAllSocketNamesByActorTag: viewer is undefined')
            return undefined;
        }
        const res = await getAllSocketNamesByActorTagCallFunc(this.viewer, ActorTag);
        return res;
    }

    async getgetBoundSphere(id: string) {
        if (!this.viewer) {
            console.warn('getgetBoundSphere: viewer is undefined')
            return undefined;
        }
        const res = await getgetBoundSphereCallFunc(this.viewer, id);
        return res;
    }
    async getBoundSphereWithChildren(id: string) {
        if (!this.viewer) {
            console.warn('getBoundSphereWithChildren: viewer is undefined')
            return undefined;
        }
        const res = await getBoundSphereWithChildrenCallFunc(this.viewer, id);
        return res;
    }
    async getStrokeMaterialParamInfo(id: string) {
        if (!this.viewer) {
            console.warn('GetStrokeMaterialParamInfo: viewer is undefined')
            return undefined;
        }
        const res = await getStrokeMaterialParamInfoCallFunc(this.viewer, id);
        return res;
    }
    async getFillMaterialParamInfo(id: string) {
        if (!this.viewer) {
            console.warn('getFillMaterialParamInfo: viewer is undefined')
            return undefined;
        }
        const res = await getFillMaterialParamInfoCallFunc(this.viewer, id);
        return res;
    }
    async getGlobalProperty(props: string[]) {//获取全局属性信息
        if (!this.viewer) {
            console.warn('getGlobalProperty: viewer is undefined')
            return undefined;
        }
        const res = await getGlobalPropertyCallFunc(this.viewer, props);
        return res;
    }
    async getObjectByInfo(info: { actorTag: string, componentTag?: string }) {
        if (!this.viewer) {
            console.warn('GetObjectByInfo: viewer is undefined')
            return undefined;
        }
        const res = await getObjectByInfoCallFunc(this.viewer, info);
        return res;
    }

    async defaultCameraFlyIn(duration: number = 1) {//恢复默认视角
        if (!this.viewer) {
            console.warn('DefaultCameraFlyIn: viewer is undefined')
            return undefined;
        }
        const res = await flyInDefaultCameraCallFunc(this.viewer, duration)
        return res;
    }

    async startVoice() {
        if (!this.viewer) {
            console.warn('startVoice:viewer is undefined');
            return undefined;
        }
        const res = await startVoiceCallFunc(this.viewer);
        return res;
    }
    async stopVoice() {
        if (!this.viewer) {
            console.warn('startVoice:viewer is undefined');
            return undefined;
        }
        const res = await stopVoiceCallFunc(this.viewer);
        return res;
    }
    async generateMemReport() {
        if (!this.viewer) {
            console.warn('generateMemReport:viewer is undefined');
            return undefined;
        }
        const res = await generateMemReportCallFunc(this.viewer);
        return res;
    }
    async quit() {//退出ue程序
        if (!this.viewer) {
            console.warn('Quit: viewer is undefined')
            return;
        }
        const res = await quitCallFunc(this.viewer)
        return res;
    }

    async bindActorByTag(id: string, actorTag: string) {
        if (!this.viewer) {
            console.warn('BindActorByTag: viewer is undefined')
            return undefined;
        }
        const res = await bindActorByTagCallFunc(this.viewer, id, actorTag)
        return res;
    }
    async restoreOriginalScene() {
        if (!this.viewer) {
            console.warn('RestoreOriginalScene: viewer is undefined')
            return undefined;
        }
        const res = await restoreOriginalSceneCallFunc(this.viewer)
        return res;
    }
    async unBindActorByID(ID: string) {
        if (!this.viewer) {
            console.warn('UnBindActorByID: viewer is undefined')
            return undefined;
        }
        const res = await unBindActorByIDCallFunc(this.viewer, ID)
        return res;
    }
    async unBindActorByTag(ActorTag: string) {
        if (!this.viewer) {
            console.warn('UnBindActorByTag: viewer is undefined')
            return undefined;
        }
        const res = await unBindActorByTagCallFunc(this.viewer, ActorTag)
        return res;
    }

    async createActorByClass(ID: string, ActorClass: string) {
        if (!this.viewer) {
            console.warn('CreateActorByClass: viewer is undefined')
            return undefined;
        }
        const res = await createActorByClassCallFunc(this.viewer, ID, ActorClass)
        return res;
    }

    async bind3DTilesetByTag(ID: string, ActorTag: string) {
        if (!this.viewer) {
            console.warn('Bind3DTilesetByTag: viewer is undefined')
            return undefined;
        }
        const res = await bind3DTilesetByTagCallFunc(this.viewer, ID, ActorTag)
        return res;
    }
    async unBind3DTilesetByTag(ActorTag: string) {
        if (!this.viewer) {
            console.warn('UnBind3DTilesetByTag: viewer is undefined')
            return undefined;
        }
        const res = await unBind3DTilesetByTagCallFunc(this.viewer, ActorTag)
        return res;
    }
    async unBind3DTilesetById(ID: string) {
        if (!this.viewer) {
            console.warn('UnBind3DTilesetById: viewer is undefined')
            return undefined;
        }
        const res = await unBind3DTilesetByIdCallFunc(this.viewer, ID)
        return res;
    }
    async bindImageryByTag(ID: string, ActorTag: string, ComponentTag: string) {
        if (!this.viewer) {
            console.warn('BindImageryByTag: viewer is undefined')
            return undefined;
        }
        const res = await bindImageryByTagCallFunc(this.viewer, ID, ActorTag, ComponentTag)
        return res;
    }
    async unBindImageryByTag(ActorTag: string, ComponentTag: string) {
        if (!this.viewer) {
            console.warn('UnBindImageryByTag: viewer is undefined')
            return undefined;
        }
        const res = await unBindImageryByTagCallFunc(this.viewer, ActorTag, ComponentTag)
        return res;
    }
    async unBindImageryById(ID: string) {
        if (!this.viewer) {
            console.warn('UnBindImageryById: viewer is undefined')
            return undefined;
        }
        const res = await unBindImageryByIdCallFunc(this.viewer, ID)
        return res;
    }
    async getIdByComponentNameAndHitItem(id: string, ComponentName: string, HitItem: number) {
        if (!this.viewer) {
            console.warn('GetIdByComponentNameAndHitItem: viewer is undefined')
            return undefined;
        }
        const res = await getIdByComponentNameAndHitItemCallFunc(this.viewer, id, ComponentName, HitItem)
        return res;
    }

    /**
     * @returns Promise(高度)
     * @deprecated 获取当前视角相机相对地面的高度
     * Channels ?? 'ECC_Visibility'
     */
    async getCameraRelativeHeight(Channel: string = 'ECC_Visibility') {
        if (!this.viewer) {
            console.warn('GetCameraRelativeHeight: viewer is undefined')
            return undefined;
        }
        const res = await getCameraRelativeHeightCallFunc(this.viewer, Channel)
        return res;
    }
    /**
     * 保存str到指定目录下
     *  Path ?? "WindowNoEditor\\ProjectName\\"
     *  File ?? "data.txt"
     */
    async saveStringToFile(str: string, Path?: string, File?: string) {
        if (!this.viewer) {
            console.warn('SaveStringToFile: viewer is undefined')
            return undefined;
        }
        const res = await saveStringToFileCallFunc(this.viewer, str, Path, File)
        return res;
    }

    async highlightActorByTag(actorTag: string, isHighlight: boolean = true) {
        if (!this.viewer) {
            console.warn('HighlightActorByTag: viewer is undefined')
            return undefined;
        }
        const res = await highlightActorByTagCallFunc(this.viewer, actorTag, isHighlight)
        return res;
    }

    async sendCustomMessage(Message: string) {
        if (!this.viewer) {
            console.warn('SendCustomMessage: viewer is undefined')
            return undefined;
        }
        const res = await sendCustomMessageCallFunc(this.viewer, Message)
        return res;
    }

    async getStatus() {
        if (!this.viewer) {
            console.warn('GetStatus:viewer is undefined');
            return;
        }
        return await getStatusCallFunc(this.viewer)

    }
    //——————————————————————————————————————————

    //抽象函数实现------------------------------
    async pick(screenPosition?: ESJVector2D, attachedInfo?: any, parentInfo?: boolean) {
        if (!this.viewer) return undefined;
        let newScreenPosition = screenPosition;
        //ue大屏模式视口默认全屏，需要计算容器的偏移量
        //@ts-ignore
        if (screenPosition && window.ue && this.container) {
            const [offsetX, offsetY] = screenPosition;
            const { left, top } = this.container.getBoundingClientRect();
            newScreenPosition = [left + offsetX, top + offsetY];
        }
        return await pickCallFunc(this.viewer, newScreenPosition, attachedInfo, parentInfo);
    };

    async pickPosition(screenPosition: ESJVector2D) {
        if (!this.viewer) return undefined;
        let newScreenPosition = screenPosition;
        //ue大屏模式视口默认全屏，需要计算容器的偏移量
        //@ts-ignore
        if (screenPosition && window.ue && this.container) {
            const [offsetX, offsetY] = screenPosition;
            const { left, top } = this.container.getBoundingClientRect();
            newScreenPosition = [left + offsetX, top + offsetY];
        }
        return await pickPositionCallFunc(this.viewer, newScreenPosition);
    }

    async flyIn(position: ESJVector3D, rotation: ESJVector3D = [0, 0, 0], duration: number = 1) {
        if (!this.viewer) return undefined;
        const res = await flyInCallFunc(this.viewer, undefined, position, rotation, duration)
        if (!res) return undefined
        if (res.endType === 0) console.warn(`flyTo:flyTo is end! endType:${res.endType}`);
        if (res.endType === 1) console.warn(`flyTo:飞行中断！ endType:${res.endType}`);
        return res;
    }
    async flyTo(flyToParam: ESJFlyToParam, position: ESJVector3D) {
        if (!this.viewer) return undefined;
        const res = await flyToCallFunc(this.viewer, undefined, undefined, flyToParam, position)
        if (!res) return undefined
        if (res.endType === 0) console.warn(`flyTo:flyTo is end! endType:${res.endType}`);
        if (res.endType === 1) console.warn(`flyTo:飞行中断！ endType:${res.endType}`);
        return res;
    }

    flyToBoundingSphere(rectangle: ESJVector4D, distance?: number, duration: number = 1) {
        const positions: ESJVector3DArray = [
            [rectangle[0], rectangle[1], 0],
            [rectangle[0], rectangle[3], 0],
            [rectangle[2], rectangle[3], 0],
            [rectangle[2], rectangle[1], 0]
        ]
        const options = getGeoBoundingSphereFromPositions(positions);
        if (!options) return;
        const { center, radius } = options
        const flyToParam = {
            distance: distance ?? radius,
            heading: 0,
            pitch: -90,
            flyDuration: duration,
            hDelta: 0,
            pDelta: 0
        } as const;
        this.flyTo(flyToParam, center)
    };

    /**
     * @description 获取当前相机信息
     * @returns @type {position:ESJVector3D, rotation:ESJVector3D}
     */
    getCurrentCameraInfo() {
        const { position, rotation } = this._statusInfo;
        return { position, rotation }
    }
    /**
     * @description 获取当前比例尺
     * @returns  比例尺
     */
    getLengthInPixel() {
        return this._statusInfo.length;
    };

    /**
     * @description 切换为第一人称漫游模式 w a s d可以控制相机移动
     * @param position 相机位置
     * @returns  
     */
    async changeToWalk(position: ESJVector3D, jumpZVelocity: number = 4.2) {
        if (!this.viewer) return undefined;
        const opt = { mode: 'Walk', position, jumpZVelocity } as const;
        const res = await changeNavigationModeCallFunc(this.viewer, opt);
        (res && !res.error) && (this._navigationMode.value = opt.mode);
        return res;
    };

    /**
     * 切换导航模式为“地图”模式。
     * 此模式允许用户在地图上自由导航。
     */
    async changeToMap() {
        if (!this.viewer) return undefined;
        const opt = { mode: 'Map' } as const;
        const res = await changeNavigationModeCallFunc(this.viewer, opt);
        (res && !res.error) && (this._navigationMode.value = opt.mode);
        return res;
    }

    /**
     * 切换到“旋转地球”导航模式。
     * 此模式允许用户在连续循环中旋转地球。
     * @param latitude - 地球旋转的纬度。默认为 38 度。
     * @param height - 地球旋转的高度。默认为 10,000,000 米。
     * @param cycleTime - 一个完整循环所需的秒数。默认为 60 秒。
     */
    async changeToRotateGlobe(latitude: number = 38, height: number = 10000000, cycleTime: number = 60) {
        if (!this.viewer) return undefined;
        const opt = { mode: 'RotateGlobe', latitude, height, cycleTime } as const;
        const res = await changeNavigationModeCallFunc(this.viewer, opt);
        (res && !res.error) && (this._navigationMode.value = opt.mode);
        return res;
    }

    /**
     * 切换导航模式为“Line”（线路）沿线漫游。
     * 此模式允许用户沿指定的地理线路导航。
     * @param geoLineStringId - 要导航的地理线路的唯一标识符。
     * @param speed - 用户在线路上导航的速度 默认10m/s。
     * @param heightOffset - 用户在线路上导航的垂直偏移量 默认 10米。
     * @param loop - 一个布尔值，表示在到达线路末尾后是否导航回到起点循环。默认开启
     * @param turnRateDPS - 用户在线路上导航的转弯速度 度/秒。
     * @param lineMode - 路径漫游模式 auto/manual 默认 auto。
     */
    async changeToLine(geoLineStringId: string, speed: number = 10, heightOffset: number = 10, loop: boolean = true, turnRateDPS: number = 10, lineMode: "auto" | "manual" = "auto") {
        if (!this.viewer) return undefined;
        const opt = { mode: 'Line', geoLineStringId, speed, heightOffset, loop, turnRateDPS, lineMode } as const;
        const res = await changeNavigationModeCallFunc(this.viewer, opt);
        (res && !res.error) && (this._navigationMode.value = opt.mode);
        return res;
    }

    /**
     * 切换导航模式为“UserDefined” 仅UE支持。
     * 此模式允许用户自定义交互方式。
     * @param userDefinedPawn ue支持，用户自定义交互方式
     */
    async changeToUserDefined(userDefinedPawn: string) {
        if (!this.viewer) return undefined;
        const opt = { mode: 'UserDefined', userDefinedPawn } as const;
        const res = await changeNavigationModeCallFunc(this.viewer, opt);
        (res && !res.error) && (this._navigationMode.value = opt.mode);
        return res;
    };

    /**
      * 切换导航模式为“RotatePoint”（绕点）绕点旋转。此模式允许用户绕点旋转。
      * @param position - 要环绕的点位置（经纬度）。
      * @param heading - 初始的环绕角度，默认0。
      * @param pitch - 初始的环绕俯仰角，默认-30。
      * @param distance - 距离点的距离，默认50000米 ，单位米
      * @param orbitPeriod - 默认环绕一周的时间 单位S,默认60S。
      */
    async changeToRotatePoint(position: ESJVector3D, distance: number = 50000, orbitPeriod: number = 60, heading: number = 0, pitch: number = -30) {
        if (!this.viewer) return undefined;
        const opt = {
            mode: 'RotatePoint', position, distance, orbitPeriod, heading, pitch
        } as const;
        const res = await changeNavigationModeCallFunc(this.viewer, opt);
        (res && !res.error) && (this._navigationMode.value = opt.mode);
        return res;
    }
    /**
     * 切换导航模式为“Follow”（跟随）跟随模式。 此模式允许视角跟随ES对象。
     * @param objectId - 要跟随的ES对象Id。
     * @param heading - 初始的环绕角度，默认0。
     * @param pitch - 初始的环绕俯仰角，默认-30。
     * @param distance - 距离点的距离，默认0米 ，单位米 传入0会自行计算距离为包围盒半径*3
     */
    async changeToFollow(objectId: string, distance: number = 0, heading: number = 0, pitch: number = -30, relativeRotation: boolean = true) {
        if (!this.viewer) return undefined;
        const opt = { mode: 'Follow', objectId, distance, heading, pitch, relativeRotation } as const;
        const res = await changeNavigationModeCallFunc(this.viewer, opt);
        (res && !res.error) && (this._navigationMode.value = opt.mode);
        return res;
    }

    getFPS() { return this._statusInfo.fps };

    override async getVersion() {
        //@ts-ignore
        const copyright = window.g_XE3CopyRights ?? {};
        if (!this.viewer) return copyright;
        const version = await getVersionCallFunc(this.viewer);
        copyright.esforue = version;
        return copyright;
    }

    async getHeightByLonLat(lon: number, lat: number, channel: string = "ECC_Visibility") {
        if (!this.viewer) return null;
        const res = await getHeightByLonLatCallFunc(this.viewer, lon, lat, channel);
        const height = res ? (res.height !== undefined ? res.height : null) : null
        return height;
    };

    async getHeightsByLonLats(lonLats: ESJVector2DArray, channel: string = "ECC_Visibility") {
        if (!this.viewer) return undefined;
        const res = await getHeightByLonLatsCallFunc(this.viewer, lonLats, channel)
        return res;
    };
    async capture(resx: number = 64, resy: number = 64) {
        if (!this.viewer) return undefined;
        const res = await captureCallFunc(this.viewer, resx, resy);
        return res;
    };

    async lonLatAltToScreenPosition(position: ESJVector3D) {
        if (!this.viewer) return undefined;
        const res = await getLonLatAltToScreenPositionCallFunc(this.viewer, position);
        return res && [res.Y, res.Y] as ESJVector2D;
    };

    //------------------------------抽象函数实现

    async setGlobalProperty(params: ESJsonObjectType) {
        if (!this.viewer) return undefined;
        return await setGlobalPropertyCallFunc(this.viewer, params)
    };

    constructor(option: ESVOption) {
        super(option);

        if (option.type !== 'ESUeViewer') throw new Error('option.type must be ESUeViewer');

        const opt = option as ESVOptionUe;
        this.d(this._viewer.changed.don(() => { this.viewerChanged.emit(this.viewer); }));
        this.dv(new ObjResettingWithEvent(this.subContainerChanged, () => {
            this.setStatus('Raw');
            this.setStatusLog('');
            if (!this.subContainer) return undefined;
            return new ViewerCreating(this.subContainer, opt, this);
        }));
    }

    override getProperties() {
        return [
            ...super.getProperties()
        ];
    }

    static override defaults = { ...reactPropDefaults };

}
export namespace ESUeViewer {
    export const createDefaultProps = () => ({
        ...ESViewer.createDefaultProps(),
        /**
          * 新增UE属性步骤！！
          * 1. createReactProps 中定义属性
          * 2. reactPropDefaults 中定义默认值
          */
        ...createReactProps(),

        //分辨率缩放比例
        resolutionScale: 1,
        autoReconnect: false,

        propChangedListening: undefined as boolean | undefined,
        objectEventListening: undefined as boolean | undefined,
        widgetEventListening: undefined as boolean | undefined,
        speechRecognitionListening: undefined as boolean | undefined,
        customMessageListening: undefined as boolean | undefined,
    });
}
extendClassProps(ESUeViewer.prototype, ESUeViewer.createDefaultProps);
export interface ESUeViewer extends UniteChanged<ReturnType<typeof ESUeViewer.createDefaultProps>> { }
