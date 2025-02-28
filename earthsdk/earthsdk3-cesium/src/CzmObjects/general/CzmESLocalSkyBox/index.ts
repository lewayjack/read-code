import { ESLocalSkyBox } from "earthsdk3";
import { CzmESObjectWithLocation } from "../../../CzmObjects";
import { SkyBoxComponent } from "./SkyBoxComponent";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { createNextAnimateFrameEvent, Listener, ObjResettingWithEvent } from "xbsj-base";
import { SkyBoxCameraListener } from "./SkyBoxCameraListener";
import { flyWithPosition } from "../../../utils";
import { CzmSceneSkyBoxSourcesType } from "../../../ESJTypesCzm";

export class CzmESLocalSkyBox extends CzmESObjectWithLocation<ESLocalSkyBox> {
    static readonly type = this.register("ESCesiumViewer", ESLocalSkyBox.type, this);

    private static _defaultLocalBox: CzmSceneSkyBoxSourcesType | undefined;
    // 是否第一次加载局部天空盒,用于辅助获取默认近地天空盒
    private static _firstLoad: boolean = true;
    // 用于存储所有天空盒对象，只能按照对象加载顺序进行显示，图层树调整顺序后，这里不生效，反应到地图上就是错乱！！！！后期要想办法再改
    private static _eSLocalSkyBoxArr: ESLocalSkyBox[] = []

    //实现类show也能控制天空盒显示，用于距离显示
    private _czmSkyBoxComponents: SkyBoxComponent[] = [];
    constructor(sceneObject: ESLocalSkyBox, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);

        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn('viewer is undefined!');
            return;
        }
        if (!CzmESLocalSkyBox._defaultLocalBox && CzmESLocalSkyBox._firstLoad) {
            CzmESLocalSkyBox._firstLoad = false;
            CzmESLocalSkyBox._defaultLocalBox = czmViewer.xbsjLocalBoxSources
        }
        CzmESLocalSkyBox._eSLocalSkyBoxArr.push(sceneObject);
        this.d(() => {
            CzmESLocalSkyBox._eSLocalSkyBoxArr.includes(sceneObject) && CzmESLocalSkyBox._eSLocalSkyBoxArr.splice(CzmESLocalSkyBox._eSLocalSkyBoxArr.indexOf(sceneObject), 1);
            this.ChangeAutoFollow();
        })
        // 对应位置图片矩阵
        const positions = {
            "bottom": [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1]],
            "top": [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]],
            "south": [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]],
            "north": [[-1, 1, -1], [1, 1, -1], [1, 1, 1], [-1, 1, 1]],
            "east": [[1, -1, -1], [1, 1, -1], [1, 1, 1], [1, -1, 1]],
            "west": [[-1, 1, -1], [-1, 1, 1], [-1, -1, 1], [-1, -1, -1]],
        } as { [xx: string]: number[][] };
        // 创建立方体天空盒
        for (const key in positions) {
            if (Object.prototype.hasOwnProperty.call(positions, key)) {
                const element = positions[key];
                this._czmSkyBoxComponents.push(this.dv(new SkyBoxComponent(sceneObject, czmViewer, key, element)));
            }
        }
        {
            const event = this.disposeVar(createNextAnimateFrameEvent(
                sceneObject.autoFollowChanged,
                sceneObject.autoOpacityFactorChanged
            ))
            // 不知道为什么不识别
            this.disposeVar(new ObjResettingWithEvent(<Listener<any[]>><unknown>event, () => {
                this.ChangeAutoFollow();
                return new SkyBoxCameraListener(sceneObject, czmViewer, this._czmSkyBoxComponents);
            }))
        }
        {
            const update = () => {
                this.ChangeAutoFollow();
            }
            const event = this.disposeVar(createNextAnimateFrameEvent(
                sceneObject.sizeChanged,
                sceneObject.modeChanged,
                sceneObject.showChanged
            ))
            this.dispose(event.disposableOn(update))
        }
    }
    ChangeAutoFollow() {
        const { czmViewer } = this;
        for (let i = CzmESLocalSkyBox._eSLocalSkyBoxArr.length - 1; i >= 0; i--) {
            const element = CzmESLocalSkyBox._eSLocalSkyBoxArr[i];
            if (element.autoFollow && element.show) {
                czmViewer.xbsjLocalBoxSources = {
                    "positiveX": '${earthsdk3-assets-script-dir}/assets' + `/img/skybox/${element.mode}/east.jpg`,
                    "negativeX": '${earthsdk3-assets-script-dir}/assets' + `/img/skybox/${element.mode}/west.jpg`,
                    "positiveY": '${earthsdk3-assets-script-dir}/assets' + `/img/skybox/${element.mode}/bottom.jpg`,
                    "negativeY": '${earthsdk3-assets-script-dir}/assets' + `/img/skybox/${element.mode}/top.jpg`,
                    "positiveZ": '${earthsdk3-assets-script-dir}/assets' + `/img/skybox/${element.mode}/north.jpg`,
                    "negativeZ": '${earthsdk3-assets-script-dir}/assets' + `/img/skybox/${element.mode}/south.jpg`
                }
                break;
            }
            // 找不到就恢复默认
            if (i == 0) {
                czmViewer.xbsjLocalBoxSources = CzmESLocalSkyBox._defaultLocalBox;
            }
        }
        if (CzmESLocalSkyBox._eSLocalSkyBoxArr.length == 0) {
            czmViewer.xbsjLocalBoxSources = CzmESLocalSkyBox._defaultLocalBox;
        }
    }
    override flyTo(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            return super.flyTo(duration, id);
        } else {
            const viewDistance = (sceneObject.size ?? ESLocalSkyBox.defaults.size);
            if (sceneObject.position) {
                flyWithPosition(czmViewer, sceneObject, id, sceneObject.position, viewDistance, duration, true);
                return true;
            }
            return false;
        }
    }
}
