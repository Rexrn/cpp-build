const { build } = require("../Building"); 

const path = require("path");
const fs = require("fs");

function ensureDirectoryExistence(filePath) {
	if (fs.existsSync(filePath)) {
		return true;
	}
	fs.mkdirSync(filePath);
}

function runBuild(args)
{
	try
	{
		// Resolve path and use it to build file.
		console.log("# cpp-build is running build process...");

		build( path.resolve(process.cwd(), args.target) );


		console.log(`# cpp-build process finished (success).`);
	}
	catch(exc)
	{
		console.error(`Error: Details:\n${exc}`);
		console.error("# cpp-build process finished (failure)");
	}
}

function runDiscover(args)
{
	//try
	{
		// Resolve path and use it to build file.
		console.log("# cpp-build is running discover process...");

		ensureDirectoryExistence('meta');
		let projects = [];
		const discovered = require(path.resolve(process.cwd(), args.target));
		if (Array.isArray(discovered))
			projects = discovered;
		else if (typeof discovered === "object")
			projects.push(discovered);
		else
			throw `executing build script resulted with invalid type: ${typeof discovered}`;

		fs.writeFileSync("meta/discover.json",
				JSON.stringify(projects.map(p => ({ name: p.name })), null, "\t"),
				{ flag: 'w'}
			);

		console.error(`# cpp-build process finished (success).`);
	}
	// catch(exc)
	// {
	// 	console.error(`# cpp-build process finished (failure, reason: "${exc}")`);
	// }
}

module.exports = {
	run()
	{
		const targetOption = {
				type: 		"string",
				describe: 	"path to the targets build script/json"
			};

		const argv = 
			require("yargs")
			.usage("Usage: $0 (build|discover) [target]")
			.command('build [target]', 'build target script',
					(yargs)	=> { yargs.positional('target', targetOption ) },
					(args)	=> runBuild(args)
				)
			.command('discover [target]', 'discover projects from target script',
					(yargs)	=> { yargs.positional('target', targetOption) },
					(args)	=> runDiscover(args)
				)
			.demandCommand(1, "Error: no command specified!")
			.demandOption("target")
			.argv;
	}
};