import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

function mountDebugOverlay() {
	try {
		const params = new URLSearchParams(location.search);
		if (!params.has('debug')) return;
		const overlay = document.createElement('div');
		overlay.id = '__debug_overlay';
		Object.assign(overlay.style, {
			position: 'fixed', right: '12px', bottom: '12px', zIndex: '999999',
			background: 'rgba(0,0,0,0.7)', color: 'white', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', fontFamily: 'monospace'
		});
		overlay.innerText = 'DEBUG: initializing...';
		document.body.appendChild(overlay);

		async function poll() {
			try {
				const articles = document.querySelectorAll('article').length;
				let apiStatus = 'n/a';
				try {
					const r = await fetch('/api/courses', { cache: 'no-store' });
					apiStatus = String(r.status);
				} catch (e) { apiStatus = 'err'; }
				overlay.innerText = `DEBUG | articles=${articles} | api=${apiStatus} | time=${new Date().toLocaleTimeString()}`;
			} catch (err) {
				overlay.innerText = `DEBUG ERROR: ${String(err)}`;
			}
		}
		poll();
		const id = setInterval(poll, 1000);
		// keep interval running even across HMR reloads
		(window as any).__debugOverlayInterval = id;
	} catch (e) {
		// ignore
	}
}

mountDebugOverlay();

createRoot(document.getElementById("root")!).render(<App />);
