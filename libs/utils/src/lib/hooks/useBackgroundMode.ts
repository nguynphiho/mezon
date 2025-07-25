import { useEffect } from 'react';
import { AnyToVoidFunction } from '../types';
import { createCallbackManager } from '../utils';
import useLastCallback from './useLastCallback';

const blurCallbacks = createCallbackManager();
const focusCallbacks = createCallbackManager();

let isFocused = document.hasFocus();

window.addEventListener('blur', () => {
	if (!isFocused) {
		return;
	}

	isFocused = false;
	blurCallbacks.runCallbacks();
});

window.addEventListener('focus', () => {
	isFocused = true;
	focusCallbacks.runCallbacks();
});

export function useBackgroundMode(onBlur?: AnyToVoidFunction, onFocus?: AnyToVoidFunction, isDisabled = false) {
	const lastOnBlur = useLastCallback(onBlur);
	const lastOnFocus = useLastCallback(onFocus);

	useEffect(() => {
		if (isDisabled) {
			return undefined;
		}

		if (!isFocused) {
			lastOnBlur();
		}

		blurCallbacks.addCallback(lastOnBlur);
		focusCallbacks.addCallback(lastOnFocus);

		return () => {
			focusCallbacks.removeCallback(lastOnFocus);
			blurCallbacks.removeCallback(lastOnBlur);
		};
	}, [isDisabled, lastOnBlur, lastOnFocus]);
}

export function isBackgroundModeActive() {
	return !isFocused;
}
