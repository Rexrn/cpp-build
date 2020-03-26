module.exports = {
	run()
	{
		const argv = 
			require("yargs")
			.usage("Usage: $0 [file name] <parameters>")
			.demandCommand(1, "Error: no file specified!")
			.argv;

		console.log("Args: ");
		console.log(argv);
	}
};