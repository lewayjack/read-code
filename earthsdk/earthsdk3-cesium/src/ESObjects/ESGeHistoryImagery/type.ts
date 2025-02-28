import { Destroyable } from "xbsj-base";
import { ESViewer, ESImageryLayer } from "earthsdk3";
import { ESGeHistoryImagery } from "./index";

//3D级数转为2D高
const altToZoom = (cameraHeight: number) => {
    const levels = [
        { maxAlt: 250000000, level: 0 },
        { maxAlt: 25000000, level: 1 },
        { maxAlt: 9000000, level: 2 },
        { maxAlt: 7000000, level: 3 },
        { maxAlt: 4400000, level: 4 },
        { maxAlt: 2000000, level: 5 },
        { maxAlt: 1000000, level: 6 },
        { maxAlt: 493977, level: 7 },
        { maxAlt: 218047, level: 8 },
        { maxAlt: 124961, level: 9 },
        { maxAlt: 56110, level: 10 },
        { maxAlt: 40000, level: 11 },
        { maxAlt: 13222, level: 12 },
        { maxAlt: 7000, level: 13 },
        { maxAlt: 4000, level: 14 },
        { maxAlt: 2500, level: 15 },
        { maxAlt: 1500, level: 16 },
        { maxAlt: 600, level: 17 },
        { maxAlt: 250, level: 18 },
        { maxAlt: 150, level: 19 },
        { maxAlt: 50, level: 20 }
    ];

    for (const { maxAlt, level } of levels) {
        if (cameraHeight >= maxAlt) {
            return level;
        }
    }

    return 20; // 默认级别
}
const xyzToAllInfo = async (x: number, y: number, z: number) => {
    const response = await fetch(`https://tileser.giiiis.com/xyzinfo/${z}/${x}/${y}`);
    const jsonData = response.json();
    return jsonData;
}

const getCurrentTileCoordinates = async (viewer: ESViewer) => {
    const position = viewer.getCurrentCameraInfo()?.position
    if (!position) return undefined;
    const longitude = position[0]
    const latitude = position[1]

    // 计算缩放级别 (Z)
    const cameraHeight = position[2];
    const level = altToZoom(cameraHeight);

    // 转换经纬度为瓦片坐标 (X, Y)
    let x = Math.floor((longitude + 180) / 360 * Math.pow(2, level + 1));
    let y = Math.floor((90 - latitude) / 180 * Math.pow(2, level));

    const allTimes = await xyzToAllInfo(x, y, level);

    return allTimes;
}


export class GetCurrentTileCoordinates extends Destroyable {
    constructor(viewer: ESViewer, sceneObject: ESGeHistoryImagery, esImageryLayer: ESImageryLayer) {
        super();
        // 获取初始时间
        const updateImageryLayer = async () => {
            const initialTimes: string[] | undefined = await getCurrentTileCoordinates(viewer); // 获取时间数据
            sceneObject.datesEvent.emit(initialTimes, viewer)
        }
        updateImageryLayer()

        let timer: any = undefined
        timer = setInterval(() => {
            updateImageryLayer()
        }, 3000)
        this.d(() => timer && clearInterval(timer))

        {
            const update = () => {
                const currentDate = sceneObject.currentDate ? sceneObject.currentDate : 0
                esImageryLayer.url = `https://tileser.giiiis.com/timetile/tms/${currentDate}/tilemapresource.xml`
            }
            update()
            this.d(sceneObject.currentDateChanged.don(update))
        }
    }
}
