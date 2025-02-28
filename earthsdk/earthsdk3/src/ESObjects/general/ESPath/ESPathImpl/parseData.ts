import { TimePosRotType } from ".";

export function parseData(text: string) {
    try {
        const pathJson = JSON.parse(text);
        if (Array.isArray(pathJson)) {
            if (pathJson.length > 0) {
                const b0 = typeof pathJson[0][0] === 'number';
                const b1 = Array.isArray(pathJson[0][1]) && pathJson[0][1].length === 3;
                if (b0 && b1) {
                    return pathJson as TimePosRotType[];
                } else {
                    return undefined;
                }
                // geoPath.timePosRots = pathJson;
                // return ;
            }
        }
        throw new Error(`解析有问题`);
    } catch (error) {
        // 如果不是json数据，则认为一行有7个数字，一步步解析！
        const lines = text.split(/\n|\r\n/);
        const timePosRots: [time: number, pos: [number, number, number], rot: [number, number, number] | undefined][] = [];
        const linesLength = lines.length;
        for (let i = 0; i < linesLength; ++i) {
            const line = lines[i];
            const numbers = line.split(/[^0-9e\.\+\-]+/).filter(e => e !== '').map(e => +e);
            if (numbers.length < 4) {
                console.warn(`第${i + 1}行数据无法解析成路径的数据, 原内容为: ${line}`);
            } else {
                if (numbers.length < 7) {
                    timePosRots.push([numbers[0], [numbers[1], numbers[2], numbers[3]], undefined]);
                } else {
                    timePosRots.push([numbers[0], [numbers[1], numbers[2], numbers[3]], [numbers[4], numbers[5], numbers[6]]]);
                }
            }
        }

        // geoPath.timePosRots = timePosRots;
        // geoPath.computeRotIfUndefined();
        return timePosRots;
    }
}
