# cpp-build

A free and easy to use C++ meta-build system based on Node.js.

Setup your projects easily with JSON files or a JavaScript code.

**Warning: things described in this README are mostly
not implemented yet. Do not use this software for now.**

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

```json
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

```json
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

## Installation

Download Node.js, then install `cpp-build` package like this:

```bash
npm install -g github:Rexrn/cpp-build
```

Congratulations. You can now use **CppBuild**.

## Author

Made by Paweł Syska.




