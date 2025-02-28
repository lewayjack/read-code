import * as Cesium from 'cesium';
import { ESJConditionItem, ESJNumConditionItem, ESJStrConditionItem } from 'earthsdk3';
// import {
//     ESJConditionItem,
//     ESJNumConditionItem, ESJStrConditionItem
// } from '../../objs';


export type ColorStyleConditionItem = { condition: ESJConditionItem[], color: [number, number, number, number] };
export type ShowStyleConditionItem = { condition: ESJConditionItem[], show: boolean };

export const quColor = (color: [number, number, number, number], result?: Cesium.Color) => {
    return Cesium.Color.fromBytes(color[0] * 255, color[1] * 255, color[2] * 255, color[3] * 255, result)
}
export const getStrColor = (item: ESJConditionItem, pvalue: any) => {
    const condition = item as ESJStrConditionItem;
    let flag = false;
    // "==" | "!=" | "contain" | "empty"
    switch (condition.op) {
        case '==':
            (pvalue === condition.value) && (flag = true); break;
        case '!=':
            (pvalue !== condition.value) && (flag = true); break;
        case 'contain':
            (pvalue && pvalue.includes(condition.value)) && (flag = true); break;
        case 'empty':
            (pvalue === '' || pvalue === null || pvalue === undefined || !pvalue) && (flag = true); break;
        default:
            flag = false; break;
    }
    // console.log('getStrColor', flag, pvalue, condition);

    return flag
}
export const getNumColor = (item: ESJConditionItem, pvalue: any) => {
    const condition = item as ESJNumConditionItem;
    let flag = false;
    //"==" | "!=" | ">" | ">=" | "<" | "<="
    switch (condition.op) {
        case '==':
            (pvalue === condition.value) && (flag = true); break;
        case '!=':
            (pvalue !== condition.value) && (flag = true); break;
        case '>':
            (pvalue > condition.value) && (flag = true); break;
        case '>=':
            (pvalue >= condition.value) && (flag = true); break;
        case '<':
            (pvalue < condition.value) && (flag = true); break;
        case '<=':
            (pvalue <= condition.value) && (flag = true); break;
        default:
            flag = false; break;
    }
    // console.log('getNumColor', flag, pvalue, condition);

    return flag;
}
export const getColor = (item: ColorStyleConditionItem, feature: Cesium.Cesium3DTileFeature) => {
    const flags: boolean[] = [];
    for (let condition of item.condition) {
        const isBoolean = typeof condition === 'boolean';
        if (isBoolean) {
            flags.push(condition as boolean);
            continue;
        }
        const isStr = typeof (condition as ESJNumConditionItem | ESJStrConditionItem).value === 'string';
        const isNumber = typeof (condition as ESJNumConditionItem | ESJStrConditionItem).value === 'number';
        if (!isStr && !isNumber) {
            flags.push(false);
            continue;
        }
        //支持字符串类型 _ds.xxx.xxx
        const field = (condition as ESJNumConditionItem | ESJStrConditionItem).field as string;//根据字符串中的"."截断key 
        let pvalue: { [key: string]: any } | number | string | undefined = undefined;
        if (field.includes('.')) {
            //出现异常直接返回false
            try {
                const keys = field.split('.');
                pvalue = JSON.parse(feature.getProperty(keys[0]));
                for (let str of keys.slice(1)) {
                    pvalue = (pvalue as { [key: string]: any })?.[str];
                    if (pvalue === undefined) {
                        throw new Error(`${pvalue}上不存在属性${str},将使用默认颜色!`);
                    }
                }
            } catch (error) {
                flags.push(false);
                continue;
            }
        } else {
            pvalue = feature.getProperty(field);
        }
        if (isStr) {
            flags.push(getStrColor(condition, pvalue));
            continue;
        } else if (isNumber) {
            flags.push(getNumColor(condition, pvalue));
            continue;
        } else {
            flags.push(false);
            continue;
        }
    }
    return flags;
}


export const getShow = (item: ShowStyleConditionItem, feature: Cesium.Cesium3DTileFeature) => {
    const flags: boolean[] = [];
    for (let condition of item.condition) {
        const isBoolean = typeof condition === 'boolean';
        if (isBoolean) {
            flags.push(condition as boolean);
            continue;
        }
        const isStr = typeof (condition as ESJNumConditionItem | ESJStrConditionItem).value === 'string';
        const isNumber = typeof (condition as ESJNumConditionItem | ESJStrConditionItem).value === 'number';
        if (!isStr && !isNumber) {
            flags.push(false);
            continue;
        }
        //支持字符串类型 _ds.xxx.xxx
        const field = (condition as ESJNumConditionItem | ESJStrConditionItem).field;//根据字符串中的"."截断key 
        let pvalue: { [key: string]: any } | number | string | undefined = undefined;
        if (field.includes('.')) {
            //出现异常直接返回默认颜色
            try {
                const keys = field.split('.');
                pvalue = JSON.parse(feature.getProperty(keys[0]));
                for (let str of keys.slice(1)) {
                    pvalue = (pvalue as { [key: string]: any })?.[str];
                    if (pvalue === undefined) {
                        throw new Error(`${pvalue}上不存在属性${str},将使用默认颜色!`);
                    }
                }
            } catch (error) {
                flags.push(false);
                continue;
            }
        } else {
            pvalue = feature.getProperty(field);
        }
        if (isStr) {
            flags.push(getStrBool(condition, pvalue));
            continue;
        } else if (isNumber) {
            flags.push(getNumBool(condition, pvalue));
            continue;
        } else {
            flags.push(false);
            continue;
        }
    }
    return flags;
}

export const getStrBool = (item: ESJConditionItem, pvalue: any) => {
    const condition = item as ESJStrConditionItem;
    let flag = false;
    // "==" | "!=" | "contain" | "empty"
    switch (condition.op) {
        case '==':
            (pvalue === condition.value) && (flag = true); break;
        case '!=':
            (pvalue !== condition.value) && (flag = true); break;
        case 'contain':
            (pvalue.includes(condition.value)) && (flag = true); break;
        case 'empty':
            (pvalue === '' || pvalue === null || pvalue === undefined || !pvalue) && (flag = true); break;
        default:
            flag = false; break;
    }
    // console.log('getStrBool', flag, pvalue, condition);

    return flag;
}
export const getNumBool = (item: ESJConditionItem, pvalue: any) => {
    const condition = item as ESJNumConditionItem;
    let flag = false;
    //"==" | "!=" | ">" | ">=" | "<" | "<="
    switch (condition.op) {
        case '==':
            (pvalue === condition.value) && (flag = true); break;
        case '!=':
            (pvalue !== condition.value) && (flag = true); break;
        case '>':
            (pvalue > condition.value) && (flag = true); break;
        case '>=':
            (pvalue >= condition.value) && (flag = true); break;
        case '<':
            (pvalue < condition.value) && (flag = true); break;
        case '<=':
            (pvalue <= condition.value) && (flag = true); break;
        default:
            flag = false; break;
    }
    // console.log('getNumBool', flag, pvalue, condition);

    return flag;
}
