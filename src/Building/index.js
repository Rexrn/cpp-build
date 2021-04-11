const { GNUMakeGenerator, Premake5Generator } = require("./Generators");

const {
	CppBuildEngine
} = require("../General/Engine");

const path = require("path");

function build(scriptAbsolutePath)
{	
	const gen = new Premake5Generator();
	gen.workingDirectory = path.dirname(scriptAbsolutePath);

	const engine = new CppBuildEngine();
	engine.generate(scriptAbsolutePath, gen);
}

module.exports = {
	build
}