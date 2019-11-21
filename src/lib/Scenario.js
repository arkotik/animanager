class Scenario {
	constructor(frames, { infinity = false } = {}) {
		this._frames = frames;
		this.playstate = false;
		this._delayTimeout = null;
		this._stepTimeout = null;
		this._step = 0;
		this._infinity = infinity;
		this.onstart = null;
		this.onstop = null;
		this.onend = null;
	}

	async _walkThrough() {
		const frames = this._frames.slice(this._step);
		for (const frame of frames) {
			if (this.playstate) {
				await this._runFrame(frame);
				this._step++;
			}
		}
		this._step = 0;
		typeof this.onend === 'function' && this.onend(this);
		return true;
	}

	_runFrame({ callback, duration, delay }) {
		return new Promise(resolve => {
			this._delayTimeout = setTimeout(() => {
				callback();
				this._stepTimeout = setTimeout(resolve, duration);
			}, delay);
		});
	}

	restart() {
		this._step = 0;
		this.start();
	}

	async _forever() {
		while (this.playstate) {
			await this._walkThrough();
		}
	}

	start(step) {
		step !== undefined && (this._step = step);
		this.playstate = true;
		typeof this.onstart === 'function' && this.onstart(this);
		if (this._infinity) {
			this._forever().then(() => (this.playstate = false));
		} else {
			this._walkThrough().then(() => (this.playstate = false));
		}
	}

	stop() {
		this.playstate = false;
		if (this._delayTimeout) {
			clearTimeout(this._delayTimeout);
			this._delayTimeout = null;
		}
		if (this._stepTimeout) {
			clearTimeout(this._stepTimeout);
			this._stepTimeout = null;
		}
		typeof this.onstop === 'function' && this.onstop(this);
	}
}

export default Scenario;
