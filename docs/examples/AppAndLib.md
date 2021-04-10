# Application and a library | [Examples](../Examples.md)


Lets say that you create a Game and a Game Engine project.
The Game works on top of the Game Engine library.
You have following folder structure:

- `Game/`
  - `include/Game/`
    - **`Game.hpp`**
  - `src/`
    - **`Game.cpp`**
- `GameEngine/`
  - `include/GameEngine/`
    - **`GameEngine.hpp`**
  - `src/`
    - **`GameEngine.cpp`**

The `Project.build.json` would look like this:

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

Because the `includeDirectories` in the `GameEngine` project
are **public**, every project linking to that library,
will inherit that configuration.

## [<-- Back](../Examples.md)