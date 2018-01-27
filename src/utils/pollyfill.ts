/**
 * Created by Ying <me@YingDev.com> on 2017/12/1.
 **/


function assign(target)
{
	'use strict';
	if (target === undefined || target === null) {
		throw new TypeError('Cannot convert first argument to object');
	}

	var to = Object(target);
	for (var i = 1; i < arguments.length; i++) {
		var nextSource = arguments[i];
		if (nextSource === undefined || nextSource === null) {
			continue;
		}
		nextSource = Object(nextSource);

		var keysArray = Object.keys(Object(nextSource));
		for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++) {
			var nextKey = keysArray[nextIndex];
			var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
			if (desc !== undefined && desc.enumerable) {
				to[nextKey] = nextSource[nextKey];
			}
		}
	}
	return to;
}

declare interface ObjectConstructor {
	assign<T>(target:T, ...objects: Object[]): T;
}

Object.assign = Object.assign || assign;