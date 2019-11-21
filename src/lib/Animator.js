import Scenario from './Scenario';
import { setStyles, getFrameStyles, getCallback, exportToFile, errorHandler, loadFrames, getValue, applySlidesClasses } from './utils';

class Animator {
	constructor(
		{
			config,
			frames = [],
			fileInput = '#animator-file-import',
			abortButton = '#animator-import-abort',
			resetButton = '#animator-reset',
			saveButton = '#animator-save',
			playButton = '#animator-play',
			stopButton = '#animator-stop',
			restartButton = '#animator-restart',
			exportButton = '#animator-export'
		}
	) {
		this._scenario = null;
		this._classesBackup = '';
		this._options = { ...Animator.DEFAULT_OPTIONS, ...(config || {}) };
		this._backup = JSON.stringify(frames);
		this._frames = JSON.parse(this._backup);
		this._reader = new FileReader();
		this._form = document.querySelector('#control-form');
		this._fileInput = typeof fileInput === 'string' ? document.querySelector(fileInput) : fileInput;
		this._fileInput.onchange = this.handleFileSelect;

		this._abortButton = typeof fileInput === 'string' ? document.querySelector(abortButton) : abortButton;
		this._abortButton.onclick = () => {
			if (this._reader) {
				this._reader.abort();
			}

		};

		this._resetButton = typeof fileInput === 'string' ? document.querySelector(resetButton) : resetButton;
		this._resetButton.onclick = () => {
			if (!window.confirm('Current settings will be deleted')) {
				return;
			}
			this.reset();
		};

		this._saveButton = typeof fileInput === 'string' ? document.querySelector(saveButton) : saveButton;
		this._saveButton.onclick = () => {
			this.update();
		};

		this._playButton = typeof fileInput === 'string' ? document.querySelector(playButton) : playButton;
		this._playButton.onclick = () => {
			this.play();
		};

		this._stopButton = typeof fileInput === 'string' ? document.querySelector(stopButton) : stopButton;
		this._stopButton.onclick = () => {
			this.stop();
		};

		this._restartButton = typeof fileInput === 'string' ? document.querySelector(restartButton) : restartButton;
		this._restartButton.onclick = () => {
			setTimeout(() => {
				this.stop();
				setTimeout(() => {
					this._clear();
					setTimeout(() => {
						this.play(0);
					});
				});
			});
		};

		this._exportButton = typeof fileInput === 'string' ? document.querySelector(exportButton) : exportButton;
		this._exportButton.onclick = () => {
			exportToFile(this.json, `Animator[${this._options.id}]`, 'json');
		};
	}

	get data() {
		return { ...this._options, frames: this._frames };
	}

	get json() {
		return JSON.stringify(this.data, null, '\t');
	}

	handleFileSelect = () => {
		const currentId = this._options.id;
		const file = this._fileInput.files[0];
		if (!file || !window.confirm('Current settings will be deleted')) {
			return;
		}
		this._reader.onerror = errorHandler;
		this._reader.onabort = function () {
			alert('File read cancelled');
		};
		this._reader.onload = (e) => {
			try {
				const config = JSON.parse(e.target.result);
				const { frames, id } = config;
				if (id === currentId) {
					this.setFrames(frames);
				} else {
					alert('There is not valid config!');
				}
			} catch (e) {
				console.error(e);
			}
		};
		this._reader.readAsText(file);
	};

	init = () => {
		this._form.innerHTML = null;
		loadFrames(this._frames);
		try {
			this.initAnimation();
		} catch (e) {
			console.error(e);
		}
	};

	_clear = () => {
		this._target.classList.value = this._classesBackup;
	};

	initAnimation = () => {
		const { container, id } = this._options;
		this._target = document.querySelector(container || `#${id} .view`);
		if (!this._target) {
			throw new Error('Can`t find animation container');
		}
		if (!this._classesBackup) {
			this._classesBackup = this._target.classList.value;
		}
		const frames = [];
		this._frames.forEach((frame, i) => {
			const key = i + 1;
			const frameStyles = getFrameStyles(frame, this._options, key);
			setStyles(this._options, frameStyles, key);
			const { delay, duration, enabled } = frame;
			if (enabled) {
				frames.push({ duration, delay, callback: getCallback(this._target, frame, this._options) });
			}
		});
		if (this._options.type === Animator.TYPE_CAROUSEL) {
			const { slidesSelector, visibleClasses } = this._options;
			const slides = [...(document.querySelectorAll(slidesSelector) || [])];
			applySlidesClasses(slides, visibleClasses);
		}
		this._scenario = new Scenario(frames, { infinity: true });
		this._scenario.onend = this._clear;
	};

	static TYPE_CAROUSEL = 'carousel';
	static TYPE_DEFAULT = 'default';

	static MODES = ['ease-in', 'ease-out', 'ease-in-out', 'linear'];

	static DEFAULT_OPTIONS = {
		id: '',
		container: '',
		baseClassName: '',
		subSelectors: [],
		transitions: [],
		visibleClasses: [],
		slidesSelector: '',
		type: Animator.TYPE_DEFAULT
	};
}

Animator.prototype.setFrames = function (frames) {
	this._frames = frames;
	this.init();
};

Animator.prototype.setConfig = function (config) {
	this._options = { ...Animator.DEFAULT_OPTIONS, ...(config || {}) };
	this.init();
};

Animator.prototype.reset = function () {
	this._frames = JSON.parse(this._backup);
	this.init();
};

Animator.prototype.update = function () {
	const formData = new FormData(this._form);
	for (const [key, value] of formData.entries()) {
		const [frame, name] = key.split('--');
		const index = frame - 1;
		if (name) {
			this._frames[index][name] = getValue(value, name);
		}
	}
	try {
		const start = this._scenario.playstate;
		this.stop();
		this.initAnimation();
		start && this.play(0);
	} catch (e) {
		console.error(e);
	}
};

Animator.prototype.play = function (step) {
	if (!this._scenario) {
		try {
			this.initAnimation();
		} catch (e) {
			console.error(e);
			return;
		}
	}
	!this._scenario.playstate && this._scenario.start(step);
};

Animator.prototype.stop = function () {
	if (this._scenario) {
		this._scenario.stop();
	}
};

export default Animator;
