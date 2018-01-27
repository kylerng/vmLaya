/**
 * Created by Ying <me@YingDev.com> on 2017/12/4.
 **/

import './pollyfill'
export * from './fmt'
export * from './layout-helper'
export * from "./math"

export function makeOneShotFun(fn)
{
	let done = false;
	return (...args)=>
	{
		if(done) return;
		done = true;
		fn(...args);
	}
}