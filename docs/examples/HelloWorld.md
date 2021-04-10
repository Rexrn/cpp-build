# Hello World | [Examples](../Examples.md)


To use the CppBuild, you have to create a JSON file,
that contains the following info about your project:
- name 
- type
	(one of the following values)
  - `application`
  - `static library`
  - `shared library`
- files

Lets name it `Project.build.json:`

```json
{
	"name": "HelloWorld",
	"type": "application",
	"files": [ "Main.cpp" ]
}
```

Now that you have your project set up, lets build it.

1. Open a terminal and create `build` folder inside the project folder.
	```bash
	mkdir build
	cd build
	```
2. Run CppBuild and provide path to the `Project.build.json`
	```bash
	cppbuild -g=vs2019 -b ../Project.build.json
	```

Voila! Your project is going to get built inside `build` folder.
Binaries are by default installed into `build/bin` folder.

## [<-- Back](../Examples.md)