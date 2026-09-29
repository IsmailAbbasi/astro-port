/**
 * The simulated satellite (IA-01) and ground station (New Delhi) behind the
 * hero globe and the AOS/LOS light in the top bar. A sun-synchronous-like
 * polar orbit, sped up so a pass happens every few seconds.
 *
 * Mission time starts when the page first loads and keeps running across
 * client-side navigations, so the top bar and the globe always agree.
 */

import { reduceMotion } from "./lifecycle";

export type Vec3 = [number, number, number];

export const D = Math.PI / 180;
export const TAU = Math.PI * 2;

export const INC = 97.5 * D;
export const CI = Math.cos(INC);
export const SI = Math.sin(INC);
export const PERIOD = 40;
const WOB_T = 260;
const WOB_A = 6 * D;
/** Coverage half-angle: ground inside this cone of the satellite is lit. */
export const FOOT = 26 * D;
export const K = Math.cos(FOOT);
/** Drawn orbit radius (exaggerated). */
export const ALT = 1.17;

export function ll(lat: number, lon: number): Vec3 {
	const la = lat * D;
	const lo = lon * D;
	return [Math.cos(la) * Math.cos(lo), Math.cos(la) * Math.sin(lo), Math.sin(la)];
}

/** Ground station, New Delhi. */
export const G = ll(28.61, 77.21);

// Pick the orbit's node and phase so the first pass comes soon after load.
let OM0 = 0;
let U0 = 0;
(function solve() {
	let best = 1e9;
	for (let d = 0; d < 360; d += 0.05) {
		const om = d * D;
		const off = Math.asin(Math.sin(om) * SI * G[0] - Math.cos(om) * SI * G[1] + CI * G[2]);
		const e = Math.abs(off - 5 * D);
		if (e < best) {
			best = e;
			OM0 = om;
		}
	}
	let bu = -2;
	const c = Math.cos(OM0);
	const s = Math.sin(OM0);
	for (let d = 0; d < 360; d += 0.1) {
		const u = d * D;
		const dot =
			(c * Math.cos(u) - s * Math.sin(u) * CI) * G[0] +
			(s * Math.cos(u) + c * Math.sin(u) * CI) * G[1] +
			Math.sin(u) * SI * G[2];
		if (dot > bu) {
			bu = dot;
			U0 = u;
		}
	}
	U0 -= 21 * D;
})();

/** Longitude of the ascending node at time t (it wobbles slowly). */
export function nodeAt(t: number): number {
	return OM0 + WOB_A * Math.sin((TAU * t) / WOB_T);
}

/** Unit vector of the sub-satellite point at time t. */
export function satAt(t: number, o: Vec3): Vec3 {
	const Om = nodeAt(t);
	const u = (TAU * t) / PERIOD + U0;
	const cO = Math.cos(Om);
	const sO = Math.sin(Om);
	const cu = Math.cos(u);
	const su = Math.sin(u);
	o[0] = cO * cu - sO * su * CI;
	o[1] = sO * cu + cO * su * CI;
	o[2] = su * SI;
	return o;
}

const tmp: Vec3 = [0, 0, 0];

/** Satellite elevation above the ground station's horizon, in radians. */
export function elevAt(t: number): number {
	satAt(t, tmp);
	const c = tmp[0] * G[0] + tmp[1] * G[1] + tmp[2] * G[2];
	return Math.atan2(c - K, Math.sqrt(Math.max(0, 1 - c * c)));
}

/** Seconds until the link changes state (AOS ↔ LOS). */
export function untilChange(t: number): number {
	const aos = elevAt(t) > 0;
	const lim = t + PERIOD * 2;
	let tt = t;
	while (tt < lim && elevAt(tt) > 0 === aos) tt += 0.1;
	return tt - t;
}

const T0 = performance.now();

/** Seconds since the page loaded. Frozen at 0 when reduced motion is on. */
export function missionTime(): number {
	return reduceMotion ? 0 : (performance.now() - T0) / 1000;
}
