const submodules = [
	require("./Exporting"),
	require("./General"),
	require("./Building")
];

Object.assign(module.exports, ...submodules);