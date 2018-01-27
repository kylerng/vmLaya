/**
 * Created by Ying <me@YingDev.com> on 2018/1/27.
 **/

import {$} from "../../rx-ex";

/**
 * 小数组池，通常只是临时使用，用完即归还
 * let arr = SmallArrayPool.get(this._comps.keys());
 * for(let i=0; i<arr.length; i++)
 * 		arr[i].dataSource = ds;
 * SmallArrayPool.ret(arr);
 */
export class SmallArrayPool
{
	static pool = $.range(0,8).map(_=>[null,null,null,null]).collect();

	static get(fill?: Array<any>|Iterable<any>)
	{
		let arr = this.pool.pop();
		arr.length = 0;
		if(fill)
		{
			if(fill instanceof Array)
			{
				for(let i=0; i<fill.length; i++)
					arr.push(fill[i]);
			}
			else
			{
				for(let v of fill)
					arr.push(v);
			}
		}
		return arr;
	}

	static ret(arr)
	{
		arr.length = 0;
		this.pool.push(arr);
	}

	static clear()
	{
		this.pool.length = 0;
	}
}