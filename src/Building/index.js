const path = require("path");

module.exports = {
	build(scriptPath)
	{
		let resolvedPath = path.resolve(process.cwd(), scriptPath);
		let script = require( resolvedPath );
		if (script)
		{
			if (!script.__scriptDirectory)
			{
				script.__scriptDirectory = path.dirname(resolvedPath);
			}
		}

		console.log("Building:");
		console.log(script);
	}
}