/**
 * Hero globe: a dotted orthographic Earth centred on India, with the IA-01
 * satellite on a polar orbit lighting the ground below it and linking to
 * the New Delhi ground station as it passes overhead. Canvas 2D, no
 * libraries. Ported from the design file.
 *
 * Colours come from the theme tokens in global.css and are re-read on
 * `themechange`, so the globe follows the light/dark toggle.
 */

import { LAND } from "./globe-land";
import { reduceMotion } from "./lifecycle";
import {
	ALT,
	CI,
	D,
	FOOT,
	G,
	K,
	PERIOD,
	SI,
	TAU,
	elevAt,
	ll,
	missionTime,
	nodeAt,
	satAt,
	untilChange,
	type Vec3,
} from "./orbit";

type RGB = [number, number, number];

interface Land {
	PX: Float32Array;
	PY: Float32Array;
	PZ: Float32Array;
	N: number;
}

let land: Land | null = null;

// Decode once per page load; the data doesn't change between navigations.
function getLand(): Land {
	if (land) return land;
	let bin = "";
	try {
		bin = atob(LAND);
	} catch {
		bin = "";
	}
	const N = bin.length >> 2;
	const PX = new Float32Array(N);
	const PY = new Float32Array(N);
	const PZ = new Float32Array(N);
	for (let i = 0; i < N; i++) {
		let la = bin.charCodeAt(4 * i) | (bin.charCodeAt(4 * i + 1) << 8);
		if (la > 32767) la -= 65536;
		let lo = bin.charCodeAt(4 * i + 2) | (bin.charCodeAt(4 * i + 3) << 8);
		if (lo > 32767) lo -= 65536;
		const lat = (la / 100) * D;
		const lon = (lo / 100) * D;
		PX[i] = Math.cos(lat) * Math.cos(lon);
		PY[i] = Math.cos(lat) * Math.sin(lon);
		PZ[i] = Math.sin(lat);
	}
	land = { PX, PY, PZ, N };
	return land;
}

// Graticule: parallels every 30°, meridians every 30°.
const grat: Vec3[][] = [];
for (let la = -60; la <= 60; la += 30) {
	const line: Vec3[] = [];
	for (let lo = -180; lo <= 180; lo += 3) line.push(ll(la, lo));
	grat.push(line);
}
for (let lo = -180; lo < 180; lo += 30) {
	const line: Vec3[] = [];
	for (let la = -87; la <= 87; la += 3) line.push(ll(la, lo));
	grat.push(line);
}

/** Resolve theme tokens to RGB through a probe element (works for any colour syntax). */
function readColors(host: HTMLElement) {
	const probe = document.createElement("span");
	probe.style.display = "none";
	host.appendChild(probe);
	const get = (name: string): RGB => {
		probe.style.color = `var(${name})`;
		const parts = getComputedStyle(probe).color.match(/[\d.]+/g) ?? ["0", "0", "0"];
		return [Number(parts[0]), Number(parts[1]), Number(parts[2])];
	};
	const colors = {
		ink: get("--ink"),
		ink2: get("--ink-2"),
		kap: get("--kapton"),
		kap2: get("--kapton-2"),
		nom: get("--nominal"),
		panel: get("--panel-2"),
		vd: get("--void"),
	};
	probe.remove();
	return colors;
}

function rgba(c: RGB, a: number): string {
	return `rgba(${c[0]},${c[1]},${c[2]},${a})`;
}

function fmtT(s: number): string {
	const n = Math.max(0, Math.round(s));
	const mm = (n / 60) | 0;
	const ss = n % 60;
	return `${mm < 10 ? "0" : ""}${mm}:${ss < 10 ? "0" : ""}${ss}`;
}

