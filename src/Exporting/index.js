module.exports = {
	export(theModule, target)
	{
		if (typeof target === "string")
		{
			theModule.exports = {
				type: "application",
				files: [ target ],
				__scriptDirectory: theModule.path
			};
		}
		else
			throw "unsupported target type";
	}
}