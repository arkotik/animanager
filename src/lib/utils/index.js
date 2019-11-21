export function exportToFile(data, filename, type) {
	filename = `${filename}.${type}`;
	if (typeof data !== 'string') {
		data = JSON.stringify(data, null, '\t');
	}
	const file = new Blob([data], { type });
	if (window.navigator.msSaveOrOpenBlob) // IE10+
		window.navigator.msSaveOrOpenBlob(file, filename);
	else { // Others
		const a = document.createElement('a'),
			url = URL.createObjectURL(file);
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		setTimeout(function () {
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);
		}, 0);
	}
}

export function loadFrames(frames, target = '#control-form') {
	if (typeof target === 'string') {
		target = document.querySelector(target);
	}
	frames.forEach((frame, i) => {
		target.appendChild(renderFrameControls(frame, i + 1));
	});
}

export function renderFrameControls(frame, key) {
	const { title, enabled, delay, duration, mode } = frame;
	const root = create('div', { className: 'frame-block' });
	root.appendChild(create('div', { className: 'frame-title', innerText: title }));
	const line = create('div', { className: 'form-line' });
	line.appendChild(create('div', { innerText: key }));
	line.appendChild(create('label', null, [create('input', {
		id: `step-${key}-enabled`,
		name: `${key}--enabled`,
		type: 'checkbox',
		checked: enabled
	})]));
	line.appendChild(create('label', null, [create('input', {
		id: `step-${key}-delay`,
		name: `${key}--delay`,
		type: 'number',
		value: delay
	})]));
	line.appendChild(create('label', null, [create('input', {
		id: `step-${key}-duration`,
		name: `${key}--duration`,
		type: 'number',
		value: duration
	})]));
	const select = create('select', {
		id: `step-${key}-mode`,
		name: `${key}--mode`
	});
	for (const value of Animator.MODES) {
		select.appendChild(create('option', { value, innerText: value, ...(value === mode && { selected: true }) }));
	}
	line.appendChild(create('label', null, [select]));
	root.appendChild(line);
	return root;
}

export function setStyles(options, innerHTML, key) {
	const { id, baseClassName } = options;
	const elId = `${id}-${baseClassName}-style-${key}`;
	let styles = document.getElementById(elId);
	if (!styles) {
		styles = create('style', { id: elId });
		document.head.appendChild(styles);
	}
	styles.innerHTML = innerHTML;
}

export function getValue(value, name) {
	switch (name) {
		case 'enabled':
			return value === 'on';
		case 'mode':
			return value;
		default:
			return parseInt(value);
	}
}

export function errorHandler(e) {
	switch (e.target.error.code) {
		case e.target.error.NOT_FOUND_ERR:
			alert('File Not Found!');
			break;
		case e.target.error.NOT_READABLE_ERR:
			alert('File is not readable');
			break;
		case e.target.error.ABORT_ERR:
			break; // noop
		default:
			alert('An error occurred reading this file.');
	}
}

export function create(type, attributes, children) {
	const el = document.createElement(type);
	for (const key in attributes || {}) {
		if (attributes.hasOwnProperty(key)) {
			el[key] = attributes[key];
		}
	}
	for (const child of children || []) {
		el.appendChild(child);
	}
	return el;
}

export function getFrameStyles({ childNodesIds, duration, mode }, params, key) {
	const { id, baseClassName, ignoreKey } = params || {};
	const transitionsList = params.transitions || ['transform', 'border-color', 'background-color', 'opacity'];
	const subSelectors = params.subSelectors || ['', ':after', ':before'];
	const selectors = [];
	for (const idName of childNodesIds) {
		const postfix = idName ? ` #${idName}` : '';
		const keySuf = ignoreKey ? '' : `-${key}`;
		const selector = `${'#' + id} .${baseClassName}${keySuf}${postfix}`;
		selectors.push(subSelectors.map(el => selector + el).join(','));
	}
	const transitions = transitionsList.map(el => `${el} ${duration}ms`).join(', ') + ' !important';
	return selectors.join(',') + `{ transition: ${transitions}; transition-timing-function: ${mode} !important;}`;
}

export function applySlidesClasses(targetsList = [], visibleClasses = []) {
	targetsList.slice(0, visibleClasses.length).forEach((slide, i) => {
		slide.classList.remove(...visibleClasses);
		slide.classList.add(visibleClasses[i]);
	});
}

export function getCallback(target, { className, toDelete }, { type, visibleClasses, slidesSelector }) {
	if (type === 'carousel') {
		const targetsList = [...(document.querySelectorAll(slidesSelector) || [])];
		return () => {
			const first = targetsList.shift();
			first.classList.remove(...visibleClasses);
			targetsList.push(first);
			applySlidesClasses(targetsList, visibleClasses);
		};
	}
	return () => {
		if (className) {
			target.classList.add(className);
		}
		if (toDelete) {
			toDelete = Array.isArray(toDelete) ? toDelete : [toDelete];
			for (const toDel of toDelete) {
				target.classList.remove(toDel);
			}
		}
	};
}

export function getNode(target) {
	if (typeof target === 'string') {
		target = document.querySelector(target);
	}
	if (target instanceof Node) {
		return target;
	} else {
		throw new	Error('Target must be a DOM Node or a selector string');
	}
}
