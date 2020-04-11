const { selectCompiler } = require("../../Helper");
const { TargetType } = require("../../General/TargetType.js");

const path = require("path");
const fs = require("fs");

class GNUMakeGenerator
{
	constructor()
	{
		this.workingDirectory 	= "";

		this.cppCompilerCmd 	= "g++";
		this.cCompilerCmd 		= "gcc";
		this.makeProgram 		= "make";
		this.archiveProgram 	= "ar";
		this.fileTargetOptions = [
				"$(PROJECT_INCLUDE_DIRECTORIES)",
				"$(PROJECT_LINKER_DIRECTORIES)"
			].join(" ");
		this.projectTargetOptions = [
				"$(PROJECT_LINKER_OPTIONS)",
				"$(PROJECT_LINKED_LIBRARIES)"
			].join(" ");
	}
	
	/**
	 * Generates GNU Makefile build info for specified target.
	 * @param {object} project - the target to generate.
	 */
	generate(project)
	{
		if (Array.isArray(project))
		{
			return this.generateGroupMakefile(project);
		}
		else if (typeof project === "object")
		{
			project.type = project.type || TargetType.Application;

			switch(project.type)
			{
			case TargetType.Application:
			case TargetType.StaticLibrary:
				return this.generateMakefile(project);

			default:
				throw `invalid target type: "${project.type || "unknown"}"`;
			}
		}
		throw "invalid target, valid object required";
	}


	generateGroupMakefile(groupProject)
	{
		let subtargets = "";
		let fileContents = "";
		for(const subtarget of groupProject)
		{
			subtargets += `subtarget_${subtarget.name} `;
			fileContents += `subtarget_${subtarget.name}: ${subtarget.name}/Makefile\n`;
			fileContents += `\t${this.makeProgram} -C ${subtarget.name}\n`;
		}
		fileContents = `all: ${subtargets}\n${fileContents}`;

		return {
				type: "makefile",
				content: fileContents
			};
	}


	generateMakefile(project)
	{
		const library = project.type === TargetType.StaticLibrary;
		const makefilePrefix = this.prepareDefaultMakefile(project);

		let substepsContent = "";

		let buildAllCmd = "";

		if (library) {
			buildAllCmd = `\t$(ARCHIVER) rs ${project.name}`
		}
		else {
			buildAllCmd = `\t$(CPP) -o ${project.name} ${this.projectTargetOptions}`
		}

		const buildAllStep = {
				header: "all:",
				command: buildAllCmd
			};

		for(const file of project.files)
		{
			const generated = this.generateFileMakefileStep(file);
			if (generated)
			{
				buildAllStep.header += " " + generated.stepName;
				buildAllStep.command += " " + generated.stepName + ".o";
				substepsContent += `\n${generated.stepName}:\n\t${generated.content}`;
			}
		}

		return {
				type: "makefile",
				content: `${makefilePrefix}\n\n${buildAllStep.header}\n${buildAllStep.command}\n\n${substepsContent}`
			};
	}



	generateFileMakefileStep(fileTarget)
	{
		let compilerString = null;
			
		{
			const compilerType = selectCompiler(fileTarget);

			if (compilerType == "cpp")
				compilerString = "$(CPP)";
			else if (compilerType == "c")
				compilerString = "$(CC)";
		}

		// Do not generate build steps for unsupported file types:
		if (!compilerString)
		{
			return null;
		}
		
		const targetAbsolutePath = path.resolve(this.workingDirectory, fileTarget);
		const targetBaseName = path.basename(fileTarget);

		// Create build step
		// TODO: add include folders, etc.
		return { 
				type: "step",
				stepName: targetBaseName,
				content: `${compilerString} -o ${targetBaseName}.o ${this.fileTargetOptions} -c ${targetAbsolutePath}`
			};
	}


	prepareDefaultMakefile(project)
	{
		let content = "";

		const mergeAccesses = a =>  [ ...a.public, ...a.private ];

		// Variables:
		{
			content += `CPP=${this.cppCompilerCmd}\n`;
			content += `CC=${this.cCompilerCmd}\n`;
			
			if (project.type === TargetType.StaticLibrary)
			{
				content += `ARCHIVER=${this.archiveProgram}\n`;
			}
		}

		// Include directories:
		{
			const fmt = (dir) => GNUMakeGenerator.formatIncludeDirectory(project.__scriptDirectory, dir);

			content += "PROJECT_INCLUDE_DIRECTORIES="
			content += mergeAccesses(project.includeDirectories).map( fmt ).join(" ");
			content += "\n";
		}
			
		// Linker directories:
		{
			const fmt = (dir) => GNUMakeGenerator.formatLinkerDirectory(project.__scriptDirectory, dir);

			content += "PROJECT_LINKER_DIRECTORIES="
			content += mergeAccesses(project.linkerDirectories).map( fmt ).join(" ");
			content += "\n";
		}

		// Linked libraries:
		if (project.type === TargetType.Application)
		{
			content += "PROJECT_LINKER_OPTIONS="
			content += mergeAccesses(project.linkerOptions).map( e => `"-l${e}"` ).join(" ");
			content += "\n";

			content += "PROJECT_LINKED_LIBRARIES="
			content += project.link.map( e => `"${e}"` ).join(" ");
			content += "\n";
		}

		return content;
	}
	

	predictOutputPath(project)
	{
		return path.resolve(process.cwd(), project.name, project.name);
	}


	static formatIncludeDirectory(projectDir, inc)
	{
		const resolvedDirectory = path.resolve(projectDir, inc);
		return `"-I${resolvedDirectory}"`;
	}


	static formatLinkerDirectory(projectDir, link)
	{
		const resolvedDirectory = path.resolve(projectDir, link);
		return `"-L${resolvedDirectory}"`;
	}
}

module.exports = {
	GNUMakeGenerator
}