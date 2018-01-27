/**
 * Created by Ying <me@YingDev.com> on 2017/12/7.
 **/
import {clamp} from "./math";

export function percentify(v:number, fixed=2) { return `${(100*v).toFixed(fixed)} %` }

export function maskStr(str:string, from, len, mask='*', minMaskLen=1, maxMaskLen=str.length) : string
{
	if(from >= str.length)
		throw new Error("from >= str.length");

	if(str.length === 0)
		return str;
	if(str.length === 1)
		return mask;

	if(len <= 0)
		len = str.length + len - from;

	let asterisks = new Array(clamp(len, minMaskLen, maxMaskLen)+1).join(mask);
	str = str.substr(0,from) + asterisks + str.substr(from+len);

	return str;
}