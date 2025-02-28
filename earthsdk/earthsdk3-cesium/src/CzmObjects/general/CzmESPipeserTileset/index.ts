import { ESPipeserTileset } from "earthsdk3"
import { CzmES3DTileset } from "../CzmES3DTileset"
import { ESCesiumViewer } from "../../../ESCesiumViewer"
// "dragType": "layer",
type TilesetProps = {
    "id": string | number,
    "visable"?: boolean,
    "color"?: string
}

function rgbChangeArr(value: string) {
    var arr = []
    const str = value.slice(5)
    const str1 = str.slice(0, str.length - 1)
    arr = str1.split(',')
    return [Number(arr[0]) / 255, Number(arr[1]) / 255, Number(arr[2]) / 255, Number(arr[3])]
}

//递归处理树结构
function getTreeParents(treeData: any, keyVal: 'visable' | 'color', children = 'children', key = 'dragType') {
    const parentKey: TilesetProps[] = []
    treeData.forEach((item: any) => {
        if (item[key] && item[key] === 'layer') {
            const mode = {
                id: item.id,
                visable: item.checked,
                color: item.config.color
            }
            if (keyVal === 'color') {
                delete mode['visable'];
            } else {
                delete mode['color'];
            }
            parentKey.push(mode)
        }
        if (item[children] && item[children].length) {
            const temp = getTreeParents(item[children], keyVal, children, key)
            if (temp.length) {
                parentKey.push(...temp)
            }
        }
    })
    return parentKey
}


export class CzmESPipeserTileset extends CzmES3DTileset<ESPipeserTileset> {
    static override readonly type = this.register('ESCesiumViewer', ESPipeserTileset.type, this);
    constructor(sceneObject: ESPipeserTileset, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }

        {
            this.d(sceneObject.setLayerVisibleEvent.don((name, layerJson) => {
                try {
                    let json: { [x: string]: any; }[] = []
                    if (typeof layerJson === 'string') {
                        json = JSON.parse(layerJson);
                    } else {
                        //@ts-ignore
                        json = layerJson;
                    }
                    const visableList = getTreeParents(json, 'visable') as { "id": string | number, "visable": boolean }[]
                    const conditions = visableList.map((item) => {
                        const id = (typeof item.id === 'string') ? (`'${item.id}'`) : (`'${item.id.toString()}'`);
                        return [`\${${name}} === ` + id, item.visable.toString()] as [string, string]
                    })
                    this.setFeatureVisable(conditions);
                } catch (error) {
                    console.error(error)
                }
            }))

            this.d(sceneObject.setLayerColorEvent.don((name, layerJson) => {
                try {
                    let json: { [x: string]: any; }[] = []
                    if (typeof layerJson === 'string') {
                        json = JSON.parse(layerJson);
                    } else {
                        //@ts-ignore
                        json = layerJson;
                    }
                    const colorList = getTreeParents(json, 'color') as { "id": string | number, "color": string }[]
                    const conditions = colorList.map((item) => {
                        const id = (typeof item.id === 'string') ? (`'${item.id}'`) : (`'${item.id.toString()}'`);
                        return [`\${${name}} === ` + id, item.color] as [string, string]
                    })
                    this.setFeatureColor(conditions);
                } catch (error) {
                    console.error(error)
                }
            }))
        }
    }
    // 重写flyTo方法,基类监听flyToEvent后飞行执行此方法
    override flyTo(duration: number | undefined, id: number) {
        const { sceneObject, czmViewer, czm3DTiles } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            return super.flyTo(duration, id);
        } else {
            czm3DTiles.flyTo(duration && duration * 1000);
            sceneObject.flyOverEvent.emit(id, 'over', czmViewer);
            return true;
        }
    }
    override flyIn(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, czm3DTiles } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyInParam) {
            return super.flyIn(duration, id);
        } else {
            czm3DTiles.flyTo(duration && duration * 1000);
            sceneObject.flyOverEvent.emit(id, 'over', czmViewer);
            return true;
        }
    }
}
