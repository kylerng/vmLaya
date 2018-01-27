/**
 * Created by Ying <me@YingDev.com> on 02/03/2017.
 **/

import {RxProperty, rxString} from "../../rx-ex";

export class LangDict
{
	private static _instance = new LangDict();
	static get instance(){ return LangDict._instance; }

	lang$:RxProperty<string> = rxString();

	private _dict: any;
	private _langCode: string;

	get langCode() : string{return this._langCode;}

	get(key: string, group:string = null)
	{
		if(group)
			return (this._dict && this._dict[group] && this._dict[group][key]) || group +'.'+key;
		return (this._dict && this._dict[key]) || key;
	}

	load(dict: any, langCode:string)
	{
		this._dict = dict;
		this._langCode = langCode;

		this.lang$.value = langCode;
	}

	clear()
	{
		this._dict = {};
		this._langCode = null;
		this.lang$.next(null);
	}
}

export function tr(key:string, group?:string)
{
	return LangDict.instance.get(key, group);
}