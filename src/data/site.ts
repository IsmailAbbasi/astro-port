/**
 * Hand-edited home page content: everything the CMS has no fields for.
 *
 * Edit this file and push to change it. Everything else comes from the
 * EmDash admin: name, role, bio, email, CV and social links (Profile),
 * posts, projects and the tech stack.
 */

export interface Stat {
	label: string;
	value: string;
	note: string;
}

export interface Experience {
	dates: string;
	/** "active" shows a green "Active" chip; the others show the label as written. */
	status: "active" | "complete" | "graduated";
	org: string;
	role: string;
	/** Bullet points. Trusted HTML, so <abbr title="…">ADCS</abbr> works. */
	points?: string[];
	stack?: string;
}

export interface ProjectExtras {
	/** Shown after the payload number, e.g. "PL-01 · Developer tooling". */
	category?: string;
	points?: string[];
	specs?: [label: string, value: string][];
	/** Live sample panel shown next to the project. */
	demo?: "intercept" | "examinate" | "cricstack";
}

export interface StackLayer {
	/** Row heading shown instead of the CMS category name. */
	layer: string;
	use: string;
}

export interface Channel {
	label: string;
	href: string;
}

export const site = {
	/** Short call sign shown in the top bar, the footer ring and on the globe. */
	callsign: "IA-01",
	/** Short role for the footer ring, e.g. "Full-stack". */
	shortRole: "Full-stack",
	city: "New Delhi",
	utcLabel: "UTC+05:30",
	/** Top bar clock. */
	timezone: { label: "IST", offsetMinutes: 330 },

	/** "Now" line under the hero intro. Leave empty to hide it. */
	now: "Software Engineer at Tilli Software, building a payments platform across web, desktop and mobile.",

	/** The four tiles under the hero. */
	stats: [
		{ label: "Current role", value: "Tilli Software", note: "Software Engineer I, payments" },
		{ label: "Previously", value: "Flywheel Aerospace", note: "Nanosatellite and robotics software" },
		{ label: "Products shipped", value: "3 live", note: "Designed, built and run end to end" },
		{ label: "Users served", value: "500+", note: "Learners on ExaminateAI" },
	] satisfies Stat[],

	work: {
		eyebrow: "Mission log",
		title: "Work",
		lede: "Payments today. Satellites before that. Newest first.",
	},

	experience: [
		{
			dates: "Apr 2026 → Now",
			status: "active",
			org: "Tilli Software",
			role: "Software Engineer I · Payments platform",
			points: [
				"Ship features for a payments platform across web, desktop and mobile apps, using Node.js, React and React Native.",
				"Build and integrate the REST APIs and backend services behind payment workflows, secure authentication and complex database operations.",
				"Keep releases reliable through testing, debugging, code review and deployment work across the full stack.",
			],
			stack: "Node.js · React · React Native · REST",
		},
		{
			dates: "Nov 2025 → Apr 2026",
			status: "complete",
			org: "Flywheel Aerospace",
			role: "Software Development Intern · Robotics and nanosatellites",
			points: [
				"Built GUI tools for robotics and nanosatellite systems: control panels, dashboards and simulation tools.",
				'Built real-time monitoring and data visualization for spacecraft subsystems, including <abbr title="Attitude Determination and Control System: keeps the satellite pointed the right way">ADCS</abbr>, the <abbr title="On-Board Computer: the satellite\'s main flight computer">OBC</abbr> and ground-support systems.',
				"Worked with hardware and systems engineers to deliver reliable software interfaces, with clear documentation and version control.",
			],
			stack: "Python · Desktop GUIs · Real-time telemetry · Data visualization",
		},
		{
			dates: "2021 → 2025",
			status: "graduated",
			org: "Jamia Hamdard, New Delhi",
			role: "B.Tech, Computer Science and Engineering",
		},
	] satisfies Experience[],

	projects: {
		eyebrow: "Payloads",
		title: "Things I've shipped",
		lede: "Three products I designed, built and run myself. All three are live, and each panel below runs a small working sample of what it does.",
		/**
		 * Extra details for CMS projects, matched by the project's slug or
		 * title with spaces, dashes and case ignored ("Intercept API",
		 * "intercept-api" and "interceptapi" all match "interceptapi").
		 */
		extras: {
			interceptapi: {
				category: "Developer tooling",
				points: [
					"A Manifest V3 Chrome extension that intercepts, inspects, mocks and replays localhost HTTP traffic as it happens.",
					"A WebSocket reverse-proxy tunnel that exposes a local server for webhook testing, with no ngrok and no port forwarding.",
					"Node.js, PostgreSQL and Redis packaged with Docker Compose, so the whole system runs locally.",
				],
				specs: [
					["Status", "Live"],
					["Ships as", "Chrome extension"],
					["Transport", "WebSocket tunnel"],
					["Runs on", "Docker Compose"],
				],
				demo: "intercept",
			},
			examinateai: {
				category: "Learning and AI",
				points: [
					"Turns uploaded PDFs, text files or a chosen topic into custom quizzes, with difficulty levels learners pick themselves.",
					"Reworked the Django and PostgreSQL backend to make quiz generation 20% faster and scale more smoothly.",
					"Secure accounts, so every learner keeps a personal history. Used by more than 500 people.",
				],
				specs: [
					["Status", "Live"],
					["Users", "500+"],
					["Generation", "20% faster"],
					["Inputs", "PDF, text, topic"],
				],
				demo: "examinate",
			},
			cricstack: {
				category: "Sport, real time",
				points: [
					"Ball-by-ball live scoring with player statistics, on the web and as an Android app.",
					"Django and PostgreSQL model matches, teams, players and every historical scorecard.",
					"Matches are archived in the cloud and each scorecard has a shareable link, so players can follow their own form.",
				],
				specs: [
					["Status", "Live"],
					["Platforms", "Web, Android"],
					["Updates", "Ball by ball"],
					["Hosting", "DigitalOcean"],
				],
				demo: "cricstack",
			},
		} as Record<string, ProjectExtras>,
	},

	writing: {
		eyebrow: "Transmissions",
		title: "Writing",
		lede: "Notes from building software for things that happen live.",
	},

	stack: {
		eyebrow: "Subsystems",
		title: "What I build with",
		lede: "Grouped by the layer of a product each tool serves, rather than listed as keywords.",
		/** How each CMS Tech Stack category is labelled and described. */
		layers: {
			Frontend: { layer: "Interfaces", use: "Web, desktop and mobile apps, dashboards and control panels" },
			Backend: { layer: "Services", use: "REST APIs, authentication and real-time connections" },
			Database: { layer: "Data", use: "Relational models, caching and hosted databases" },
			DevOps: { layer: "Delivery", use: "Containers, deployment and browser testing" },
			Tools: { layer: "Tools", use: "The everyday kit around the code" },
		} as Record<string, StackLayer>,
		/** Rows that aren't a CMS category (the category list is fixed), added after the CMS rows. */
		extraRows: [
			{ layer: "AI", use: "LLM features inside real products", tools: ["LLM integration", "AI agents", "Prompt design"] },
		],
	},

	contact: {
		eyebrow: "Uplink",
		title: ["Open a", "channel"],
		sub: "For engineering roles, collaborations, or a real-time problem that needs solving.",
		/** Shown after the social links from the Profile. */
		extraChannels: [{ label: "Intercept API", href: "https://interceptapi.in" }] satisfies Channel[],
	},

	footerNote: "Globe, orbit and demos are drawn live with canvas and plain JavaScript. No libraries.",
};

/** Key used to match CMS projects to `site.projects.extras`. */
export function projectKey(value: string | null | undefined): string {
	return (value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function getProjectExtras(slug: string, title?: string): ProjectExtras | undefined {
	const extras = site.projects.extras;
	return extras[projectKey(slug)] ?? extras[projectKey(title)];
}
