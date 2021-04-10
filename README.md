# CppBuild

**Warning: things described in this README are mostly
not implemented yet. Do not use this software for now.**

<p align="center">
	<img src="resources/logo-big.svg">
	<br/>
	<b>
	A free and easy to use C++ meta-build system based on <a href="https://nodejs.org">NodeJS</a> that leverage <a href="https://premake.github.io/">Premake5</a> as project generator.
	</b>
	<br>
	Setup your projects easily with <a href="https://en.wikipedia.org/wiki/JSON#Syntax">JSON</a> files or a <a href="https://en.wikipedia.org/wiki/JavaScript">JavaScript</a> code.
	<br>
	<br>
	<a href="https://nodejs.org">
		<img src="resources/nodejs-logo.svg" alt="NodeJS Logo">
	</a>
	<a href="https://premake.github.io/">
		<img src="resources/premake-logo.png" alt="Premake5 Logo">
	</a>
</p>
<br/>
<br/>

<table align="center">
	<tr>
		<td><a href="#installation">	<img src="resources/icons/arrow-down.svg"/>		</a></td><td><a href="#installation">Installation</a>	</td>
		<td><a href="#quick-start">		<img src="resources/icons/run-all.svg"/>		</a></td><td><a href="#quick-start">Quick Start</a>		</td>
		<td><a href="#examples">		<img src="resources/icons/note.svg"/>			</a></td><td><a href="#examples">Examples</a>			</td>
	</tr>
	<tr>
		<td><a href="#documentation">	<img src="resources/icons/repo.svg"/>			</a></td><td><a href="#documentation">Documentation</a>	</td>
		<td><a href="#goals">			<img src="resources/icons/question.svg"/>		</a></td><td><a href="#goals">Goals</a>					</td>
		<td><a href="#contributing">	<img src="resources/icons/organization.svg"/>	</a></td><td><a href="#contributing">Contributing</a>	</td>
	</tr>
</table>

<br/>

## Installation

Download [Node.js](https://nodejs.org), then install `CppBuild` package like this:

```bash
npm install -g github:Rexrn/CppBuild
```

Congratulations. You can now use **CppBuild**.
## Examples

The best way to introduce someone to a tool is through
some examples. Lets see how to use CppBuild:

### 1. Hello world

Let's say you created simple "Hello, World!" code inside
`Main.cpp` file:

```cpp
#include <iostream>

int main() {
	std::cout << "Hello, World!";
}
```

To use CppBuild, you have to create a JSON file,
that contains following info about your project:
- name 
- type (application / static library / dynamic library)
- files

Project.json:

```js
{
	"name": "HelloWorld",
	"type": "application",
	"files": [ "Main.cpp" ]
}
```

Now that you have your project set up, lets build it.

1. Open terminal and create `build` folder inside project folder.
	```bash
	mkdir build
	cd build
	```
2. Run CppBuild and provide path to the `Project.json` (`-b` flag builds project after generation):
	```bash
	cpp-build ../Project.json -b
	```

### 2. Application and a library

Lets say you create a Game and a GameEngine project.
Game works on top of a GameEngine library.
You have following folder structure:

```plaintext
/Game
	/include/Game
		Game.hpp
	/src
		Game.cpp
/GameEngine
	/include/GameEngine
		GameEngine.hpp
	/src
		GameEngine.cpp
Project.json
```

The `Project.json` would look like this:

```js
[
	{
		"name": "GameEngine",
		"type": "static library",
		"includeDirectories": {
			"public": [ "GameEngine/include" ]
		},
		"files": [ 
			"GameEngine/include/**.hpp",
			"GameEngine/src/**.cpp"
		]
	},
	{
	
		"name": "Game",
		"type": "application",
		"includeDirectories": {
			"private": [ "Game/include" ]
		},
		"files": [ 
			"Game/include/Game/**.hpp",
			"Game/src/**.cpp"
		],
		"link": [
			"GameEngine"
		]
	}
]
```

Because `includeDirectories` in `GameEngine` project
are public, every project linking to that library,
will inherit that configuration.

## Motivation

TODO.


## Contributing



## Author

Made by Paweł Syska.




