import Animanager from './lib/Animanager';

if (window && !('Animanager' in window)) {
	window.Animanager = Animanager;
}