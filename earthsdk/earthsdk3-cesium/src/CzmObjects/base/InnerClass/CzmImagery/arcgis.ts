import * as Cesium from 'cesium';

export class XbsjTileserArcgisHisImageryProvider extends Cesium.UrlTemplateImageryProvider {

    private _indexTimeID: number | string = 0;
    get indexTimeID() { return this._indexTimeID; }
    set indexTimeID(value: number | string) { this._indexTimeID = value; }

    constructor(options: any) {
        super(options);

        // 设置默认的 minimumLevel 和 tilingScheme
        options.url = "https://wayback.maptiles.arcgis.com/";
        options.minimumLevel = 1;
        options.maximumLevel = 18;

        // 初始化 indexTime 属性
        this.indexTimeID = options.indexTimeID || 0; // 默认值为 1
    }

    // @ts-ignore
    override async requestImage(x: any, y: any, level: any, request: any) {
        try {
            let imageUrl;
            if (this.indexTimeID !== 0) {
                imageUrl = this.buildImageUrl(this.indexTimeID, x, y, level);
            } else {
                imageUrl = `https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile/${level}/${y}/${x}`;
            }
            //@ts-ignore
            return Cesium.ImageryProvider.loadImage(this, imageUrl);
        } catch (error) {
            return undefined;
        }
    }

    buildImageUrl(indexTimeID: any, x: any, y: any, level: any) {
        // 构建并返回基于时间信息的图像 URL
        // 这里的实现取决于你的 URL 结构和如何使用时间信息

        return `https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile/${indexTimeID}/${level}/${y}/${x}`;
    }
}

async function arcgisXyzToAllInfo(x: number, y: number, level: number) {
    const response = await fetch(`https://tileser.giiiis.com/arcgis/${level}/${x}/${y}`);

    const jsonData = response.json();
    // const jsonData = response.text();

    return jsonData;
}

export async function getCurrentTileCoordinates(viewer: { scene: any; }) {
    const scene = viewer.scene;
    const ellipsoid = scene.globe.ellipsoid;
    const camera = scene.camera;

    // 获取相机的经纬度
    const cameraPositionCartographic = ellipsoid.cartesianToCartographic(camera.position);
    const longitude = Cesium.Math.toDegrees(cameraPositionCartographic.longitude);
    const latitude = Cesium.Math.toDegrees(cameraPositionCartographic.latitude);

    // 计算缩放级别 (Z)
    const cameraHeight = cameraPositionCartographic.height;
    const level = altToZoom(cameraHeight);

    // 转换经纬度为瓦片坐标 (X, Y)
    let x = Math.floor((longitude + 180) / 360 * Math.pow(2, level));

    let y = Math.floor((1 - Math.log(Math.tan(latitude * Math.PI / 180) + 1 / Math.cos(latitude * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, level));

    const allTimes = await arcgisXyzToAllInfo(x, y, level);
    return allTimes;
}



//3D级数转为2D高
function altToZoom(cameraHeight: number) {
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
            return level + 1;
        }
    }

    return 20; // 默认级别
}

