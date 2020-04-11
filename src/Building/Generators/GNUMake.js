const { selectCompiler } = require("../../Helper");
const { TargetType } = require("../../General/TargetType.js");

const path = require("path");
const fs = require("fs");

class GNUMakeGenerator
{
	constructor()
	{
		this.workingDirectory = "";

		this.cppCompilerCmd = "g++";
		this.cCompilerCmd = "gcc";
		this.makeProgram = "make";
		this.archiveProgram = "ar";
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
	 * @param {object} target - the target to generate.
	 */
	generate(target)
	{
		if (Array.isArray(target))
		{
			return this.generateGroupMakefile(target);
		}
		else if (typeof target === "object")
		{
			target.type = target.type || TargetType.Application;

			switch(target.type)
			{
			case TargetType.Application:
			case TargetType.StaticLibrary:
				return this.generateMakefile(target);

			default:
				throw `invalid target type: "${target.type || "unknown"}"`;
			}
		}
		throw "invalid target, valid object required";
	}


	generateGroupMakefile(target)
	{
		let subtargets = "";
		let fileContents = "";
		for(const subtarget of target)
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


	generateMakefile(target)
	{
		const library = target.type === TargetType.StaticLibrary;
		const makefilePrefix = this.prepareDefaultMakefile(target);

		let substepsContent = "";

		let buildAllCmd = "";
		if (library)
			buildAllCmd = `\t$(ARCHIVER) rs ${target.name}`
		else
			buildAllCmd = `\t$(CPP) -o ${target.name} ${this.projectTargetOptions}`

		const buildAllStep = {
			header: "all:",
			command: buildAllCmd
		};

		for(const file of target.files)
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



	generateFileMakefileStep(target)
	{
		let compilerString = null;
			
		{
			const compilerType = selectCompiler(target);

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
		
		const targetAbsolutePath = path.resolve(this.workingDirectory, target);
		const targetBaseName = path.basename(target);

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
	

	predictOutputPath(target)
	{
		return path.resolve(process.cwd(), target.name, target.name);
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