/**
 * Created by Ying <me@YingDev.com> on 2018/1/4.
 **/

import {lazy} from "../IMarkDirty";
import {ref, unref} from "../RcObject";
import {RcViewModel} from "./index";
import {rxSubj, $} from "../../rx-ex/index";
import {SmallArrayPool} from "../utils/SmallArrayPool";

//todo: parent
/**
 * 数据源驱动的VM
 * 可看作是一棵树，所有节点拥有相同的数据源
 * 可以动态添加/删除/获取组件，组件本身也是节点
 * Rc 的时候 dataSource 自动置为 null
 */
export abstract class DataSourceDrivenViewModel<DS> extends RcViewModel
{
	protected _comps:Map<any, DataSourceDrivenViewModel<DS>> = null;//new Map<any, DataSourceDrivenViewModel<DS>>();
	private _dataSource: DS = null;
	private _sigReset$ = rxSubj();

	get comps(): ReadonlyMap<any, DataSourceDrivenViewModel<DS>> { return this._comps || (this._comps = new Map<any, DataSourceDrivenViewModel<DS>>())  }

	//todo:
	//@lazy(_ => rxSubj()) compChange$: $<{ type: "add" | "rm" | "reset", compClass }>;

	protected onRcClear()
	{
		this.dataSource = null;

		if(!this._comps)
			return;
		let arr = SmallArrayPool.get(this._comps.keys());
		for(let i=0; i<arr.length; i++)
			this.rmComp(arr[i]);
		SmallArrayPool.ret(arr);
	}

	get dataSource() { return this._dataSource }

	set dataSource(ds: DS)
	{
		if (ds == this._dataSource)
			return;
		this._dataSource = ds;
		this._sigReset$.next();
		this.onSetDataSource(ds, this._sigReset$.first());
		if(!this._comps)
			return;
		let arr = SmallArrayPool.get(this._comps.keys());
		for(let i=0; i<arr.length; i++)
			arr[i].dataSource = ds;
		SmallArrayPool.ret(arr);
	}

	protected onSetDataSource(ds: DS, sig: $<any>){}

	getComp<T extends DataSourceDrivenViewModel<DS>>(compClass: (Function & { prototype: T }) | (new() => T)): T
	{
		if(!this._comps)
			return null;

		let comp = <T>this.comps.get(compClass) || null;
		if (!comp)
		{
			for (let compInst of this.comps.values())
			{
				//返回子类实例？
				if (compInst instanceof compClass)
				{
					comp = <T>compInst;
					break;
				}
			}
		}
		return comp;
	}

	addComp<T extends DataSourceDrivenViewModel<DS>>(compClass: new() => T): T
	{
		if (this.getComp(compClass))
			return;
		else
		{
			let comp = ref(new compClass());
			(<Map<any,any>>this.comps).set(compClass, comp);
			comp.dataSource = this.dataSource;
		}
	}

	rmComp<T extends DataSourceDrivenViewModel<DS>>(compClass: new() => T)
	{
		let comp = this.getComp(compClass);
		if (comp)
		{
			this._comps.delete(compClass);
			comp.dataSource = null;
			unref(comp);
		}
	}
}