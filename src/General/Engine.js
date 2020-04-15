const { TargetType } = require("./TargetType");

const path = require("path");
const fs = require("fs");

function compareProjects(lhs, rhs)
{
	return lhs.name == rhs.name && lhs.__scriptPath == rhs.__scriptPath;
}

function applyScriptPath(project, scriptPath)
{
	if (Array.isArray(project))
	{
		for(const subtarget of project)
		{
			applyScriptPath(subtarget, scriptPath);
		}
	}
	else if (typeof project === "object")
	{
		if (!project.__scriptPath)
		{
			project.__scriptPath = scriptPath;
		}
	}
}

function makeProjectConformant(project)
{
	const ensureArray = a => Array.isArray(a) ? a : [];
	const ensureAccessesArray = a => {

			a = a || {};

			if (Array.isArray(a))
				a = { private: a };

			a.public 	= ensureArray(a.public);
			a.private 	= ensureArray(a.private);
			a.interface = ensureArray(a.interface);

			return a;
		};

	project.includeDirectories 	= ensureAccessesArray(project.includeDirectories);
	project.linkerDirectories 	= ensureAccessesArray(project.linkerDirectories);
	project.compilerFlags 		= ensureAccessesArray(project.compilerFlags);
	project.definitions 		= ensureAccessesArray(project.definitions);
	project.linkerFlags 		= ensureAccessesArray(project.linkerFlags);
	project.link 				= ensureArray(project.link);
	for(const idx in project.link)
	{
		const l = project.link[idx];
		if (typeof l === "string")
			project.link[idx] = { name: l, src: project.__scriptPath };
		else
		{
			project.link[idx].src = path.resolve(path.dirname(project.__scriptPath), project.link[idx].src);
		}
	}
}

function link(target, toTarget, generator, private = true)
{
	if (toTarget)
	{
		const merge = (dst, src, priv, modify) => {
				const fromSrc = [ ...src.interface, ...src.public ];

				if (modify)
				{
					for(let i in fromSrc) {
						fromSrc[i] = modify(fromSrc[i]);
					}
				}

				if (priv)
					dst.private = [ ...dst.private, ...fromSrc ];
				else
					dst.public = [ ...dst.public, ...fromSrc ];
			};

		const resolvePath = p => path.resolve(path.dirname(toTarget.__scriptPath), p);

		merge(target.includeDirectories, toTarget.includeDirectories, private, resolvePath);
		merge(target.linkerDirectories, toTarget.linkerDirectories, private, resolvePath);
		merge(target.compilerFlags, toTarget.compilerFlags, private);
		merge(target.definitions, toTarget.definitions, private);
		merge(target.linkerFlags, toTarget.linkerFlags, private);

		if (toTarget.type === TargetType.StaticLibrary)
		{
			const p = generator.predictOutputPath(toTarget);

			target.link.push(p);
		}
	}
}


function loadBuildScript(scriptPath)
{
	const script = require(scriptPath);

	applyScriptPath(script, scriptPath);

	if (Array.isArray(script))
	{
		for(const project of script)
			makeProjectConformant(project);
	}
	else
		makeProjectConformant(script);

	return script;
}

class CppBuildEngine
{
	constructor()
	{
		this.projects = [];
	}

	generate(scriptPath, generator)
	{
		const script = loadBuildScript(scriptPath);

		if (Array.isArray(script))
		{
			for(const project of script)
				this.storeProject(project);
		}
		else
		{
			this.storeProject(script);
		}

		this.resolveLinks(generator);
		const buildQueue = this.setupBuildQueue();
		this.generateBuildFiles(this.projects, generator);
	}

	setupBuildQueue()
	{
		const buildQueue = [];

		const pendingProjects = [...this.projects];

		while(pendingProjects.length > 0)
		{
			const nextStep = this.findBuildableProjects(pendingProjects);

			if (nextStep.length == 0)
				throw "cyclic dependency found when setting up build queue";

			for (const project of nextStep)
			{
				const idx = pendingProjects.indexOf(project); // this has to be > -1
				pendingProjects.splice(idx, 1);
			}

			buildQueue.push( nextStep );
		}

		return buildQueue;
	}

	findBuildableProjects(pendingProjects)
	{
		const buildable = [];

		for(const project of pendingProjects)
		{
			let ready = true;
			for(const dep of project.dependsOn)
			{
				if (pendingProjects.indexOf(dep) != -1)
				{
					ready = false;
					break;
				}
			}

			if (ready)
			{
				buildable.push(project);
			}
		}

		return buildable;
	}

	generateBuildFiles(target, generator)
	{
		if (target)
		{
			const group = Array.isArray(target);
			if (group)
			{
				let prevProcessDirectory = process.cwd();

				for(const subtarget of target)
				{
					if (!fs.existsSync(subtarget.name))
						fs.mkdirSync( subtarget.name );
					
					process.chdir( subtarget.name );
					this.generateBuildFiles(subtarget, generator);
					process.chdir(prevProcessDirectory);
				}
			}

			const g = () => fs.writeFileSync("Makefile", generator.generate(target).content || "");

			if (group)
				g();
			else
			{
				const prevWorkingDirectory = generator.workingDirectory;
				generator.workingDirectory = path.dirname(target.__scriptPath);

				g();

				generator.workingDirectory = prevWorkingDirectory;
			}
		}
		else
			throw "invalid target";
	}

	storeProject(project)
	{
		if (this.projects.findIndex(e => compareProjects(e, project)) != -1)
			return;

		this.projects.push(project);

		for(const l of project.link)
		{
			const dep = this.loadDependency(l.name, l.src);
		
			if (!dep)
				throw `could not load link: "${l.name}" (from "${l.src}")`;

			this.storeProject(dep);
		}
	}

	resolveLinks(generator)
	{
		for(const p of this.projects)
		{
			const prevLinks = p.link;
			p.link = [];
			p.dependsOn = [];
			for(let l of prevLinks)
			{
				const toTarget = this.projects.find(e => compareProjects(e, { name: l.name, __scriptPath: l.src } ));

				if (toTarget)
				{
					p.dependsOn.push(toTarget);
					// TODO: link later
					link(p, toTarget, generator);
				}
				else
					throw `could not find project "${l.name}" that "${p.name}" depends on`;
			}
		}
	}

	loadDependency(name, src, context)
	{
		const resolvedPath = path.resolve(context, src);

		try {
			const script = loadBuildScript(resolvedPath);

			if (Array.isArray(script))
			{
				const dep = script.find(e => e.name == name);
				if (dep)
					return dep;
				return null;
			}
			else if (typeof script === "object")
			{
				if (script.name == name)
					return script;
			}
		}
		catch(exc) {
			return null;
		}

		return null;
	}
};


module.exports = {
	CppBuildEngine
}