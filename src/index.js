const path = require("path");

const submodules = [
	require("./Exporting"),
	require("./Building")
];

Object.assign(module.exports, ...submodules);