const { GNUMakeGenerator } = require("./Generators");

const path = require("path");
const fs = require("fs");

module.exports = {
	build(scriptAbsolutePath)
	{
		let script = require( scriptAbsolutePath );

		// This check is important for JSON projects.
		if (script && !script.__scriptDirectory)
		{
			script.__scriptDirectory = path.dirname(scriptAbsolutePath);
		}

		const gen = new GNUMakeGenerator();

		gen.workingDirectory = script.__scriptDirectory;
		
		fs.writeFileSync("Makefile", gen.generate(script).content||"");
	}
}