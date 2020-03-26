module.exports = {
	selectCompiler(fileName)
	{
		if (typeof fileName !== "string")
			throw "could not determine file type, string expected";
		
		const endsWithAnyOf = (str, ...postfixes) => {
				for(const postfix of postfixes)
					if (str.endsWith(postfix)) return true;				
				return false;
			};

		if (endsWithAnyOf(fileName, ".cpp", ".cxx", ".cc"))
			return "cpp";
		else if (endsWithAnyOf(fileName, ".c"))
			return "c";
		else
			return null;
	}
}