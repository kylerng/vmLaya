/**
 * Created by Ying <me@YingDev.com> on 2017/12/10.
 **/

import {ViewInfo, IViewFactory,} from "./interfaces";
import {VmViewBase} from "./VmViewBase";

export type VmClass = new(...args)=>any;
export type ViewClass = new()=>VmViewBase<any>;

/**
 * view工厂感知
 * 如果一个 View 实现此接口，则在它被工厂创建/回收的时候可以得到通知
 */
export interface IViewFactoryAware
{
	awakeFromFactory?(vmClass: VmClass, id:string);
	willReturnToFactory?(vmClass: VmClass, id:string);
}

function dbg(){ return ViewFactory.debug }
function log(msg){ console.log('ViewFactory: ' + msg) }
/**
 * 基于 ViewModel 的类型和 提供的id 来查找 view 的 工厂。这是框架提供的默认工厂。
 * 通常使用 装饰器 @viewFor 来注册映射记录
 * （ViewModel class + id） => view
 */
export class ViewFactory implements IViewFactory
{
	static debug = false;

	private static _inst = new ViewFactory();
	static get instance() { return ViewFactory._inst }

	protected _vmToV = new Map<VmClass, Map<string, Record>>();

	private constructor() {}

	/**
	 * 注册
	 * @param {VmClass} vmClass
	 * @param {ViewClass} viewClass
	 * @param {string} id
	 * @param {number} poolSize pool大小。默认值0，表示不bpool，每次都new/destroy。-1表示无限制pool所有新实例。正数表示pool固定数量。
	 */
	register(vmClass:VmClass, viewClass:ViewClass, id='default', poolSize=0)
	{
		dbg() && log('register: v=' + viewClass.name + '; vm=' + vmClass.name + '; id=' + id + '; poolSize='+poolSize);
		let reg = this._vmToV.get(vmClass) || (new Map());
		if(reg.get(id))
			throw new Error("duplication registration of viewClass " + viewClass.name + " with id " + id);

		reg.set(id, new Record(id, viewClass, vmClass, poolSize));
		this._vmToV.set(vmClass, reg);
	}

	unregister(vmClass:VmClass, viewClass:ViewClass, id: (string|null) ='default')
	{
		dbg() && log('unregister: v=' + viewClass.name + '; vm=' + vmClass.name + '; id= ' + id);
		let items = this._vmToV.get(vmClass);
		if(items)
		{
			let item = items.get(id);
			item && item.clearPool();
			if(id !== null)
				items.delete(id);
		}
		if(id === null)
			this._vmToV.delete(viewClass);
	}

	protected getRecord(vmClass:VmClass, id:string, noThrow=false) : Record
	{
		let items = this._vmToV.get(vmClass);
		if(!items && !noThrow)
			throw new Error("no viewClass registered for vmClass: " + vmClass.prototype.constructor.name + ' with id ' + id);
		let rec= items && items.get(id);
		if(!rec && !noThrow)
			throw new Error("no viewClass with id "+id+" registered for vmClass: " + vmClass.prototype.constructor.name);
		return rec;
	}

	/**
	 *
	 * @param {VmClass} vmClass
	 * @param {number} count 要预先实例化的数量。如果undefined，则填充一个实例
	 * @param {string} id
	 */
	fillPool(vmClass:VmClass, count?:number, id='default')
	{
		dbg() && log('fillPool: vm=' + vmClass.name + '; id=' + id + '; count='+count);
		let rec = this.getRecord(vmClass, id);
		rec.fillPool(count);
	}

	resizePool(vmClass:VmClass, newSize:number, id='default')
	{
		let rec = this.getRecord(vmClass, id);
		dbg() && log('resizePool: vm=' + vmClass.name + '; id=' + id + '; '+rec.poolSize + " => " + newSize);
		rec.resizePool(newSize);
	}

	clearPool(vmClass:VmClass, id: (string | null)='default')
	{
		dbg() && log('clearPool: vm=' + vmClass.name +'; id=' + id);
		if(id === null)
		{
			let items = this._vmToV.get(vmClass);
			if(!items)
				throw new Error("no viewClass registered for vmClass: " + vmClass.prototype.constructor.name);
			items.forEach(r=>r.clearPool());
			this._vmToV.delete(vmClass);
		}
		else
		{
			let rec = this.getRecord(vmClass, id);
			rec.clearPool();
		}
	}

