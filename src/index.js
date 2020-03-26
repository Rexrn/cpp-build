const path = require("path");

const submodules = [
	require("./Exporting"),
	require("./Building"),
	require("./Running")
];

Object.assign(module.exports, ...submodules);