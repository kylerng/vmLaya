/**
 * Created by Ying <me@YingDev.com> on 14/03/2017.
 **/

export function enumerateDescendants(node: Laya.Node, fn: (n:Laya.Node)=>any)
{
	for(let i=0; i<node.numChildren; i++)
	{
		let c = node.getChildAt(i);
		let skip = fn(c);
		if(skip)
			continue;
		enumerateDescendants(c, fn);
	}
}
