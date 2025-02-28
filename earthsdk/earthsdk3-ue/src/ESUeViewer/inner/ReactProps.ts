
import { reactArrayWithUndefined } from "xbsj-base";
import { ESUeViewer } from "../index";
import { ESJLonLatFormatType, ESJVector3D, ESViewer } from "earthsdk3";

//全局属性，消息通信的所有属性
const createReactProps = () => ({
    ...ESViewer.createCommonProps(),

    //语音模式
    apiKey: '' as string,
    apiUrl: '' as string,
    secretKey: '' as string,
    speechVoiceMode: '' as string,

    geoReferenceOrigin: reactArrayWithUndefined<ESJVector3D | undefined>(undefined),//地理参考原点
    keepWorldOriginNearCamera: undefined as boolean | undefined,//地理参考的保持世界原点开关
    useCache: undefined as boolean | undefined,
    widgetInteractionDistance: undefined as number | undefined,
    memReportInterval: undefined as number | undefined,//内存报告间隔

    // 天气和后处理参数
    sceneControlled: undefined as boolean | undefined,//是否允许Manager控制场景
    brightness: undefined as number | undefined,//场景亮度
    emissiveIntensity: undefined as number | undefined,//自发光强度

    statusUpdateInterval: undefined as number | undefined, //状态更新间隔
    baseUrl: undefined as string | undefined,  //基础路径
});

const reactPropDefaults = {
    ...ESViewer.defaults,

    geoReferenceOrigin: undefined as ESJVector3D | undefined,
    keepWorldOriginNearCamera: false,
    useCache: true,
    widgetInteractionDistance: 200,
    memReportInterval: 10,

    sceneControlled: true,
    brightness: 0,
    emissiveIntensity: 1,

    statusUpdateInterval: 0.5,
    baseUrl: window.location.href ?? '',
}

function getGlobalPropsKey() {
    const reactProps = createReactProps()
    const props: string[] = []
    Object.keys(reactProps).forEach(item => { props.push(item) })
    return props
}

function getGlobalPropsValue(viewer: ESUeViewer) {
    const { defaults } = ESUeViewer;
    const keys = getGlobalPropsKey()
    const params: { [key: string]: any } = {}
    keys.forEach(key => {
        //@ts-ignore
        params[key] = viewer[key] ?? defaults[key]
    })
    return params;
}

export { getGlobalPropsKey, getGlobalPropsValue, createReactProps, reactPropDefaults }
