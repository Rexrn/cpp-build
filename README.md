# CppBuild

**Warning: things described in this README are mostly
not implemented yet. Do not use this software for now.**

<p align="center">
	<img src="resources/logo-big.svg">
	<br/>
	<b>
	A free and easy to use C++ meta-build system based on <a href="https://nodejs.org">Node.js</a> that leverage <a href="https://premake.github.io/">Premake5</a> as project generator.
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
		<td><a href="docs/Examples.md">	<img src="resources/icons/note.svg"/>			</a></td><td><a href="docs/Examples.md">Examples</a>	</td>
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


## Quick start


### 1. Hello World Code

Create a folder with a basic C++ Hello World code inside `Main.cpp`:

```cpp
#include <iostream>

int main()
{
	std::cout << "Hello, World!";
}
```

### 2. Build instructions

and a `Project.build.json` file with following content:

```js
{
	"name": "MyApp",
	"type": "application",
	"files": [
		"Main.cpp"
	]
}
```
> **Note:**  
> If you're not familiar with JSON file format, checkout [this page](https://en.wikipedia.org/wiki/JSON#Syntax)

### 3. Build from command line

Now build entire application with following command:

```
cppbuild -g=vs2019 -b Project.build.json
```
Explaination:

- `-g` flag is used to specify build files generator (`vs2019` = Visual Studio 2019)
- `-b` flag **builds all** targets.

> **Note:**  
> Go to this [Premake5 tutorial page](https://premake.github.io/docs/Using-Premake) for complete list of available generators.

<br>

**For next steps reach out to our [Tutorials](docs/Tutorials.md) page.**



## Motivation

TODO.


## Contributing



## Author

Made by Paweł Syska.




