const { GNUMakeGenerator } = require("./Generators");

const path = require("path");
const fs = require("fs");

function generate(target, generator)
{
	if (target)
	{
		const group = Array.isArray(target)
		if (group)
		{
			let prevProcessDirectory = process.cwd();

			for(const subtarget of target)
			{
				if (!fs.existsSync(subtarget.name))
					fs.mkdirSync( subtarget.name );
				
				process.chdir( subtarget.name );
				generate(subtarget, generator);
				process.chdir(prevProcessDirectory);
			}
		}

		const g = () => fs.writeFileSync("Makefile", generator.generate(target).content || "");

		if (group)
			g();
		else
		{
			const prevWorkingDirectory = generator.workingDirectory;
			generator.workingDirectory = target.__scriptDirectory;

			g();

			generator.workingDirectory = prevWorkingDirectory;
		}
	}
	else
		throw "invalid target";
}

function applyScriptDirectory(target, dir)
{
	if (Array.isArray(target))
	{
		for(const subtarget of target)
		{
			applyScriptDirectory(subtarget, dir);
		}
	}
	else if (typeof target === "object")
	{
		if (!target.__scriptDirectory)
		{
			target.__scriptDirectory = dir;
		}
	}
}

function build(scriptAbsolutePath)
{
	const script = require( scriptAbsolutePath );
	const scriptDir = path.dirname(scriptAbsolutePath);

	// This check is important for JSON projects.
	applyScriptDirectory(script, scriptDir);
	
	const gen = new GNUMakeGenerator();
	gen.workingDirectory = scriptDir;

	generate(script, gen);
}

module.exports = {
	generate,
	build
}