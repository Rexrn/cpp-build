const { TargetType } = require("./TargetType");

const path = require("path");
const fs = require("fs");

// TODO: move this to other file.
/**
 * Flattens two dimensional array and returns the flattened one.
 * @param {*} array2d 
 * @returns The flattened array.
 */
 function flatten2dArray(array2d)
 {
	 const flattenedArray = [];
 
	 for(const a of array2d)
	 {
		 flattenedArray.push(...a);
	 }
 
	 return flattenedArray;
 }

/**
 * Compare whether two projects are identical (in terms of the name and source location).
 * @param {*} lhs first project
 * @param {*} rhs second project
 * @returns true if identical, otherwise false
 */
function compareProjects(lhs, rhs)
{
	return lhs.name == rhs.name && lhs.__scriptPath == rhs.__scriptPath;
}

/**
 * Makes sure that the project (and each subproject) havs information about source script it's coming from.
 * @param {*} project 
 * @param {*} scriptPath 
 */
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

/**
 * Makes sure that the project object is in right format to be processed by CppBuild.
 * Ensures required fields exist, etc.
 * @param {*} project 
 */
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
			// project.link[idx].src = path.resolve(path.dirname(project.__scriptPath), project.link[idx].src);
		}
	}
}

/**
 * Merges project field (dst) with values copied from a dependency (src).
 * 
 * @param {*} dst 				- project field
 * @param {*} src 				- dependency field
 * @param {*} priv 				- whether to merge in private mode (dependency is private)
 * @param {*} sourceValModifier - each value from the dependency is modified by this function (1 param - value)
 */
function mergeField(dst, src, priv, sourceValModifier)
{
	const fromSrc = [ ...src.interface, ...src.public ];

	if (sourceValModifier)
	{
		for(let i in fromSrc) {
			fromSrc[i] = sourceValModifier(fromSrc[i]);
		}
	}

	if (priv)
		dst.private = [ ...dst.private, ...fromSrc ];
	else
		dst.public = [ ...dst.public, ...fromSrc ];
}

/**
 * Adds `dependency` to `target`. Merges exposed fields if needed. 
 * @param {*} target 		- target that uses dependency
 * @param {*} dependency 	- dependency to be added
 * @param {*} generator 	- reference to a generator
 * @param {*} private 		- whether dependency is private (not propagated when something depends on `target`)
 */
function link(target, dependency, generator, private = true)
{
	if (dependency)
	{
		const resolvePath = p => path.resolve(path.dirname(dependency.__scriptPath), p);

		mergeField(target.includeDirectories, 	dependency.includeDirectories, 	private, resolvePath);
		mergeField(target.linkerDirectories, 	dependency.linkerDirectories, 	private, resolvePath);
		mergeField(target.compilerFlags, 		dependency.compilerFlags, 		private);
		mergeField(target.definitions, 			dependency.definitions, 		private);
		mergeField(target.linkerFlags, 			dependency.linkerFlags, 		private);

		if (dependency.type === TargetType.StaticLibrary)
		{
			const p = generator.predictOutputPath(dependency);

			target.link.push(p);
		}
	}
}


/**
 * Loads build script and makes every loaded project conformant to CppBuild format.
 * @param {*} path					- path to the script
 * @param {*} additionalSearchDir 	- additional search directory
 * @returns 
 */
function loadBuildScript(path, additionalSearchDir = undefined)
{
	// Gather paths that should be searched:
	const paths = module.paths;

	if (additionalSearchDir !== undefined)
		paths.unshift(additionalSearchDir);

	const resolved 	= require.resolve(path, { paths: paths });
	const script 	= require(resolved);
	
	applyScriptPath(script, resolved);

	if (Array.isArray(script))
	{
		for(const project of script)
			makeProjectConformant(project);
	}
	else
		makeProjectConformant(script);
	return script;
}

/**
 * Detects which projects can be build in the next step.
 * Passes only projects that does not depend on other projects from the `pendingProjects`.
 * @param {*} pendingProjects - projects that were not passed to build in previous step.
 * @returns Array of buildable projects in the next step.
 */
function findBuildableProjects(pendingProjects)
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
		this.generateBuildFiles(flatten2dArray(buildQueue), generator);
	}

	setupBuildQueue()
	{
		const buildQueue = [];

		const pendingProjects = [...this.projects];

		while(pendingProjects.length > 0)
		{
			const nextStep = findBuildableProjects(pendingProjects);

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
			const dep = this.loadDependency(l.name, l.src, path.dirname(project.__scriptPath));
			if (!dep)
				throw `could not load link: "${l.name}" (from "${l.src}")`;

			l.ref = dep;
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
			for(const l of prevLinks)
			{
				const toTarget = l.ref;

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
			let script = null;
			try {
				script = loadBuildScript(resolvedPath, context);
			}
			catch(e) {
				script = loadBuildScript(src, context);
			}

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