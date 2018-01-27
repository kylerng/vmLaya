var fs = require('fs');

var file = "src/uiGen/layaUI.max.all.ts";
var recComps = "src/uiGen/regComps.ts";
var lastExtractRegComps = null;

var isOnce = process.argv[2] === 'once';
console.log("LayaUiGenPatcher: running");

const timer = setInterval(function()
{
	try
	{
		var contents = fs.readFileSync(file, "utf-8");
		var changed = false;
		if(contents.indexOf('export module') < 0)
		{
			contents = contents.replace(/module/g, 'export module');
			changed = true;
		}

		//extract View.regComponent
		var set = new Set();
			contents.split('\n').map(function(l){return l.trim()})
			.filter(function(line)
			{
				return line.startsWith('View.regComponent') || line.startsWith("import ")
			})
			.forEach(function(l){ set.add(l) });
		var result = Array.from(set).join('\n');
		if(lastExtractRegComps !== result)
		{
			changed = true;
			lastExtractRegComps = result;
		}

		if(contents.indexOf("   loadUI(") >= 0)
		{
			console.log("LayaUiGenPatcher: found loadUI, Adding 'this'...");
			contents = contents.replace(/   loadUI\(/g, "   this.loadUI(");
			changed = true;

		}
		if(changed)
		{
			console.log('LayaUiGenPatcher: changed');
			fs.writeFileSync(file, contents, {encoding:"utf-8"});
			fs.writeFileSync(recComps, result);
		}

	}catch (e)
	{
		console.log(e);
	}


}, 3000);

if(isOnce)
{
	clearTimeout(timer);
	console.log("LayaUiGenPatcher: exit");
}
