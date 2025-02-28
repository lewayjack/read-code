//TODO:AXEJ 后期getDistancesAndTimePosRotsFromPositions脱离Ceisum 在实现
// import { getDistancesAndTimePosRotsFromPositions } from "@czmSrc/utils";
// import { TimePosRotType } from ".";
// import { lerpAngle } from "@sdkSrc/utils";

// function subdivideInner(
//     leftTimePosRot: TimePosRotType,
//     rightTimePosRot: TimePosRotType,
//     arcType: "GEODESIC" | "NONE" | "RHUMB" = "GEODESIC",
//     granularity = Math.PI / 180
// ) {
//     const newTimePosRots: TimePosRotType[] = [];

//     const [t0, p0, r0] = leftTimePosRot;
//     const [t1, p1, r1] = rightTimePosRot;

//     newTimePosRots.push(leftTimePosRot);

//     const result = getDistancesAndTimePosRotsFromPositions([p0, p1], arcType, granularity);
//     if (result) {
//         const { timePosRots: tprs } = result;
//         const l = tprs.length;
//         const t = tprs[l - 1][0];
//         const t_1 = 1 / t;

//         for (let i = 1; i < l - 1; ++i) {
//             const ratio = tprs[i][0] * t_1;
//             tprs[i][0] = t0 + (t1 - t0) * ratio;
//             if (r0 && r1) {
//                 tprs[i][2] = [lerpAngle(r0[0], r1[0], ratio), lerpAngle(r0[1], r1[1], ratio), lerpAngle(r0[2], r1[2], ratio)];
//             } else if (r0) {
//                 tprs[i][2] = [...r0];
//             } else if (r1) {
//                 tprs[i][2] = [...r1];
//             }
//             newTimePosRots.push(tprs[i]);
//         }
//     }
//     newTimePosRots.push(rightTimePosRot);

//     return newTimePosRots;
// }
// export function subdivide(timePosRots: TimePosRotType[], arcType: "GEODESIC" | "NONE" | "RHUMB" = "GEODESIC", granularity = Math.PI / 180) {
//     const newTimePosRots: TimePosRotType[] = [];

//     const l = timePosRots.length;
//     for (let i = 0; i < l - 1; ++i) {
//         if (newTimePosRots.length > 0) newTimePosRots.pop(); // 去掉最后一项，避免重复！
//         const left = timePosRots[i];
//         const right = timePosRots[i + 1];
//         const result = subdivideInner(left, right, arcType, granularity);
//         result.forEach(e => newTimePosRots.push(e));
//     }

//     return newTimePosRots;
// }
