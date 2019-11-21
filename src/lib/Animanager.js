import Scenario from './Scenario';
import IntersectionObserver from 'intersection-observer-polyfill';
import { applySlidesClasses, getCallback, getFrameStyles, getNode, setStyles } from './utils';

class Animanager {
	constructor({ animation, target, infinity, precision, observerOptions, autoplay }) {
		const { frames, ...options } = animation;
		this._target = getNode(target || `#${options.id}`);
		this._frames = frames;
		this._options = options;
		this._options.container = options.container || `#${options.id} .view`;
		this._container = getNode(this._options.container);
		this._classesBackup = this._container.classList.value;
		this._precision = precision || 1;
		this._infinity = infinity || false;
		this._autoplay = autoplay || true;
		this._observerOptions = observerOptions || {};
		this._scenario = null;
		this._inited = this.init();
	}

	_observe = () => {
		this._observer = new IntersectionObserver((entries) => {
			for (const { intersectionRatio } of entries) {
				const scenario = this._scenario;
				if (scenario) {
					const state = this._scenario.playstate;
					if (!state && intersectionRatio >= this._precision) {
						this.play(0);
					} else if (state && intersectionRatio < 0.1) {
						this.stop();
					}
				}
			}
		}, { threshold: 1.0, rootMargin: '20px', ...this._observerOptions });
		this._observer.observe(this._target);
	};

	_clear = () => {
		this._container.classList.value = this._classesBackup;
	};

	init = () => {
		try {
			const frames = this._frames.reduce((acc, frame, i) => {
				const key = i + 1;
				const frameStyles = getFrameStyles(frame, this._options, key);
				setStyles(this._options, frameStyles, key);
				const { delay, duration, enabled } = frame;
				if (enabled) {
					return [...acc, { duration, delay, callback: getCallback(this._container, frame, this._options) }];
				}
				return acc;
			}, []);
			if (this._options.type === Animanager.TYPE_CAROUSEL) {
				const { slidesSelector, visibleClasses } = this._options;
				const slides = [...(document.querySelectorAll(slidesSelector) || [])];
				applySlidesClasses(slides, visibleClasses);
			}
			this._scenario = new Scenario(frames, { infinity: this._infinity });
			!this._infinity && (this._scenario.onend = this._clear);
			this._autoplay && this._observe();
			return true;
		} catch (e) {
			console.error(e);
			return false;
		}
	};

	static TYPE_CAROUSEL = 'carousel';
	static TYPE_DEFAULT = 'default';
}

Animanager.prototype.play = function () {
	if (!this._inited) {
		try {
			this.init();
		} catch (e) {
			console.error(e);
			return;
		}
	}
	this._scenario.start(0);
};

Animanager.prototype.stop = function () {
	if (this._inited) {
		this._scenario.stop();
		this._clear();
	}
};

export default Animanager;
