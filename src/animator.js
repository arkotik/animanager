import Animator from './lib/Animator';

if (window && !('Animator' in window)) {
	window.Animator = Animator;
}