/** Start the globe inside `root` (the <figure>). Returns a function that stops it. */
export function initGlobe(root: HTMLElement): () => void {
	const cv = root.querySelector("canvas");
	const ctx = cv?.getContext("2d");
	if (!cv || !ctx) return () => {};

	const { PX, PY, PZ, N } = getLand();
	const VX = new Float32Array(N);
	const VY = new Float32Array(N);
	const VD = new Float32Array(N);
	const LIT = new Uint8Array(N);

	const out = {
		sub: root.querySelector<HTMLElement>('[data-readout="sub"]'),
		el: root.querySelector<HTMLElement>('[data-readout="el"]'),
		next: root.querySelector<HTMLElement>('[data-readout="next"]'),
		hud: root.querySelector<HTMLElement>("[data-hud-link]"),
	};
	const label = root.dataset.callsign || "IA-01";
	const station = root.dataset.station || "GS-DEL";

	let C = readColors(root);
	// The Fonts API family name, e.g. from --font-mono; canvas needs it spelled out.
	let mono = "monospace";
	const readFont = () => {
		mono = getComputedStyle(document.documentElement).getPropertyValue("--font-mono").trim() || "monospace";
	};
	readFont();

	// Camera
	const cam = { c1: 1, s1: 0, c2: 1, s2: 0 };
	const setCam = (l: number, p: number) => {
		cam.c1 = Math.cos(l);
		cam.s1 = Math.sin(l);
		cam.c2 = Math.cos(p);
		cam.s2 = Math.sin(p);
	};
	const view = (x: number, y: number, z: number, o: Vec3): Vec3 => {
		const a = x * cam.c1 + y * cam.s1;
		o[0] = a * cam.c2 + z * cam.s2;
		o[1] = -x * cam.s1 + y * cam.c1;
		o[2] = -a * cam.s2 + z * cam.c2;
		return o;
	};

	// Ground-track trail
	const TRAIL_STEP = 0.08;
	const TRAIL_LEN = PERIOD * 0.8;
	const trail: [number, number, number, number][] = [];
	let trailLast = -1e9;
	const tv: Vec3 = [0, 0, 0];
	const updateTrail = (t: number) => {
		const start = Math.max(trailLast + TRAIL_STEP, t - TRAIL_LEN);
		for (let tt = start; tt <= t; tt += TRAIL_STEP) {
			satAt(tt, tv);
			trail.push([tv[0], tv[1], tv[2], tt]);
			trailLast = tt;
		}
		while (trail.length && trail[0][3] < t - TRAIL_LEN) trail.shift();
	};

	// Camera motion + drag
	const CAM_L = 74 * D;
	const CAM_A = 14 * D;
	const CAM_T = 75;
	const CAM_P = 16 * D;
	let drag = 0;
	let dragging = false;
	let dragX = 0;
	let dragStart = 0;
	let DPR = 1;
	let t = missionTime();
	const S: Vec3 = [0, 0, 0];
	const V: Vec3 = [0, 0, 0];
	const Q: Vec3 = [0, 0, 0];

	function draw() {
		const W = cv!.width;
		const H = cv!.height;
		if (!W || !H) return;
		const c = ctx!;
		c.clearRect(0, 0, W, H);
		const cx = W / 2;
		const cy = H / 2;
		const R = Math.min(W, H) * 0.385;
		const dp = DPR;
		setCam(CAM_L + CAM_A * Math.sin((TAU * t) / CAM_T) + drag, CAM_P);
		satAt(t, S);

		// Globe body
		const g2 = c.createRadialGradient(cx - R * 0.38, cy - R * 0.42, R * 0.05, cx, cy, R);
		g2.addColorStop(0, rgba(C.panel, 1));
		g2.addColorStop(1, rgba(C.vd, 1));
		c.fillStyle = g2;
		c.beginPath();
		c.arc(cx, cy, R, 0, TAU);
		c.fill();
		c.strokeStyle = rgba(C.ink2, 0.16);
		c.lineWidth = 1 * dp;
		c.stroke();

		// Graticule
		c.strokeStyle = rgba(C.ink2, 0.07);
		c.lineWidth = 1 * dp;
		c.beginPath();
		for (const line of grat) {
			let pen = false;
			for (const p of line) {
				view(p[0], p[1], p[2], V);
				if (V[0] > 0) {
					const sx = cx + R * V[1];
					const sy = cy - R * V[2];
					if (pen) c.lineTo(sx, sy);
					else c.moveTo(sx, sy);
					pen = true;
				} else pen = false;
			}
		}
		c.stroke();

		// Land dots: project, then mark the ones inside the satellite's footprint as lit
		const { c1, s1, c2, s2 } = cam;
		const sx0 = S[0];
		const sy0 = S[1];
		const sz0 = S[2];
		for (let k = 0; k < N; k++) {
			const x = PX[k];
			const y = PY[k];
			const z = PZ[k];
			const a = x * c1 + y * s1;
			const d = a * c2 + z * s2;
			VD[k] = d;
			if (d <= 0) continue;
			VX[k] = cx + R * (-x * s1 + y * c1);
			VY[k] = cy - R * (-a * s2 + z * c2);
			LIT[k] = x * sx0 + y * sy0 + z * sz0 > K ? 1 : 0;
		}
		const base = Math.max(1, R * 0.0096);
		const BA = [0.14, 0.27, 0.42, 0.6];
		for (let b = 0; b < 4; b++) {
			c.fillStyle = rgba(C.ink2, BA[b]);
			c.beginPath();
			const bsz = base * (0.62 + 0.12 * b);
			for (let k = 0; k < N; k++) {
				const dd = VD[k];
				if (dd <= 0 || LIT[k]) continue;
				if (Math.min(3, (dd * 4) | 0) !== b) continue;
				c.rect(VX[k] - bsz / 2, VY[k] - bsz / 2, bsz, bsz);
			}
			c.fill();
		}
		for (let b = 0; b < 2; b++) {
			c.fillStyle = rgba(b ? C.kap2 : C.kap, b ? 0.95 : 0.6);
			c.beginPath();
			const bsz = base * (b ? 1.05 : 0.85);
			for (let k = 0; k < N; k++) {
				if (VD[k] <= 0 || !LIT[k]) continue;
				if ((VD[k] > 0.5 ? 1 : 0) !== b) continue;
				c.rect(VX[k] - bsz / 2, VY[k] - bsz / 2, bsz, bsz);
			}
			c.fill();
		}

		// Footprint circle
		const e1: Vec3 = [-S[1], S[0], 0];
		const n1 = Math.hypot(e1[0], e1[1]) || 1;
		e1[0] /= n1;
		e1[1] /= n1;
		const e2: Vec3 = [S[1] * e1[2] - S[2] * e1[1], S[2] * e1[0] - S[0] * e1[2], S[0] * e1[1] - S[1] * e1[0]];
		const cf = Math.cos(FOOT);
		const sf = Math.sin(FOOT);
		c.setLineDash([3 * dp, 4 * dp]);
		c.strokeStyle = rgba(C.kap, 0.7);
		c.lineWidth = 1 * dp;
		c.beginPath();
		let penf = false;
		for (let q = 0; q <= 96; q++) {
			const an = (q / 96) * TAU;
			const ca = Math.cos(an);
			const sa = Math.sin(an);
			view(
				cf * S[0] + sf * (ca * e1[0] + sa * e2[0]),
				cf * S[1] + sf * (ca * e1[1] + sa * e2[1]),
				cf * S[2] + sf * (ca * e1[2] + sa * e2[2]),
				V,
			);
			if (V[0] > 0) {
				if (penf) c.lineTo(cx + R * V[1], cy - R * V[2]);
				else c.moveTo(cx + R * V[1], cy - R * V[2]);
				penf = true;
			} else penf = false;
		}
		c.stroke();
		c.setLineDash([]);

		// Ground-track trail
		for (let ti = 0; ti < trail.length; ti += 2) {
			const p = trail[ti];
			view(p[0], p[1], p[2], V);
			if (V[0] <= 0) continue;
			const age = (t - p[3]) / TRAIL_LEN;
			if (age < 0) continue;
			c.fillStyle = rgba(C.kap, (1 - age) * 0.75 * (0.4 + 0.6 * V[0]));
			c.beginPath();
			c.arc(cx + R * V[1], cy - R * V[2], base * 0.55, 0, TAU);
			c.fill();
		}

		// Orbit ring (faint where it passes behind the globe)
		const Om = nodeAt(t);
		const cO = Math.cos(Om);
		const sO = Math.sin(Om);
		c.lineWidth = 1 * dp;
		let prev: [number, number, boolean, boolean] | null = null;
		for (let oi = 0; oi <= 180; oi++) {
			const u = (oi / 180) * TAU;
			const cu = Math.cos(u);
			const su = Math.sin(u);
			view((cO * cu - sO * su * CI) * ALT, (sO * cu + cO * su * CI) * ALT, su * SI * ALT, V);
			const hid = V[0] < 0 && V[1] * V[1] + V[2] * V[2] < 1;
			const cur: [number, number, boolean, boolean] = [cx + R * V[1], cy - R * V[2], hid, V[0] >= 0];
			if (prev && !prev[2] && !cur[2]) {
				c.strokeStyle = rgba(C.ink2, cur[3] ? 0.34 : 0.12);
				c.beginPath();
				c.moveTo(prev[0], prev[1]);
				c.lineTo(cur[0], cur[1]);
				c.stroke();
			}
			prev = cur;
		}

		// Ground station
		view(G[0], G[1], G[2], Q);
		const aos = elevAt(t) > 0;
		const gx = cx + R * Q[1];
		const gy = cy - R * Q[2];
		const gFront = Q[0] > 0.05;
		view(S[0] * ALT, S[1] * ALT, S[2] * ALT, V);
		const satHidden = V[0] < 0 && V[1] * V[1] + V[2] * V[2] < 1;
		const sx1 = cx + R * V[1];
		const sy1 = cy - R * V[2];
		const font = `${9.5 * dp}px ${mono}`;

		if (aos && gFront && !satHidden) {
			c.setLineDash([4 * dp, 4 * dp]);
			c.lineDashOffset = -(t * 30 * dp) % (8 * dp);
			c.strokeStyle = rgba(C.kap2, 0.9);
			c.lineWidth = 1.2 * dp;
			c.beginPath();
			c.moveTo(gx, gy);
			c.lineTo(sx1, sy1);
			c.stroke();
			c.setLineDash([]);
		}
		if (gFront) {
			if (aos) {
				const pr = (t * 1.2) % 1;
				c.strokeStyle = rgba(C.nom, 0.7 * (1 - pr));
				c.lineWidth = 1 * dp;
				c.beginPath();
				c.arc(gx, gy, (4 + pr * 14) * dp, 0, TAU);
				c.stroke();
			}
			c.fillStyle = rgba(C.vd, 1);
			c.strokeStyle = aos ? rgba(C.nom, 1) : rgba(C.ink, 0.9);
			c.lineWidth = 1.2 * dp;
			c.beginPath();
			c.rect(gx - 3.5 * dp, gy - 3.5 * dp, 7 * dp, 7 * dp);
			c.fill();
			c.stroke();
			c.font = font;
			c.textBaseline = "middle";
			c.fillStyle = aos ? rgba(C.nom, 1) : rgba(C.ink, 0.8);
			const gLeft = !satHidden && sx1 > gx;
			c.textAlign = gLeft ? "right" : "left";
			c.fillText(station, gLeft ? gx - 10 * dp : gx + 10 * dp, gy + 11 * dp);
			c.textAlign = "left";
		}

		// Satellite
		if (!satHidden) {
			const gl = c.createRadialGradient(sx1, sy1, 0, sx1, sy1, 16 * dp);
			gl.addColorStop(0, rgba(C.kap, 0.35));
			gl.addColorStop(1, rgba(C.kap, 0));
			c.fillStyle = gl;
			c.beginPath();
			c.arc(sx1, sy1, 16 * dp, 0, TAU);
			c.fill();
			c.fillStyle = rgba(C.ink2, 0.9);
			c.fillRect(sx1 - 11 * dp, sy1 - 2 * dp, 7 * dp, 4 * dp);
			c.fillRect(sx1 + 4 * dp, sy1 - 2 * dp, 7 * dp, 4 * dp);
			c.fillStyle = rgba(C.kap2, 1);
			c.fillRect(sx1 - 3 * dp, sy1 - 3 * dp, 6 * dp, 6 * dp);
			c.font = font;
			c.textBaseline = "middle";
			const sLeft = gFront && sx1 < gx;
			c.textAlign = sLeft ? "right" : "left";
			c.fillStyle = rgba(C.kap2, 1);
			c.fillText(label, sLeft ? sx1 - 14 * dp : sx1 + 14 * dp, sy1 - 11 * dp);
			c.textAlign = "left";
		}
	}

	const RS: Vec3 = [0, 0, 0];
	function readouts() {
		satAt(t, RS);
		const lat = Math.asin(RS[2]) / D;
		const lon = Math.atan2(RS[1], RS[0]) / D;
		if (out.sub) {
			out.sub.textContent = `${Math.abs(lat).toFixed(1)}°${lat >= 0 ? "N" : "S"} ${Math.abs(lon).toFixed(1)}°${lon >= 0 ? "E" : "W"}`;
		}
		const el = elevAt(t);
		const aos = el > 0;
		if (out.el) out.el.textContent = aos ? `${(el / D).toFixed(1)}°` : "Below horizon";
		const left = untilChange(t);
		if (out.next) out.next.textContent = aos ? `Now · ${fmtT(left)} left` : `In ${fmtT(left)}`;
		if (out.hud) {
			out.hud.textContent = aos ? "Signal acquired" : "Loss of signal";
			out.hud.classList.toggle("on", aos);
		}
	}

	function resize() {
		const r = cv!.getBoundingClientRect();
		DPR = Math.min(2, window.devicePixelRatio || 1);
		cv!.width = Math.round(r.width * DPR);
		cv!.height = Math.round(r.height * DPR);
		draw();
	}
	const ro = "ResizeObserver" in window ? new ResizeObserver(resize) : null;
	if (ro) ro.observe(cv);
	else window.addEventListener("resize", resize);

	// Drag to turn
	cv.addEventListener("pointerdown", (e) => {
		dragging = true;
		dragX = e.clientX;
		dragStart = drag;
		try {
			cv.setPointerCapture(e.pointerId);
		} catch {
			// Pointer capture isn't available for every pointer type.
		}
	});
	cv.addEventListener("pointermove", (e) => {
		if (!dragging) return;
		drag = dragStart - (e.clientX - dragX) * 0.45 * D;
		if (reduceMotion) draw();
	});
	const endDrag = () => {
		dragging = false;
	};
	cv.addEventListener("pointerup", endDrag);
	cv.addEventListener("pointercancel", endDrag);

	// Animation loop: paused while off screen or in a background tab
	let raf = 0;
	let onScreen = true;
	let lastNow = performance.now();
	let alive = true;
	function frame(now: number) {
		raf = 0;
		const dt = Math.min(0.1, (now - lastNow) / 1000);
		lastNow = now;
		t = missionTime();
		if (!dragging) drag *= Math.exp(-dt * 0.5);
		updateTrail(t);
		draw();
		if (onScreen && !document.hidden) raf = requestAnimationFrame(frame);
	}
	function start() {
		if (alive && !raf && !reduceMotion) {
			lastNow = performance.now();
			raf = requestAnimationFrame(frame);
		}
	}
	const io =
		"IntersectionObserver" in window
			? new IntersectionObserver((entries) => {
					onScreen = entries[0].isIntersecting;
					if (onScreen) start();
				})
			: null;
	io?.observe(cv);
	const onVisibility = () => {
		if (!document.hidden) start();
	};
	document.addEventListener("visibilitychange", onVisibility);

	const onTheme = () => {
		C = readColors(root);
		draw();
	};
	document.addEventListener("themechange", onTheme);

	let timer = 0;
	updateTrail(t);
	if (!reduceMotion) {
		start();
		timer = window.setInterval(() => {
			t = missionTime();
			readouts();
		}, 250);
	}
	readouts();
	draw();
	document.fonts?.ready.then(() => {
		if (!alive) return;
		readFont();
		draw();
	});

	return () => {
		alive = false;
		if (raf) cancelAnimationFrame(raf);
		clearInterval(timer);
		ro?.disconnect();
		if (!ro) window.removeEventListener("resize", resize);
		io?.disconnect();
		document.removeEventListener("visibilitychange", onVisibility);
		document.removeEventListener("themechange", onTheme);
	};
}
