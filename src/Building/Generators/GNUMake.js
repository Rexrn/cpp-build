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
				"$(PROJECT_CPP_COMPILE_FLAGS)",
				"$(PROJECT_DEFINITIONS)"
			].join(" ");
			this.projectTargetOptions = [
				"$(PROJECT_LINKER_DIRECTORIES)",
				"$(PROJECT_LINKER_FLAGS)",
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
			case TargetType.Interface:
			case TargetType.StaticLibrary:
				return this.generateProjectMakefile(project);

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
			fileContents += `subtarget_${subtarget.name}: `;
			fileContents += subtarget.dependsOn.map(e => `subtarget_${e.name}`).join(" ");
			fileContents += ` ${subtarget.name}/Makefile\n`;
			fileContents += `\t${this.makeProgram} -C ${subtarget.name}\n`;
		}
		fileContents = `all: ${subtargets}\n${fileContents}`;

		return {
				type: "makefile",
				content: fileContents
			};
	}


	generateProjectMakefile(project)
	{
		// TODO: improve this.
		if (project.type === TargetType.Interface)
		{
			return {
				type: "makefile",
				content: `all:\n\techo "INTERFACE PROJECT \"${project.name}\" SETUP DONE"`	
			};
		}

		const library = project.type === TargetType.StaticLibrary;
		const makefilePrefix = this.prepareDefaultMakefile(project);

		let substepsContent = "";

		let buildAllCmd = "";

		if (library) {
			buildAllCmd = `\t$(ARCHIVER) rs ${project.name}.a`
		}
		else {
			buildAllCmd = `\t$(CPP) -o ${project.name}`
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
				content: `${makefilePrefix}\n\n${buildAllStep.header}\n${buildAllStep.command} ${this.projectTargetOptions}\n\n${substepsContent}`
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
				content: `${compilerString} -o ${targetBaseName}.o -c "${targetAbsolutePath}" ${this.fileTargetOptions}`
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
			const fmt = (dir) => GNUMakeGenerator.formatIncludeDirectory(path.dirname(project.__scriptPath), dir);

			content += "PROJECT_INCLUDE_DIRECTORIES="
			content += mergeAccesses(project.includeDirectories).map( fmt ).join(" ");
			content += "\n";
		}

		// Compile flags directories:
		{
			content += "PROJECT_CPP_COMPILER_FLAGS="
			content += mergeAccesses(project.compilerFlags).map(e => `"${e}"`).join(" ");
			content += "\n";

			// TODO: add support for C compiler flags
		}

		// Definitions:
		{
			content += "PROJECT_DEFINITIONS="
			content += mergeAccesses(project.definitions).map(e => `"-D${e}"`).join(" ");
			content += "\n";
		}

		// Linker:
		if (project.type === TargetType.Application)
		{
			const fmt = (dir) => GNUMakeGenerator.formatLinkerDirectory(path.dirname(project.__scriptPath), dir);

			content += "PROJECT_LINKER_DIRECTORIES="
			content += mergeAccesses(project.linkerDirectories).map( fmt ).join(" ");
			content += "\n";

			content += "PROJECT_LINKER_FLAGS="
			content += mergeAccesses(project.linkerFlags).map( e => `"-l${e}"` ).join(" ");
			content += "\n";

			content += "PROJECT_LINKED_LIBRARIES="
			content += project.link.map( e => `"${e}"` ).join(" ");
			content += "\n";
		}

		return content;
	}
	

	predictOutputPath(project)
	{
		let outPath = path.resolve(process.cwd(), project.name, project.name);

		if (project.type == TargetType.StaticLibrary)
			outPath += ".a";
		
		return outPath;
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