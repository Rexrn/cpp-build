const { GNUMakeGenerator } = require("./Generators");
const { TargetType } = require("../General/TargetType");

const path = require("path");
const fs = require("fs");

function link(target, toTarget, generator)
{
	if (toTarget)
	{
		if (Array.isArray(toTarget.publicIncludeDirectories))
		{
			target.includeDirectiories = target.includeDirectiories.concat(toTarget.publicIncludeDirectories);
		}

		if (Array.isArray(toTarget.publicLinkerDirectories))
		{
			target.linkerDirectiories = target.linkerDirectiories.concat(toTarget.publicLinkerDirectories);
		}

		if (Array.isArray(toTarget.publicLinkerOptions))
		{
			target.linkerOptions = target.linkerOptions.concat(toTarget.publicLinkerOptions);
		}

		if (toTarget.type === TargetType.StaticLibrary)
		{
			const p = generator.predictOutputPath(toTarget);

			target.link.push(p);
		}
	}
	
}

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

function resolveLinks(targets, generator)
{
	for(const t of targets)
	{
		if (Array.isArray(t.link))
		{
			const prevLinks = t.link;
			t.link = [];
			for(const l of prevLinks)
			{
				const toTarget = targets.find(e => e.name == l);

				if (toTarget)
					link(t, toTarget, generator);
				else
					t.link.push(l); // raw
			}
		}
	}
}

function makeProjectConformant(project)
{
	const ensureArray = a => Array.isArray(a) ? a : [];

	project.includeDirectiories = ensureArray(project.includeDirectiories);
	project.linkerDirectories 	= ensureArray(project.linkerDirectories);
	project.linkerOptions		= ensureArray(project.linkerOptions);
	project.link 				= ensureArray(project.link);
}

function build(scriptAbsolutePath)
{
	const script = require( scriptAbsolutePath );
	const scriptDir = path.dirname(scriptAbsolutePath);

	// This check is important for JSON projects.
	applyScriptDirectory(script, scriptDir);
	
	const gen = new GNUMakeGenerator();
	gen.workingDirectory = scriptDir;

	if (Array.isArray(script))
	{
		for(const p of script)
			makeProjectConformant(p);

		resolveLinks(script, gen);
	}

	generate(script, gen);
}

module.exports = {
	generate,
	build
}