import * as Cesium from 'cesium';
import { localPositionToPosition } from '.';
import { createProcessingFromAsyncFunc, step } from 'xbsj-base';
type returnMerge3dTilesServer = {
    state: 'success' | 'error';
    tilesUrl: { [xx: string]: any } | undefined,
    info?: {
        index: number,
        url: string,
        message: string
    }[];
};
function getBoundingVolume(tilesJson: any) {
    const transform = Reflect.has(tilesJson.root, 'transform') ? tilesJson.root.transform : Cesium.Matrix4.toArray(Cesium.Matrix4.IDENTITY);
    let originX, originY, originZ
    if (Reflect.has(tilesJson.root.boundingVolume, 'region')) {
        return tilesJson.root.boundingVolume.region;
    } else if (Reflect.has(tilesJson.root.boundingVolume, 'box')) {
        // 计算原点坐标
        const origin = Cesium.Cartesian3.fromArray((tilesJson.root.boundingVolume.box as Array<number>).slice(0, 3) as [number, number, number]);
        originX = Cesium.Cartesian3.add(
            origin, Cesium.Cartesian3.fromArray((tilesJson.root.boundingVolume.box as Array<number>).slice(3, 6) as [number, number, number]),
            new Cesium.Cartesian3()
        );
        originY = Cesium.Cartesian3.add(
            origin, Cesium.Cartesian3.fromArray((tilesJson.root.boundingVolume.box as Array<number>).slice(6, 9) as [number, number, number]),
            new Cesium.Cartesian3()
        );
        originZ = Cesium.Cartesian3.add(
            origin, Cesium.Cartesian3.fromArray((tilesJson.root.boundingVolume.box as Array<number>).slice(9, 12) as [number, number, number]),
            new Cesium.Cartesian3()
        );
    } else if (Reflect.has(tilesJson.root.boundingVolume, 'sphere')) {
        // 计算原点坐标
        const radius = (tilesJson.root.boundingVolume.sphere as Array<number>)[3];
        const origin = Cesium.Cartesian3.fromArray((tilesJson.root.boundingVolume.sphere as Array<number>).slice(0, 3) as [number, number, number]);
        originX = Cesium.Cartesian3.add(
            origin, Cesium.Cartesian3.fromArray([radius, 0, 0]), new Cesium.Cartesian3()
        );
        originY = Cesium.Cartesian3.add(
            origin, Cesium.Cartesian3.fromArray([0, radius, 0]), new Cesium.Cartesian3()
        );
        originZ = Cesium.Cartesian3.add(
            origin, Cesium.Cartesian3.fromArray([0, 0, radius]), new Cesium.Cartesian3()
        );
    }
    if (!originX || !originY || !originZ) {
        return '无法生成包围盒，请检查包围盒是否正确'
    }
    // 还原原点坐标到世界坐标系
    const X = localPositionToPosition(transform, [originX.x, originX.y, originX.z]);
    const reverseX = localPositionToPosition(transform, [-originX.x, -originX.y, -originX.z]);
    const Y = localPositionToPosition(transform, [originY.x, originY.y, originY.z]);
    const reverseY = localPositionToPosition(transform, [-originY.x, -originY.y, -originY.z]);
    const Z = localPositionToPosition(transform, [originZ.x, originZ.y, originZ.z]);
    const reverseZ = localPositionToPosition(transform, [-originZ.x, -originZ.y, -originZ.z]);

    return [
        Cesium.Math.toRadians(Math.min(X[0], reverseX[0], Y[0], reverseY[0], Z[0], reverseZ[0])),
        Cesium.Math.toRadians(Math.min(X[1], reverseX[1], Y[1], reverseY[1], Z[1], reverseZ[1])),
        Cesium.Math.toRadians(Math.max(X[0], reverseX[0], Y[0], reverseY[0], Z[0], reverseZ[0])),
        Cesium.Math.toRadians(Math.max(X[1], reverseX[1], Y[1], reverseY[1], Z[1], reverseZ[1])),
        Math.min(X[2], reverseX[2], Y[2], reverseY[2], Z[2], reverseZ[2]),
        Math.max(X[2], reverseX[2], Y[2], reverseY[2], Z[2], reverseZ[2]),
    ];
}
const process = createProcessingFromAsyncFunc(async (cancelsManager, tilesUrlArr: any[]) => {
    let returnRes: returnMerge3dTilesServer = {
        state: 'success',
        tilesUrl: {
            "asset": {
                "version": "1.1",
            },
            "geometricError": 0,
            "refine": "REPLACE",
            "root": {
                "boundingVolume": {
                    "region": []
                },
                "geometricError": 0,
                "refine": "REPLACE",
                "children": []
            }
        }
    };
    let tilesJsonArr = {} as { [xx: string]: any };
    let errorTilesServe: Exclude<returnMerge3dTilesServer['info'], undefined> = [];
    // 1.下载所有的3dtiles文件，出错文件返回错误信息
    await step(cancelsManager, async cancelsManager => {
        return new Promise<void>(async (resolve, reject) => {
            for (let index = 0; index < tilesUrlArr.length; index++) {
                const element = tilesUrlArr[index];
                await fetch(element).then(res => res.json()).then(data => {
                    if (data && !Reflect.has(data, 'success')) {
                        tilesJsonArr[element] = data;
                    } else {
                        errorTilesServe.push(
                            {
                                index,
                                url: element,
                                message: data.message
                            }
                        );
                    }
                    if (index == tilesUrlArr.length - 1) {
                        resolve();
                    }
                }).catch((error) => {
                    errorTilesServe.push(
                        {
                            index,
                            url: element,
                            message: error
                        }
                    );
                    if (index == tilesUrlArr.length - 1) {
                        resolve();
                    }
                })
            }
        })
    })
    if (errorTilesServe.length > 0) {
        returnRes.state = 'error';
        returnRes.info = errorTilesServe;
        if (errorTilesServe.length == tilesUrlArr.length) {
            returnRes.tilesUrl = undefined;
            return returnRes;
        }
    }
    // 2.遍历所有的3dtiles文件。获取每个文件的boundingVolume，geometricError
    const boundingVolumeArr = [] as number[][]; // 存储所有的boundingVolume
    const geometricErrorArr = [] as number[]; // 存储所有的geometricError
    const tilesChildrenArr = [] as { [xx: string]: any }[]; // 存储所有的children
    for (const key in tilesJsonArr) {
        const tilesJson = tilesJsonArr[key];;
        geometricErrorArr.push(tilesJson.geometricError ?? tilesJson.root.geometricError ?? 0);
        const boundingVolume = getBoundingVolume(tilesJson);
        boundingVolumeArr.push(boundingVolume);
        tilesChildrenArr.push({
            "content": {
                "uri": key,
            },
            "boundingVolume": {
                "region": boundingVolume
            },
            "geometricError": tilesJson.geometricError,
            "refine": "REPLACE"
        })
    }
    // 几何误差赋值
    if (returnRes.tilesUrl) {
        returnRes.tilesUrl.geometricError = returnRes.tilesUrl.root.geometricError = Math.max(...geometricErrorArr);
        returnRes.tilesUrl.root.boundingVolume.region = [
            Math.min(...boundingVolumeArr.map(x => x[0])),
            Math.min(...boundingVolumeArr.map(x => x[1])),
            Math.max(...boundingVolumeArr.map(x => x[2])),
            Math.max(...boundingVolumeArr.map(x => x[3])),
            Math.min(...boundingVolumeArr.map(x => x[4])),
            Math.max(...boundingVolumeArr.map(x => x[5]))
        ]
        returnRes.tilesUrl.root.children = tilesChildrenArr;
    }
    return returnRes
})
export function merge3dTilesServer(tilesUrlArr: any[]) {
    return new Promise<returnMerge3dTilesServer>((resolve, reject) => {
        process.restart(undefined, tilesUrlArr);
        process.completeEvent.don(res => {
            resolve(res);
        })
    })
}