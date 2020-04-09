const { GNUMakeGenerator } = require("./Generators");

const path = require("path");
const fs = require("fs");

function generate(target, generator)
{
	if (target)
	{
		if (Array.isArray(target))
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

		const prevWorkingDirectory = generator.workingDirectory;
		if (typeof target === "object")
		{
			generator.workingDirectory = target.__scriptDirectory;
		}

		const result = generator.generate(target);
		fs.writeFileSync("Makefile", result.content || "");

		if (typeof target === "object")
		{
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
	applyScriptDirectory,
	build
}