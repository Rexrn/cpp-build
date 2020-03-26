const { build } = require("../Building"); 

const path = require("path");

module.exports = {
	run()
	{
		const argv = 
			require("yargs")
			.usage("Usage: $0 [file name] <parameters>")
			.demandCommand(1, "Error: no file specified!")
			.argv;

		try
		{
			const targetPath = argv._[0];

			// Resolve path and use it to build file.
			console.log("# cpp-build is running build process...");

			build( path.resolve(process.cwd(), targetPath) );

			console.error(`# cpp-build process finished (success).`);
		}
		catch(exc)
		{
			console.error(`# cpp-build process finished (failure, reason: "${exc}")`);
		}
	}
};