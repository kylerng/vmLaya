/**
 * Created by Ying <me@YingDev.com> on 2017/12/16.
 **/
import {onChange} from "./decorators";

/**
 * 支持脏标记
 * 这个是一个标志接口，表明实现者使用脏标记来更新最终状态，主要目的是辅助支持 @dirty 装饰器
 * 实现者应当在 setDirty() 中设置脏标记，比如使用 Laya.timer.callLater(draw) 延迟执行重绘。
 * 应避免在 setDirty() 中执行复杂任务。
 */
export interface IMarkDirty
{
	setDirty();
}

/**
 * decorator，装饰一个字段，当它被被修改时，会执行 IMarkDirty::setDirty()
 * 比如一个由多种参数控制的 view，由于每一种参数变化都会使得它需要重绘/重布局，我们可能需要烦琐地为每一个属性添加 setter 然后在里面设置 dirty=true，使用 @dirty 可以自动完成这一工作。
 * */
export function dirty():any
{
	return onChange((m : IMarkDirty)=>m.setDirty());
}

//todo:move
export function lazy(create: (m)=>any) : any
{
	return (target, prop, descriptor)=>{
		const descName = "_@lazy_"+prop;

		if(descriptor)
			throw new Error("only applies to raw property");
		return {
			_name:descName,
			get(){
				let val = this[descName];
				if(val === undefined)
					val = create(this);
				return this[descName] = val;
			},
			set(value){
				this[descName] = value;
			},
			configurable: true,
			enumerable: true
		}
	}
}