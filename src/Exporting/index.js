module.exports = {
	export(theModule, target)
	{
		if (typeof target === "string")
		{
			theModule.exports = {
				type: "application",
				files: [ target ],
				__scriptPath: theModule.path
			};
		}
		else
			throw "unsupported target type";
	}
}