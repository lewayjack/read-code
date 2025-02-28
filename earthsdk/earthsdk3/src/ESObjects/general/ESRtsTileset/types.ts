import { ESDSFeature } from "./ESDSFeature"

/**
 * @params k - layerId 图层id
 * @params v - visible 控制显示隐藏
 * @params c - color  css的color值string
 * @example { '6fa8d4b9-19c9-46f8-9f1f-dc6d8b6f1044': { visible: true, color: '#00f701' } }
 */
export interface LayerType {
    [k: string]: { visible: boolean, color: string | null }
}


/**
 * 默认 替换 混合
 */
export type ColorModeType = "HIGHLIGHT" | "REPLACE" | "MIX"


export const apis = {
    layerconfigfind: `/ts/layer/config/get`,// 获取图层配置
    layerconfigsave: `/ts/layer/config/put`,// 保存图层配置
    // finddatasetbyid: `/ts/editor/finddatasetbyid`,// 通过id获取数据集
    featureproperty: `/ts/editor/property`,// 获取属性
    featureeditormuti: `/ts/editor/update`,// 批量编辑要素的空间状态
    getts: "/ts/info",// 获取切片服务的端口
}


/**
 * 获取图层配置
 * @param tileServiceName - 服务名称
 * @returns LayerType - 图层配置
 */
export const _getLayerConfig = async (baseUrl: string, tileServiceName: string) => {
    const authToken = window.localStorage.getItem('Authorization');
    const requestOptions = {
        headers: {
            ...(authToken ? { 'Authorization': authToken } : {})
        },
        mode: "cors", // 用来决定是否允许跨域请求  

    };
    // @ts-ignore
    const res = await fetch(baseUrl + `${apis.layerconfigfind}?tileServiceName=${tileServiceName}`, requestOptions);
    const jsonStr = await res.text();
    const json = JSON.parse(jsonStr) as LayerType;
    return json;
}

/**
 * 保存图层配置
 * @param tileServiceName - 服务名称
 * @returns LayerType - 图层配置
 */
export const _saveLayerConfig = async (baseUrl: string, tileServiceName: string, layerConfig?: LayerType) => {
    const authToken = window.localStorage.getItem('Authorization');
    const _layerConfig = layerConfig ?? {};
    const requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { 'Authorization': authToken } : {})
        },
        mode: "cors", // 用来决定是否允许跨域请求  
        body: JSON.stringify({
            tileServiceName: tileServiceName,
            layerConfig: JSON.stringify(_layerConfig)
        })
    };
    // @ts-ignore

    const res = await fetch(baseUrl + apis.layerconfigsave, requestOptions);
    const json = await res.text();
    return json;
}

// export const _findDatasetById = async (baseUrl: string, tileServiceName: string, featureId: string) => {
//     const data = { tileServiceName, featureId };
//     const token = window.localStorage.getItem("Authorization")
//     const req = await fetch(baseUrl + apis.finddatasetbyid, {
//         method: "post",
//         headers: {
//             'Content-Type': 'application/json',
//             ...(token ? { 'Authorization': token } : {})
//         },
//         body: JSON.stringify(data),
//         mode: "cors", // 用来决定是否允许跨域请求  


//     });
//     const jsonStr = await req.text();
//     const res = JSON.parse(jsonStr);
//     if (res.status == "ok") {
//         return res.data as string;
//     } else {
//         console.error(res);
//         return undefined
//     }
// }

export const _getFeatureProperty = async (baseUrl: string, tileServiceName: string, featureId: string) => {
    const data = { tileServiceName, featureId };
    const token = window.localStorage.getItem("Authorization")
    const req = await fetch(baseUrl + apis.featureproperty, {
        method: "post",
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': token } : {})
        },
        body: JSON.stringify(data),

        mode: "cors", // 用来决定是否允许跨域请求  

    });
    const jsonStr = await req.text();
    const res = JSON.parse(jsonStr);
    if (res.status == "ok") {
        return res.data as { [k: string]: any };
    } else {
        console.error(res.data.status);
        return undefined
    }

}

export const _commitEditings = async (baseUrl: string, data: { features: CommitItemType[] }) => {
    const token = window.localStorage.getItem("Authorization")
    const req = await fetch(baseUrl + apis.featureeditormuti, {
        method: "post",
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': token } : {})
        },
        body: JSON.stringify(data),
        mode: "cors", // 用来决定是否允许跨域请求  

    });
    const jsonStr = await req.text();
    const res = JSON.parse(jsonStr);
    if (res.status == "ok") {
        return res.data as { [k: string]: any };
    } else {
        console.error(res.data.status);
        return undefined
    }
}


/**
 * 获取切片服务的端口
 * @param {*} tileServiceName
 * @returns 
 */
export const _getport = async (url: string) => {
    const authToken = window.localStorage.getItem('Authorization');
    const requestOptions = {
        headers: {
            ...(authToken ? { 'Authorization': authToken } : {}),

        },
        mode: "cors", // 用来决定是否允许跨域请求  

    };
    // @ts-ignore
    const res = await fetch(url, requestOptions);
    const jsonStr = await res.text();
    const json = JSON.parse(jsonStr);
    if (json.status == "ok") {
        return json.data.port as string;
    } else {
        console.error(json.status);
        return undefined
    }
}


/**
 * @params id - Feature 图层id
 * @params name - 属性name
 * @params datasetName - 数据集名称
 * @params removed - 是否被移除
 * @params properties - 属性
 * @params dsFeature - ESDSFeature对象
 */

export type FeatureItem = {
    id: string,
    removed: boolean
    dsFeature: ESDSFeature
    name?: string,
    datasetName: string,
    properties?: any,
}


export type CommitItemType = {
    datasetName: string;
    featureId: string;
    removed: boolean;
    x: number;
    y: number;
    z: number;
    h: number;
    p: number;
    r: number;
    s: number;
}
