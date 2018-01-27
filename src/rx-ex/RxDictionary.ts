/**
 * Created by Ying <me@YingDev.com> on 13/11/2017.
 **/
import "tslib";
import {Subject} from "rxjs/Subject";

export type Kvp<K,V> = {key:K, value:V};

export class RxDictionary<K, V> extends Subject<K>
{
	protected _dict = new Map<K,V>();

	emmitReset(){ this.next(null) }
	emmitChange(k){ this.next(k)  }

	setValue(key: K, value: V,emmit=true): void
	{
		if(value === this._dict.get(key))
			return;

		this._dict.set(key, value);
		emmit && this.next(key);
	}

	getValue(key: K): V { return this._dict.get(key) }

	remove(key: K, emmit=true): V
	{
		let value = this._dict.get(key);
		this._dict.delete(key);
		emmit && this.next(key);
		return value;
	}

	keys() : IterableIterator<K> { return this._dict.keys() }

	getKeysArray() : K[] { return Array.from(this._dict.keys());}

	values():  IterableIterator<V> { return this._dict.values() }

	getValuesArray() : V[]{ return Array.from(this._dict.values() ) }

	dictForEach(callback: (value: V, key: K) => any): void { this._dict.forEach(callback) }

	containsKey(key: K): boolean { return this._dict.has(key) }

	clear(emmit=true): void
	{
		let size = this._dict.size;
		this._dict.clear();
		emmit && size && this.next(null);
	}

	size(): number { return this._dict.size }

	isDictEmpty(): boolean { return this._dict.size === 0}

	toString(): string { return this._dict.toString() }

	toMap(): Map<K, V>
	{
		let dict = new Map<K, V>();
		this._dict.forEach((v,k) => dict.set(k, v));
		return dict;
	}

}