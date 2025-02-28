import * as Cesium from 'cesium';

export class XbsjTileserHisImageryProvider extends Cesium.UrlTemplateImageryProvider {

    private _indexTime: number | string = 0;
    get indexTime() { return this._indexTime; }
    set indexTime(value: number | string) { this._indexTime = value; }

    constructor(options: any) {


        super(options);

        // 设置默认的 minimumLevel 和 tilingScheme
        options.url = "https://tileser.giiiis.com/timetile/";
        options.minimumLevel = 1;
        options.maximumLevel = 18;
        options.tilingScheme = new Cesium.GeographicTilingScheme();

        // 初始化 indexTime 属性
        this.indexTime = options.indexTime || 0; // 默认值为 1

    }
    // @ts-ignore
    override async requestImage(x: any, y: any, level: number, request: any) {
        // 重写 requestImage 方法以支持异步操作

        // 异步获取时间信息
        try {
            // @ts-ignore
            let imageUrl = this.buildImageUrl(this.indexTime, x, y, level);
            // @ts-ignore
            return Cesium.ImageryProvider.loadImage(this, imageUrl);
        } catch (error) {
            return undefined;
        }
    }
    // @ts-ignore
    buildImageUrl(indexTime, x, y, level) {
        return `https://tileser.giiiis.com/timetile/${indexTime}/${level}/${x}/${y}.jpg`;
    }
}

// class XbsjTileserArcgisImageryProvider extends Cesium.UrlTemplateImageryProvider {
//     constructor(options: { url: any; minimumLevel: any; maximumLevel: any; tilingScheme: any; indexTime?: any; options?: any; pickFeaturesUrl?: string | Cesium.Resource | undefined; urlSchemeZeroPadding?: any; subdomains?: string | string[] | undefined; credit?: string | Cesium.Credit | undefined; rectangle?: Cesium.Rectangle | undefined; ellipsoid?: Cesium.Ellipsoid | undefined; tileWidth?: number | undefined; tileHeight?: number | undefined; hasAlphaChannel?: boolean | undefined; getFeatureInfoFormats?: Cesium.GetFeatureInfoFormat[] | undefined; enablePickFeatures?: boolean | undefined; tileDiscardPolicy?: Cesium.TileDiscardPolicy | undefined; customTags?: any; }) {
//         // 设置默认的 minimumLevel 和 tilingScheme
//         options.url = "https://tileser.giiiis.com/tile/";
//         options.minimumLevel = 3;
//         options.maximumLevel = 18;
//         options.tilingScheme = new Cesium.GeographicTilingScheme();

//         super(options);

//         // 初始化 indexTime 属性
//         this.indexTime = options.indexTime || 0; // 默认值为 1

//         if (this.indexTime !== 0) {
//             this.indexTime = toGoogleDate(this.indexTime);
//         }
//     }

//     async requestImage(x: any, y: any, level: number, request: any) {
//         // 重写 requestImage 方法以支持异步操作

//         // 异步获取时间信息
//         try {
//             const timeInfo = await xyzToInfo(x, y, level + 1, parseInt(this.indexTime));
//             // 根据获取的时间信息构建新的 URL
//             let imageUrl = this.buildImageUrl(timeInfo, x, y, level);
//             return Cesium.ImageryProvider.loadImage(this, imageUrl);
//         } catch (error) {
//             return undefined;
//         }
//     }

//     buildImageUrl(timeInfo: { date: { toString: (arg0: number) => any; }; datedTileEpoch: any; }, x: any, y: any, level: number) {
//         // 构建并返回基于时间信息的图像 URL
//         // 这里的实现取决于你的 URL 结构和如何使用时间信息
//         let hexTime = timeInfo.date.toString(16);
//         return `https://tileser.giiiis.com/tile/${hexTime}/${level + 1}/${x}/${y}/${timeInfo.datedTileEpoch}`;
//     }
// }


// class XbsjTileserNowImageryProvider extends Cesium.UrlTemplateImageryProvider {
//     constructor(options: { url: any; minimumLevel: any; maximumLevel: any; tilingScheme: any; customTags: any; options?: any; pickFeaturesUrl?: string | Cesium.Resource | undefined; urlSchemeZeroPadding?: any; subdomains?: string | string[] | undefined; credit?: string | Cesium.Credit | undefined; rectangle?: Cesium.Rectangle | undefined; ellipsoid?: Cesium.Ellipsoid | undefined; tileWidth?: number | undefined; tileHeight?: number | undefined; hasAlphaChannel?: boolean | undefined; getFeatureInfoFormats?: Cesium.GetFeatureInfoFormat[] | undefined; enablePickFeatures?: boolean | undefined; tileDiscardPolicy?: Cesium.TileDiscardPolicy | undefined; }) {
//         // 设置默认的 minimumLevel 和 tilingScheme
//         options.url = "https://tileser.giiiis.com/now/{zz}/{x}/{y}";
//         options.minimumLevel = 1;
//         options.maximumLevel = 20;
//         options.tilingScheme = new Cesium.GeographicTilingScheme();
//         options.customTags={ zz: (imageryProvider: any, x: any, y: any, level: number) => level + 1 },
//         super(options);


//     }
// }

export const getCurrentTileCoordinates = async (viewer: any) => {
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
    let x = Math.floor((longitude + 180) / 360 * Math.pow(2, level + 1));
    let y = Math.floor((90 - latitude) / 180 * Math.pow(2, level));

    const allTimes = await xyzToAllInfo(x, y, level);

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
            return level;
        }
    }

    return 20; // 默认级别
}



async function xyzToAllInfo(x: number, y: number, z: number) {
    const response = await fetch(`https://tileser.giiiis.com/xyzinfo/${z}/${x}/${y}`);
    const jsonData = response.json();
    return jsonData;
}
