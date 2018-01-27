/**
 * Created by Ying <me@YingDev.com> on 27/02/2017.
 **/

import LocalStorage = laya.net.LocalStorage;
import {rxString, rxSubj} from "../../rx-ex";
import {Subject} from "rxjs/Subject";

export class Pref
{
	static change$:Subject<string> = rxSubj<string>();

	static get(key: string, or=null)
	{
		let val = LocalStorage.getJSON(key);
		if(typeof val === 'undefined' || val === null)
			return or;
		return val;
	}

	static set(key: string, value: string | boolean | number | Array<any>)
	{
		if(value !== Pref.get(key))
		{
			LocalStorage.setJSON(key, value);
			if(typeof(value) === "object" )
			{
                //if(value.toString() === Pref.get(key).toString())
				this.change$.next(key);
                return;
			}else
			{
                this.change$.next(key);
			}
		}
	}

	static reset()
	{
	}
}