	getViewForVm(vm: (any|VmClass), id='default', assignVm=false) : ViewInfo
	{
		let vmClass = typeof vm === 'function' ? vm : Object.getPrototypeOf(vm).constructor;

		dbg() && log('getViewForVm: vm=' + vmClass.name +'; id= ' + id);

		let rec = this.getRecord(vmClass, id);
		let info = rec.getView();
		assignVm && (info.view.vm = vm);
		return info;
	}

	returnView(info:ViewInfo, removeSelf=true, nullVm=false)
	{
		let {id, view, vmClass} = info;

		dbg() && log('returnView: v='+ Object.getPrototypeOf(view).constructor.name + "; vm=" + vmClass.name +'; id=' + id);

		let rec = this.getRecord(vmClass, id);
		nullVm && (view.vm = null);
		removeSelf && view.removeSelf();

		rec.returnView(info);
	}
}

export class Record
{
	id: string;
	vmClass: VmClass;
	viewClass: ViewClass;
	poolSize = 0;
	pool:Array<ViewInfo> = [];

	constructor(id, viewClass: ViewClass, vmClass:VmClass, poolSize)
	{
		this.id = id;
		this.vmClass = vmClass;
		this.viewClass = viewClass;
		this.poolSize = poolSize;
	}

	clearPool()
	{
		this.pool.forEach(v=>v.view.destroy(true));
		this.pool.length = 0;
	}

	resizePool(newSize:number)
	{
		(newSize >= 0) && this.pool.splice(newSize).forEach(v=>v.view.destroy(true));
		this.poolSize = newSize;
	}

	fillPool(count:number)
	{
		count = count || this.poolSize;
		if(count <= 0)
			count = 1;

		dbg() && log('Record.fillPool: count=' + count + '; v=' + this.viewClass.name + '; vm=' + this.vmClass.name +  '; id= ' + this.id);

		while(count-- > 0)
		{
			let item = {id: this.id, view: new this.viewClass, vmClass: this.vmClass};
			this.pool.push(item);
		}
	}

	returnView(info:ViewInfo)
	{
		let {pool, poolSize} = this;
		let {view, id, vmClass} = info;
		if( (<IViewFactoryAware>view).willReturnToFactory )
			(<IViewFactoryAware>view).willReturnToFactory(vmClass, id);

		if(poolSize >= 0 && pool.length >= poolSize)
		{
			dbg() && log('Record.returnView: DESTROY v=' + this.viewClass.name + '; vm=' + this.vmClass.name +  '; id= ' + this.id);

			view.vm = null;
			view.destroy(true);
		}else
		{
			dbg() && log('Record.returnView: POOL v=' + this.viewClass.name + '; vm=' + this.vmClass.name +  '; id= ' + this.id);
			pool.push(info);
		}
	}

	getView() : ViewInfo
	{
		let {pool, viewClass} = this;
		let info;
		if(pool.length > 0)
		{
			dbg() && log('Record.getView: POOL; v=' + this.viewClass.name + '; vm=' + this.vmClass.name +  '; id=' + this.id);
			info = pool.pop();
		}
		else
		{
			dbg() && log('Record.getView: NEW; v=' + this.viewClass.name + '; vm=' + this.vmClass.name +  '; id=' + this.id);
			info = {id: this.id, view: new viewClass(), vmClass: this.vmClass};
		}
		if((info.view as IViewFactoryAware).awakeFromFactory)
			info.view.awakeFromFactory(this.vmClass, this.id);
		return info;
	}
}

export const vfGetView = ViewFactory.instance.getViewForVm;
export const vfRetView = ViewFactory.instance.returnView;

//decorator
export function viewFor(vmClassOrInfo: (new(...args)=>any) | {vmClass, viewClassFac: (target:ViewClass, id)=>ViewClass }, options?:{id?:string, poolSize?:number}) : any
{
	options = Object.assign({id:'default', poolSize:0}, options);

	return (target)=>
	{
		if(! (target.prototype instanceof VmViewBase) )
			throw new Error("target must be a VmBaseView subclass");

		let fac = ViewFactory.instance;
		if(typeof vmClassOrInfo === 'function')
			fac.register(vmClassOrInfo, target, options.id, options.poolSize);
		else
			fac.register(vmClassOrInfo.vmClass, vmClassOrInfo.viewClassFac(target, options.id),options.id, options.poolSize);
	}
}