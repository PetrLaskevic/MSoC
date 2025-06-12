# High level call graph (call hierarchy) for quick overview of the architecture of the project
## Obtain graph
The point is not to map all calls in existance (standard library functions will be omitted),
but to show the functions.
Look at https://github.com/scottrogowski/code2flow to see how it shows my projects.
(found in https://www.reddit.com/r/learnjavascript/comments/o9s5iv/any_good_vscode_extensions_to_visualize_codecalls/)
Some ideas from https://archikoder.com/ are interesting
(adding and removing a subset of functions dynamically and see if they're related)

To parse JS 3 options (there are almost none to parse TypeScript, I can just compile TS to JS and then run this on the output JS)
    - JS parser (like acorn, [overview of options](https://medium.com/@yuexing0921/a-brief-introduction-of-various-javascript-parsers-103e32c4d7d2))

    A blog post,  [extract all functions from JS file](https://www.soujanya.co.in/2020-12-31-all-functions/)
        - the blog talks about extracting the names of functions, not about calls inside functions
            => ale stejně se asi ta logika detekce popsaná v sekci "vlastní parser" bude líp dělat s parserem
                => určitě tam bude metoda jako .children nějakého vrcholu který je function pro function body
                    => a pak se půjde proiterovat tím

        => used by webpack, and its fork for eslint, so battle tested
        => written by the guy who made CodeMirror
        => more flexible as I have full access to the tokens through their API then what VS Code rigidly provides
        => extra overhead if I build a full IDE with syntax highlighting = there will be 2 parsers running (one for this and one for syntax highlighting & autocomplete & other language specific features)

    - VS code extension APIs:
        https://code.visualstudio.com/docs/cpp/cpp-ide#_call-hierarchy
        => would necessitate my "web IDE" to be based on VS Code
        => less customizability - extracts information from the builtin JS/Python etc language server I have no control over
                - I want custom entry points, like:
                    - event listener callbacks
                    - MutationObserver callbacks
                    - Intersection Observer
                    - media query listeners
                    - browser.runtimeOnMessage
                    => should be handled even if their callback is an anonymous function 
                    (MutationObserver call specifics (to tell on what portion - body or just one button)) --> () =>{} --> funkceABC


                     => and an extension https://github.com/beicause/call-graph that uses those language agnostic APIs doesn't have them

                     It depends on `vscode.provideOutgoingCalls` and `vscode.provideIncomingCalls` built-in commands( the same with `Show Call Hierarchy` command, not available for some **language server** ). => further showing that it depends on the language server's parser, if I'd use that theoretically lower overhead. 
                     
                     (https://microsoft.github.io/language-server-protocol/ but probably not applicable, since idk what magic VS Code does to provide those APIs) => maybe LSP is really more for autocomplete and function appropriate docs = interesting if CodeMirror supports something like that
               

    - roll my own "parser" 
        = likely more fragile, as I'd like to cut corners by using Regex like string match approaches,
        not bothering with tokens or their parsing = sensitive to whitespace and not complete for every possible program
            - but for the very limited feature set:
                1. searching for the text `function`, to get an idea where to search for function names
                    a. in an assignment, like `setLogLevel: function (levelName) { }` in an Object {} or `let foo = function() { }`
                    b. in a normal definition `function main(){ }`
                    c. then there are `() =>` arrow functions
                    d. class methods = no word function, must know if it is in class

                2. Having a list of functions that are defined in this program, that interest us and store them in a set.
                3. Look into each (matching {} brackets will tells us when the function ends) and record any function calls we come across => look if they're in 2. 
                    => if yes, these are going to be "children" in the graph, there will be outgoing edges to them (to signify that the function depends on them)

                    => if no then they're likely to be native or from a dependency (whose code we don't examine if it's in node_modules and not the project folder))

                a. a slight hiccup might be with functions defined within functions
                        - that both the call and the definition will be inside another function,
                          meaning the list in 2., of top level defined functions, is incomplete
                        (the nested {} approach won't be mangled though)

                4. There will be a graph, most likely built as a JS object, nodes will be function names (so neighbor list representation).
        
        => also likely to be more error prone and less extensible if the scope of this part of the project grows (i. e. differentiating treatment based on parameters etc.)

## Visualise Graph
    - mermaid.js - seen some interactive projects (even animations and such) => can probably click on function name => view function in editor
    - alternatively: https://dreampuf.github.io/GraphvizOnline https://github.com/dreampuf/GraphvizOnline based on https://github.com/mdaines/viz-js

    ![Fairly nice output of graphviz](image.png) from the extension, 
    source text here:
    ```

    digraph  {
    rankdir="LR"
    {"/home/petr/Documents/extensions/Tablet-UI-For-Firefox-Android/content.js#load@4:0"[label="load", ]} -> {"/usr/share/code/resources/app/extensions/node_modules/typescript/lib/lib.dom.d.ts#getElementById@7862:4"[label="getElementById", ] "/usr/share/code/resources/app/extensions/node_modules/typescript/lib/lib.dom.d.ts#removeChild@17151:4"[label="removeChild", ] "/usr/share/code/resources/app/extensions/node_modules/typescript/lib/lib.dom.d.ts#remove@6175:4"[label="remove", ] "/usr/share/code/resources/app/extensions/node_modules/typescript/lib/lib.dom.d.ts#createElement@7701:4"[label="createElement", ] "/usr/share/code/resources/app/extensions/node_modules/typescript/lib/lib.dom.d.ts#style@8498:4"[label="style", ] "/usr/share/code/resources/app/extensions/node_modules/typescript/lib/lib.dom.d.ts#attachShadow@8316:4"[label="attachShadow", ] "/usr/share/code/resources/app/extensions/node_modules/typescript/lib/lib.dom.d.ts#appendChild@17097:4"[label="appendChild", ]}
    "/usr/share/code/resources/app/extensions/node_modules/typescript/lib/lib.dom.d.ts#getElementById@7862:4"[label="getElementById", ]
    "/usr/share/code/resources/app/extensions/node_modules/typescript/lib/lib.dom.d.ts#removeChild@17151:4"[label="removeChild", ]
    "/usr/share/code/resources/app/extensions/node_modules/typescript/lib/lib.dom.d.ts#remove@6175:4"[label="remove", ]
    "/usr/share/code/resources/app/extensions/node_modules/typescript/lib/lib.dom.d.ts#createElement@7701:4"[label="createElement", ]
    "/usr/share/code/resources/app/extensions/node_modules/typescript/lib/lib.dom.d.ts#style@8498:4"[label="style", ]
    "/usr/share/code/resources/app/extensions/node_modules/typescript/lib/lib.dom.d.ts#attachShadow@8316:4"[label="attachShadow", ]
    "/usr/share/code/resources/app/extensions/node_modules/typescript/lib/lib.dom.d.ts#appendChild@17097:4"[label="appendChild", ]
    subgraph "cluster_/home/petr/Documents/extensions/Tablet-UI-For-Firefox-Android/content.js" {
    label="${workspace}/content.js"
    "/home/petr/Documents/extensions/Tablet-UI-For-Firefox-Android/content.js#load@4:0" }
    subgraph "cluster_/usr/share/code/resources/app/extensions/node_modules/typescript/lib/lib.dom.d.ts" {
    label="/usr/share/code/resources/app/extensions/node_modules/typescript/lib/lib.dom.d.ts"
    "/usr/share/code/resources/app/extensions/node_modules/typescript/lib/lib.dom.d.ts#getElementById@7862:4" "/usr/share/code/resources/app/extensions/node_modules/typescript/lib/lib.dom.d.ts#removeChild@17151:4" "/usr/share/code/resources/app/extensions/node_modules/typescript/lib/lib.dom.d.ts#remove@6175:4" "/usr/share/code/resources/app/extensions/node_modules/typescript/lib/lib.dom.d.ts#createElement@7701:4" "/usr/share/code/resources/app/extensions/node_modules/typescript/lib/lib.dom.d.ts#style@8498:4" "/usr/share/code/resources/app/extensions/node_modules/typescript/lib/lib.dom.d.ts#attachShadow@8316:4" "/usr/share/code/resources/app/extensions/node_modules/typescript/lib/lib.dom.d.ts#appendChild@17097:4" "/usr/share/code/resources/app/extensions/node_modules/typescript/lib/lib.dom.d.ts#getElementById@7862:4" "/usr/share/code/resources/app/extensions/node_modules/typescript/lib/lib.dom.d.ts#removeChild@17151:4" "/usr/share/code/resources/app/extensions/node_modules/typescript/lib/lib.dom.d.ts#remove@6175:4" "/usr/share/code/resources/app/extensions/node_modules/typescript/lib/lib.dom.d.ts#createElement@7701:4" "/usr/share/code/resources/app/extensions/node_modules/typescript/lib/lib.dom.d.ts#style@8498:4" "/usr/share/code/resources/app/extensions/node_modules/typescript/lib/lib.dom.d.ts#attachShadow@8316:4" "/usr/share/code/resources/app/extensions/node_modules/typescript/lib/lib.dom.d.ts#appendChild@17097:4" }
    }
    ```

# Code Editor
- CodeMirror - seems lightweight, and has autocomplete (hopefully sort of like IntelliSense) 
    - fun fact - used by CodePen
    https://github.com/codemirror/dev/ for https://codemirror.net/ or older https://github.com/codemirror/codemirror5
- Monaco from VS Code 
    - I like using it in VS Code, though I heard it's hard to embed & extend (badly documented)
    - also allegedly doesn't support touchscreens very well, but that isn't too important

