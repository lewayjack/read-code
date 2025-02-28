import { distanceToHumanStr } from './distanceToHumanStr';
import { angleToHumanStr } from './angleToHumanStr';

export function positionToHumanStr(position: [number, number, number], noSeconds = false) {
    const l = angleToHumanStr(position[0], noSeconds);
    const b = angleToHumanStr(position[1], noSeconds);
    const h = distanceToHumanStr(position[2]);
    return [l, b, h] as [longitude: string, latitude: string, height: string];
}
