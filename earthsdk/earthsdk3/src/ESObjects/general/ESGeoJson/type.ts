import { ESJResource } from "../../../ESJTypes";

export type ESJImageStyle = {
    url: string | ESJResource;
    size: [number, number];
    anchor: [number, number];
    offset: [number, number];
}
export type ESJTextStyle = {
    textProperty: string,
    defaultText: string,
    color: [number, number, number, number],
    backgroundColor: [number, number, number, number] | undefined,
    fontFamily: string,
    fontSize: number,
    fontStyle: string,
    fontWeight: string,
    anchor: [number, number],
    offset: [number, number],
}

export const data = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [
                    116.2,
                    39.56
                ]
            },
            "properties": {
                "title": "swimming",
                "marker-symbol": "swimming",
                "marker-color": "#8F1312"
            }
        },
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [
                    115.2,
                    38.56
                ]
            },
            "properties": {
                "title": "8",
                "marker-symbol": "8",
                "marker-color": "#46117E"
            }
        },
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [
                    114.2,
                    37.56
                ]
            },
            "properties": {
                "title": "6",
                "marker-symbol": "6",
                "marker-color": "#713291"
            }
        }
    ]
}

export const dataMd = `\
properties是一个包含三个属性的对象，title表示标题，marker-symbol表示点位的文字内容，marker-color表示点位颜色，properties可以删除，然后使用场景对象属性设置。
\`\`\`
{
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [
                    116.2,
                    39.56
                ]
            },
            "properties": {
                "title": "swimming",
                "marker-symbol": "swimming",
                "marker-color": "#8F1312"
            }
        },
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [
                    115.2,
                    38.56
                ],
                "properties": {
                    "title": "8",
                    "marker-symbol": "8",
                    "marker-color": "#46117E"
                }
            }
        },
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [
                    114.2,
                    37.56
                ],
                "properties": {
                    "title": "6",
                    "marker-symbol": "6",
                    "marker-color": "#713291"
                }
            }
        }
    ]
}
\`\`\`
`

export const defaultLoadFuncStr = `\
// dataSource
(dataSource) => {
    if (dataSource) {
        dataSource.show = true;

        const entities = dataSource.entities.values;
        const colorHash = {};
        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
            const name = entity.name;
            let color = colorHash[name];
            if (!color) {
                color = Cesium.Color.fromRandom({
                    alpha: 1.0,
                });
                colorHash[name] = color;
            }
            if (entity.polygon) {

                entity.polygon.material = color;
                entity.polygon.outline = false;
                entity.polygon.extrudedHeight = entity.properties.Population / 50.0;
            }
        }
    }
}
`;

export const defaultLoadFuncDocStr = `\
示例代码  
\`\`\`
${defaultLoadFuncStr}
\`\`\`
`

export function isJSONString(str: string) {
    try {
        JSON.parse(str);
        return true;
    } catch (e) {
        return false;
    }
}
