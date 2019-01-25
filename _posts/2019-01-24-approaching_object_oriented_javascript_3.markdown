---
layout: post
title:      "Approaching Object Oriented JavaScript (§ 3)"
date:       2019-01-24 20:18:52 -0500
permalink:  approaching_object_oriented_javascript_3
---

> Author's Note: This is a mini series, which will host a comprehensive outline of integrated object orientation within JavaScript versions ES5 and ES6 respectively.
> 
> §3 Topics:
> 
> 1. Object Literal Syntax Tweaks
> 1. Destructuring Assignment Syntax
> 1. ES6 Inheritance
> 1. Static Methods
> 1. Setters and Getters
> 1. Subclassing Builtins
> 1. Symbols
> 1. Object Assignment Methods
> 1. Sets
> 1. The Reflect API
> 1. The Proxy API
> 1. Proxy Revocable

In the [*last installment*](http://imjuan.com/approaching_object_oriented_javascript_2) of this series, the converstaion evolved from ES5 related subjects on function scope, block based scope, data hiding and IIFE. We also covered constructors and the effectiveness of prototypes in terms of inheritance. This then migrated to the introduction of ES6, by comparing class declarations, extensions, and method adoptions from their ES5 counterparts.

Since the previous topics already covered some good foundations on ES5, it's time to dive in to the useful upgrades that ES6 has brought with it. We had ended it with ES6 fat arrow functions, and how they can greatly simplify your syntax for annonymous functions. But there are even more useful and interesting things to discover, and I'll show you what those are right below!

**Object Literal Syntax Tweaks**

With ES6, there have been some slight tweaks to object assignment. For one, an object is capable of picking up declared variables outside of its scope, as assignments:

```
let name = 'Juan';
let state = 'MA';

let obj = {
    name,
    state,
    'greet me'() {
        console.log(this.name + ', ' + this.state);
    }
};
```

You probably noticed in the object variable above, that I'm also calling the function property `'greet me'` as a string, and I'm also excluding the keyword `function' for its assignment. This speeds up the declaration of properties by reducing the amount of syntax required.

To call it, I would follow the same logic of encapsulating a string property within square brackets, and then calling it with parenthesis set at the end:

`obj['greet me'](); // Juan, MA`

Another neat option that ES6 has introduced is dynamic fields:

```
let name = 'Juan';
let stateField = 'state';

let obj = {
    name,
    [stateField]: 'MA',
    'greet me'() {
        console.log(this.name + ', ' + this.state);
    }
};
```

This time I declared a variable `stateField` with a string assignment of `state`. I then relate it to the object variable `obj` by enclosing it within square brackets (because its namespaced assignment (`state`) is a string), and then I make its value be `MA`. What I did here is convert an outside variable value to become the string equivalent of a property for `obj`. As a result I'm capable of calling it in various ways:

```
console.log(obj.state); // MA
console.log(obj['state']); // MA
console.log(obj[stateField]); // MA
obj['greet me'](); // Juan, MA
```

I can still use dot notation as the string value state has no odd or spaced characters in it, and I can also call it through its original string form. Finally, I can then call it simply by its dynamic variable name (`stateField`), and when I use the function property `'greet me'`, I will still have it return for me the expected value.

**Destructuring Assignment Syntax**

ES6 brings with it a unique way to unpack values or properties, into their own distinct variables:

```
let iterable = [10, 20, 30];

let [a, b] = iterable;

console.log(a); // 10
console.log(b); // 20
```

I can assign variables as indexes, which contain the value of an iterator, in terms of the index list that it compares to. So in the example above, since I have two variable arguments (`a`, `b`) then the index length goes to 2. So when assigning to iterable, it lists to the same index length as the declaration.

If I were to declare more variables than there are indexes however, then it would return as being *undefined* for those extra ones. In order to resolve this, I can set default values for anything that may not have already gotten a true value from the passed in assignment (`iterable`):

```
let iterable = [10, 20, 30];

let [a, b, c, d, e = 'default'] = iterable;

console.log(a); // 10
console.log(b); // 20
console.log(c); // 30
console.log(d); // undefined
console.log(e); // default
```

I can also use the ES6 [*rest parameter*](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/rest_parameters) here to get some unique returns:

```
let iterable = [10, 20, 30];

let [a, ...b] = iterable;

console.log(a); // 10
console.log(b); // [ 20, 30 ]
```

It assigned a new array for variable `b`, which contained the remaining values of `iterable` which were still unassigned.

You can also destruct the values of variables using an array assignment:

```
let b = 10;

[b, a] = [a, b];

console.log(b); // 5
console.log(a); // 10
```

This caused the variable `b` to now have the assignment of `a`, and vise versa.

I can even make it ignore particular values for new variable assignments:

```
let numbers = [1, 2, 3];

let[a, , c] = numbers;

console.log(a); // 1
console.log(c); // 3
```

Now that you have a good gist of what *destructuring* is, let's see how it works when it comes to objects:

```
let obj = {
    name: 'Juan',
    state: 'MA'
};

let {name, state} = obj;

console.log(obj.name); // Juan
console.log(name); // Juan
```

I can pull what were originally properties of `obj`, into *independent* variables. Notice however, that I'm encapsulating the variable definitions in *curly brackets*, instead of *square brackets* like I was before. This is because I'm destructuring the declarations from an object, instead of an array.

Some things to be aware of when destructuring an object, is that I'm not allowed to skip values like I could with arrays, for example:

`let {name, , state} = obj;`

This would error out, because when destructuring objects, we reference the new variables by an object's property name, not its index. So if I didn't want a particular assignment, then I would just not declare it instead. Like so:

```
let obj = {
    name: 'Juan',
    state: 'MA',
    'greeting'() {
        console.log('Hello there!');
    }
};

let {name, greeting} = obj;

console.log(name); // Juan

console.log(obj.greeting()); // Hello there!
console.log(greeting()); // Hello there!
```

This allowed me to still make the variable `name`, and function `greeting`, but also exclude the property `state` when destructing it.

If for some reason I didn't want the new variable `name` to be the same as the original *property* `name`, I can then use an *alias* during its declaration:

```
let {name: person, greeting} = obj;

console.log(obj.name); // Juan
console.log(name); // ReferenceError: name is not defined
console.log(person); //Juan
```

So now `name` still works because it refers to the property name of obj, and `person` also works because it's a new variable that's outside of the object scope. Calling `name` without the obj receiver doesn't work however, as `person` is the only known variable that once referenced the property `name`.

**ES6 Inheritance**

Going back to the design pattern of classes in ES6, something I didn't touch on was object inheritance modifications for super classes. Let's say that I wanted to add a new feature to the constructor of a child. To complement this feature, I have modified a method in the parent class that would respond to it:

```
class Animal {
    constructor(name) {
        this.name = name;
    }

    eat() {
        return `${this.name} consumed food from ${this.location}.`; // location is a property I made in the child class Mammal
    }
}

class Mammal extends Animal {
    constructor(location) { // I added a new property to be attached to instances of Mammal aside from name
        this.location = location;
    }

    milk() {
        return 'Milk produced!';
    }
}

var animal = new Animal('Human');

var mammal = new Mammal('farm');

console.log(mammal.eat()); // ReferenceError: Must call super constructor in derived class before accessing 'this' or returning from derived constructor
```

As the error outputs above when I call the `eat` method, constructors MUST call super if they are *subclasses*, or they must explicitly return some object to take the place of the one that was not initialized. This is because in a child class constructor, '`this`' cannot be used until `super` is called.

To resolve the issue, I simply need to associate the `super` keyword in the child constructor in order to relate the new property location; as well as assign the `name` property in a correct fashion once more to the child class:

```
class Animal {
    constructor(name) {
        this.name = name;
    }

    eat() {
        return `${this.name} consumed food from ${this.location}.`;
    }
}

class Mammal extends Animal {
    constructor(name, location) { // added name as an argument so that I can pass the property to the instance
        super(name); // super keyword is used to access and call functions on an object's parent
        this.location = location;
    }

    milk() {
        return 'Milk produced!';
    }
}

var animal = new Animal('Human');

var mammal = new Mammal('Cow', 'Farm');

console.log(mammal.eat()); // Cow consumed food from Farm.
```
 
As you can see, by having included the `super` keyword I'm now able to correctly output the `eat` method, as well as assign both the `name` and `location` properties simultaneously to the instance of `Mammal`.

Another unique thing that can be implemented is relatable method calling from a parent to a child. For example:

```
class Mammal extends Animal {
    constructor(name, location) {
        super(name);
        this.location = location;
    }

    milk() {
        return 'Milk produced!';
    }

    eat() {
        return `${this.name} is producing some dairy... ${this.milk()}`;
    }

    eatAgain() {
        console.log(this.eat());
        console.log(super.eat());
    }
}

var mammal = new Mammal('Cow', 'farm');

mammal.eatAgain(); // Cow is producing some dairy... Milk produced!
                                     // Cow consumed food from farm.
```

What I've done here is remake the `eat` method in the child class, which now outputs a different valued string than the parent class `eat` method. As a result, I've masked the original method, so that when I call `eat()` from an instance of `Mammal`, it'll return the new method, and not `Animal`'s eat method.

If however, I wanted to still be able to call its parent method, then I can do so by associating the `super` keyword as the receiver to `eat()`. I've done this in the new method called `eatAgain()`. I log to the console both the parent method, and the new method by switching the receivers of eat(). super will call the parent method, while 'this' will call the current (child) method.

**Static Methods**

As someone who comes from an object oriented route, one would likely expect to see something familiar to class methods. After all, JavaScript has shown us that instance methods do already exist. That's where the keyword static comes in.

Static methods aren't called on instances of the class. Instead, they're called on the class itself. These are considered to be utility functions, such as functions to create or clone objects. Let's have an example:

```
var animalsList = []; // GlobalScope logger list

class Animals {

    static getAnimals() {
        return animalsList;
    }
    
    showAnimals() { // a plain instance method that is using the static method
        console.log(Animals.getAnimals());
    }
    
    logAnimals(type) { // instance method that pushes new animals to global variable array
        animalsList.push(type); // inserts new child object into array
    }
}

class HomeAnimals extends Animals {
    
    constructor(type, name) {
        super();
        this.type = type;
        this.name = name;
        super.logAnimals(this.type);
    }
}

let cat = new HomeAnimals('Cat', 'Bob');
let rat = new HomeAnimals('Rat', 'Bill');

let logger = new Animals();

cat.getAnimals(); // ERROR: no Access to StaticMethod

logger.getAnimals(); // ERROR: no Access to StaticMethod

logger.showAnimals(); // ['Cat', 'Rat']

cat.showAnimals(); // ['Cat', 'Rat']

console.log(Animals.getAnimals()); // ['Cat', 'Rat']

Animals.showAnimals(); // ERROR: no Access to PlainMethod outside Object
```

In the example above, I've created a global scoped variable called `animalsList`; whose sole purpose is to keep tabs of all the instantiated objects from the `HomeAnimals` class. I then create the first static method, named `getAnimals` from the parent class `Animals`. The only thing this method will do is return the status of the global variable `animalsList`. Following the static method, there's the instance method `showAnimals`. 

Take note that the method `showAnimals` is logging the output of the static method. This is done by appending `getAnimals` to the receiver class, `Animals` (`Animals.getAnimals()`). This is the only way for an instance method to get the contents of a class (static) method. One needs to directly namespace the class name with the static method, and intentionally insert it inside the instance method block. To help insert new objects into the variable `animalsList`, I also have the method `logAnimals` push them into its array.

Following up to this, the child class `HomeAnimals` then inherits class `Animals`. Its constructor also has a super reference, in order to have the method be capable of using this (as was previously explained in this guide); as well as to insert the parent method `logAnimals`, so that it can trigger during an instantiation.

You also see that I triggered a couple of different method calls to some instances at the end of the example. Notice how calling `getAnimals` on both instances outputs an error. I can't call it because the keyword static has restricted me from associating it to the instanced objects. However, if I call `showAnimals` on both of them I get the returned value of the global variable. As was mentioned before, I can get this to happen because the instance method itself has an associated call to the static method, with its parent namespacing it. This can obviously also work by just directly calling the static method with the class name, as I show in the `console.log` at the end.

Take note however that if I try to just call `showAnimals` with the receiver being the class, I get an error telling me that I can't access the method outside of an object, which makes sense.

One thing to be aware of, when going through this example, is that because there are no *private/protected/public* modifiers in ES6, there is no traditional way to hide the `animalsList` variable inside of the `Animals` class. Meaning that I can't instead declare the variable `animalsList` within the class scope, if I did then I would get the following error:

`SyntaxError: Unexpected identifier`

The only way to make it valid, and not rely on declaring the variable as a global one like I did, is by putting that variable inside of the *constructor*, or by implementing various [hacks](https://stackoverflow.com/questions/22528967/es6-class-variable-alternatives) to make it possible.

**Setters and Getters**

A welcome introduction to ES6 is the possibility for traditional setters and getters, like in many other OOP languages. 

The syntax is as follows:

```
class Animal {
    constructor(name) {
        this._name = name;
    }

    get name() {
        return this._name
    }

    set name(value) {
        this._name = value;
    }

    eat() {
        return `${this.name} consumed food from ${this.location}.`;
    }
}

class Mammal extends Animal {
    constructor(name, location) {
        super(name);
        this.location = location;
    }
}

var mammal = new Mammal('Cow', 'farm');

console.log(mammal.name); // Cow

mammal.name = 'Bobby';

console.log(mammal.name); // Bobby
```

The naming convention when using setters and getters is to prefix the relatable variable with an *underscore*. It's an attempt to keep private data in the properties whose names are marked via the prefixed underscore. But unfortunately, it doesn't hold true protection. As I can still directly access that variable even if I removed the getter method, and then just called it by the underscore:

`console.log(mammal._name); // Bobby`

**Subclassing Builtins**

A very powerful feature that was introduced to ES6, is the ability to extend the already built in data structures of the language. As has been shown, JS allows the extension of our own custom classes. But the real power comes from innovating new features into *JS native objects*. Here's an example that adopts all the existing methods of the Array type object, but with an additional twist:

```
class ExtendedArray extends Array  {
    alter() {
        let originalArray = [];
        this.forEach(value => originalArray.push(`${value} is now in the subclass ExtendedArray`));
        return originalArray;
    }
}

let testingArray = new ExtendedArray();

console.log(testingArray instanceof Array); // true

testingArray.push(1);
testingArray.push(2);
testingArray.push(3);

console.log(testingArray); // ExtendedArray [ 1, 2, 3]

console.log(testingArray.alter());

/* [
   '1 is now in the subclass ExtendedArray',
   '2 is now in the subclass ExtendedArray',
   '3 is now in the subclass ExtendedArray'
 ] */

let regularArray = ['Timmy', 'Phil', 'Bob'];

console.log(testingArray.alter().concat(regularArray));

/* [
   '1 is now in the subclass ExtendedArray',
   '2 is now in the subclass ExtendedArray',
   '3 is now in the subclass ExtendedArray',
   'Timmy',
   'Phil',
   'Bob'
 ] */
```

As you can see, the instance variable `testingArray` is still of the object type `Array`. That's because the class `ExtendedArray` is a child of the native object `Array`. What I've done here is make a hybrid class that is capable of implementing features that did not originally exist for that object type, while at the same time be capable of calling native methods, like concatenating regular arrays into this extended array.

**Symbols**

Here's another feature to talk about from ES6. So symbols are basically a new primitive type, and even though they're not objects, I want to briefly discuss the logic behind them as they are great companions to objects. Now the major point of focus for symbols is that they provide unique identifiers. The interesting thing about them is that generally, you don't see the identifier itself. You only have the symbol, and not a key. When you're defining a symbol, it kind of looks like a class is being declared. But don't be fooled, there is no '`new`' keyword when declaring a symbol, it's still a primitive:

```
let symbol = Symbol('debug');

console.log(symbol); // Symbol(debug)

console.log(typeof symbol); // symbol
console.log(symbol instanceof Object); // false
```

As I briefly mentioned, *symbols* are also unique to one another, so to show this I'll make another symbol with the same description value:

```
let anotherSymbol = Symbol('debug');

// comparing just value here, but result is the same if I compare with ===
console.log(symbol == anotherSymbol); // false

Symbols are also great in conjunction with objects:

class Person {
    constructor(name, age) {
        this.name = name;
        this.age = age;
    }
}

let person1 = new Person('John Doe', 38);

// create a Symbol that holds a unique ID;
let a1b2c3d4e = Symbol('debug_balance'); // the description value is used only for debugging purposes

// create a hidden Object Field to Person instance, where "key" = Symbol
person1[a1b2c3d4e] = 99999.99;

// no access to hidden Field data
console.log(person1); // Person {name: 'John Doe', age: 38, Symbol('debug_balance')}
console.log(person1.debug_balance); // undefined
console.log(person1[debug_balance]);  // ReferenceError: debug_balance is not defined

// but if we know a variable that contains a unique id, we get access to its custom assigned data
console.log(person1[a1b2c3d4e]); // 99999.99

// outputting Symbol in GlobalScope will just return its description
console.log(a1b2c3d4e); // Symbol(debug_balance)

// we can see Symbol in the GlobalScope, but we don't have access to its declared data

// using Special Methods to point out its hidden properties:

console.log(Object.keys(person1)); // [ 'name', 'age' ]

console.log(Object.getOwnPropertySymbols(person1));  // [ Symbol(debug_balance) ]
```

As you can see from the example above, none of the calls that were associated to the symbol, or the object, returned the value of the hidden field data. Even when I associated methods that output all the keys and symbol properties of an object, there was no mention of `a1b2c3d4e` or its value. And it's for this unique purpose that symbols are used in ES6.

They are great utilities for metaprogramming, and there can also be different formats when pointing to symbols, like multiple associations:

```
let symbol1 = Symbol.for('age'); // allows me to create multiple symbols that share the same id
let symbol2 = Symbol.for('age');

console.log(symbol1 === symbol2); // true, in both value and type
```

Here's an example that may be of more use to why you'd want to do something like multiple associations to a symbol:

```
let person = {
    name: 'Juan'
};

function makeAge(person) {
    let ageSymbol = Symbol.for('age');
    person[ageSymbol] = 29;
}

makeAge(person);

console.log(person[symbol1]); // 29
```

So now I'm able to access the `age` value by calling the variable `symbol1`, to the `person` object. Before, this variable had no valued association, until it was then parsed in the function `makeAge` (which relates to the same described symbol '`age`'). Even though the `ageSymbol` here is not accessible outside of the function, it refers to the same key as `symbol1` and `symbol2` declared earlier above. If I was to exclude the `for` statement in either of the symbol assignments, or in the `makeAge` function, they would no longer associate themselves to each other. That's because symbols are unique in nature, and unless they are declared in a `for` statement, no two symbols are alike. 

There are also *well-known symbols*, as they call them. They are symbols which are already defined by JS, and they each offer some unique core functionalities to your code. There are quite a lot of them, but I'll show you one here as a starter example:

```
let numbers = [1,2,3];

console.log(numbers +1); // 1,2,31

// this symbols field type converts an object into a primitive
numbers[Symbol.toPrimitive] = function () {
    return numbers[numbers.length - 1] ;
};

// its a unique id, or shared id that can be accessed through this field
console.log(numbers); // [ 1, 2, 3, [Symbol(Symbol.toPrimitive)] ]

console.log(numbers +1); // 4
```

To explain what happened above, I first sample the `numbers` variable by trying to add an integer to the array. What results in happening is simply appending that value of `1` to the *last* index of the array. Now if I instead had meant to add up those two numbers, then I can make use of the well-known symbol `toPrimitive`. This converts an object into a primitive, meaning that the value at the last index of the numbers array is turned into a primitive, so it's now capable of being manipulated by another primitive (adding the 1 in this case). 

That's exactly what ends up happening, as the internal function that I assigned to the symbol now converts the `numbers` variable array value type. This feature is now unique to just the variable called `numbers`.

If you'd like to see the full list of well-known symbols, visit [mozilla](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol#Well-known_symbols).

**Object Assignment Methods**

I want to show you an important object method that ES6 has brought to the table. It's called the *assign* method, and just like its name, its intention is to assign objects to variables during declaration. I'll start off with a simple example:

```
let obj1 = {
    a: 1
};

let obj2 = {
    b: 1
};

let obj = Object.assign(obj1, obj2);

console.log(obj); // { a: 1, b: 1 }
```

In the above snippet, I copy the properties and values from one or more source objects, onto another target object. Now an interesting question to consider, is what happens if I merge two objects that have different constructors, and so therefore have different *prototypes*?

```
class Obj3 {
    constructor() {
        this.a = 1;
    }
}

class Obj4 {
    constructor() {
        this.b = 2;
    }
}

var obj3 = new Obj3();
var obj4 = new Obj4();

var obj5 = Object.assign(obj3, obj4);

// the question now is what is the prototype of the assigned object (obj5)?

console.log(obj3 instanceof Obj3); // true
console.log(obj4 instanceof Obj4); // true

console.log(obj5 instanceof Obj3); // true
console.log(obj5 instanceof Obj4); // false
```

As shown above, it recognized `obj5` to be an instance of the first object (`obj3`) passed into the assign method. This would then make one expect `obj5` to also be an instance of `Obj4`, but that's not what ends up happening:

```
// checking prototype comparisons
console.log(obj5.__proto__ === Obj3.prototype); // true
console.log(obj5.__proto__ === Obj4.prototype); // false
```

It's important to understand that when using the `assign` method, the first object argument that is passed to it will become the *base object*. Which means it has its prototype, and is also an instance of the class that it's assigning itself to.

The rest of the objects that are followed up as arguments in the method, will actually be merged into that first object type. So to clarify, you're not actually creating a whole new object class, you're simply *adding* on to the association of that first object type class.

A little fun fact to be aware of is that if you pass in an empty object argument to the assign method, that newly assigned object will then become a child of the base Object class:

```
let obj6 = Object.assign({}, obj3, obj4); // first object argument is empty

console.log(obj6 instanceof Obj3); // false
console.log(obj6 instanceof Object); // true

console.log(obj6.__proto__ === Obj3.prototype); // false
console.log(obj6.__proto__ === Object.prototype); // true
```

Now another new method added to the object class, which is also involved in this current conversation of object assignment, is the `setPrototypeOf` method.

If you remember from my previous discussions, I could also use the `Object.create` method to set the *prototype* of an object. The only problem with *create* is that it's set during object creation, while on the other hand, using `setPrototypeOf` sets it after the object has already been created:

```
let person = {
    name: 'Juan'
};

let robot = {
    name: 'RoboCop'
};

console.log(person.__proto__ === Object.prototype); // true

Object.setPrototypeOf(person, robot);

console.log(person.__proto__ === Object.prototype); // false
console.log(person.__proto__ === robot); // true
```

If you're curious as to why I didn't compare the prototype of `robot` to the prototype of `person`, it's because the prototype of `person` is `robot` itself (and not robot's prototype)! This occurred when I set it via Object.setPrototypeOf(...)

Another interesting thing to recognize is that if I were to remove the property `name` from my `person` object, and I outputted the object to the console with the `name` argument appended to it, I'd get '`RoboCop`' returned to me. That's because JS can't find this `name` property on the object itself, therefore it moves up to its prototype, which does contain a property value of `name`; so it returns that as the default.

**Sets**

As you have gotten to notice by now, ES6 has brought with it some unique ways to store values for objects and primitives as well. One of them being the interesting object class *Set*.

This object class lets you store unique values of any type, whether primitive values or object references:

```
// you can initialize a set by just passing in an array of values
let set = new Set([1,1,1]);

// If I try to loop through the elements of a set

for (element of set) {
    console.log(element); // 1
};
```

I'm guessing that at first you may have thought the output of the iterator to be all 1's, but because the object set has repetitive values, it only outputs one of them. This is the result of `Set` objects only focusing on *unique* values, so the ordering of a set doesn't matter too much to its logic.

I can also add values to the object if required:

```
set.add('turkey');

console.log(set); // Set { 1, 'turkey' }
```

Note how it still outputs a single 1 instead of the three in total I had assigned. `Set` also comes with the `clear` method that can get rid of all stored data in the object:

`set.clear; // Set {}`

Now in order to get a particular value that's stored in the object, you need to use the `has` method:

`console.log(set.has('turkey')); // true`

Because set objects are *lists of values*, selecting an option is relative to a true or false. You don't need to retrieve it in the traditional sense as it stores values in a unique listing; so if it's in there, then you already have access to it.

You should be aware that if you try traditional iterator methods, like `entries()`, `keys()`, `values()`, they will all output the same pairs. As I mentioned, set objects only store *values*, so both *keys*, and *values* have the same type of data.

Now there are also WeakSet(s), which are more memory efficient counterparts to its relative, Set. You should know however, that they can only store objects. As objects are more capable in terms of [garbage collection](https://javascript.info/garbage-collection), as well as to determine if they are still in use:

`let weakset = new WeakSet([{a:1}, {b:1}, {b:1}]);`

The example above creates three object entries, and even though two objects have the same property, it still stores them as different objects in memory. `WeakSet`(s) are also not *arrays*, because their items are not indexed. So each item is directly referenced by its object value, and so I can't use enumerable methods, as the objects that it stores could be garbage collected:

```
console.log(weakset.size); // undefined

console.log(weakset.get({a:1})); // weakset.get is not a function
console.log(weakset.keys()); // weakset.keys is not a function
console.log(weakset.values()); // weakset.values is not a function
console.log(weakset.entries()); // weakset.entries is not a function
weakset.clear(); // weakset.clear is not a function

// Instead what can be used is the has method:

console.log(weakset.has({a:1})); // false
```

I bet you expected that last value to be `true`. Well the reason why that's `false` is because for objects, we only store pointers to the place in memory where they actually live. That's why when I originally made the `WeakSet` object, there were actually three values stored in it. So when I'm checking if `{a:1}` is in the variable `weakset`, I'm again making a new object as the reference, so it will obviously state that it's not inside the `WeakSet` object.

The only way to determine if an object does already exist inside of a `WeakSet` is to declare the internal objects first, before inserting them to the `WeakSet`:

```
let obj1 = {a: 1};
let obj2 = {b: 1};

let weakset2 = new WeakSet([obj1, obj2, obj2]);

console.log(weakset2.has(obj1)); // true
```

In this case, unlike my first `WeakSet`, only the first two objects get added to `weakset2`. Because now the second and third objects are indeed references to the same saved element in memory. With WeakSet(s) I'm also able to add new objects, or delete them:

```
let obj3 = {c:1};

weakset2.add(obj3);

console.log(weakset2.has(obj3)); // true

weakset2.delete(obj3);

console.log(weakset2.has(obj3)); // false
```

**The Reflect API**

The Reflect API introduced by ES6 could be described as a collection, or “central place” which houses all kinds of objects and functions (for creation, property management etc.). Some of the functionalities added to the `Reflect` object were available before on the `Object` constructor. But the goal for the future is to have one central place to store all of those methods – the Reflect Object/API. Therefore, the Reflect API provides useful methods to create, manipulate and query objects and functions in your JavaScript project.

The static `Reflect.construct()` method acts like the *new* operator, but as a function. In order to create a new object in the reflect API, it's quite simple:

```
class Person {
    constructor(name) {
        this.name = name;
    }
}

// Takes in the class as the first argument, second parameter holds argument array related to constructor
let person = Reflect.construct(Person, ['Juan']);
console.log(person instanceof Person); // true

// If I then make a constructor function, and then pass it in as an argument in the Reflect constructor:

function topObj() {
    this.nationality = 'Colombian';
}

let person2 = Reflect.construct(Person, ['Juan'], topObj);
console.log(person2 instanceof Person); // false
console.log(person2.__proto__ == Person.prototype); // false
```

This will result in an override of `person2`'s object prototype, which is created by default to be `Person.prototype`. The prototype is not `topObj` either, it's in fact the `topObj.prototype`:

```
console.log(person2.__proto__ == topObj); // false
console.log(person2.__proto__ == topObj.prototype); // true
```

Take note that although the `topObj` contains an already defined parameter (`this.nationality = 'Colombian'`), you will need to set its value on the object `person2`, as `topObj` is not the same object as `person2`, it's only *extending* the property usage of `person2` to now have a parameter that also accepts a nationality.

Now in order to call methods in a `Reflect` object, I can still use `bind()`, `apply()`, or `call()`. But `Reflect` introduces a more dynamic way to call using the `apply` method:

```
Person.prototype.greet = function () {
    console.log(`Hello, my name is ${this.name}.`);
};

let person3 = new Person('Bill');

Reflect.apply(person3.greet, person3, []); // Hello, my name is Bill.
```

Apply takes in several parameters, the first being the *method* that will be called on the chosen instance. The second parameter is the state of the '`this`' keyword, so for here I'm referring to `person3`'s '`this`'. If I didn't do that, and just passed in some other object instead, then I would get '`undefined`' returned to me (where the '`this.name`' placeholder was in the method string). Finally, the last parameter is for inputs that may be passed in to the chosen method's arguments. In this case the `greet` method requires no passed in parameters, so it's an empty array.

I can also retrieve certain object parameters by using the `get` method with `Reflect`, as well as set new values to those properties:

```
console.log(Reflect.get(person3, 'name')); // Bill

// first argument for set is the chosen object, second is the property, third is the new value
Reflect.set(person3, 'name', 'Todd');

console.log(Reflect.get(person3, 'name')); // Todd
```

You can also find out what sort of properties or methods may even exist inside of an object, by using the `has` method. This method takes in an object and a property name as its parameters:

`console.log(Reflect.has(person3, 'greet')); // true`

A very handy tool that broadens this search even more is the `ownKeys` method, which will output all of the containing properties of the object (but not its methods):

`console.log(Reflect.ownKeys(person3)); // [ 'name' ]`

After going through those examples, you can rest assured that there is also a way to add new properties to a `Reflect` based object, using the `defineProperty` method:

```
Reflect.defineProperty(person3, 'age', {writable: false, value: 29, configurable: true});

console.log(person3.age); // 29

Reflect.set(person3, 'age', 27);

console.log(person3.age); // 29

// using Reflect(s) deleteProperty method instead of the standard 'delete' keyword
Reflect.deleteProperty(person3, 'age');

console.log(person3.age); // undefined

Reflect.set(person3, 'age', 27);

console.log(person3.age); // 27
```

The `defineProperty` method takes in three parameters. The first is the object in question, the second is the name of the property that will be created (formatted as a string). And finally, the third option is an object that offers properties for setting the privacy of the value, the value you want for it, and its availability for configuration.

In terms of the value's privacy, if you set writable to `false`, then not having a value already inputted inside that object parameter will then result in an undefined value. For the configurable property, it allows you to specify if one should be able to change all of the third parameter's object configurations once it has been created. You can think of it as a backup, in case there is a change of heart for what you initially set for the new property (like making writable true again by deleting the original value, using the `deleteProperty` method).

If for some reason however, you didn't want an object to have the opportunity to be extended with new methods or properties, we'd then use the `preventExtensions` method:

```
Reflect.preventExtensions(person3);

// isExtensible allows me to check if an object has not been locked from extension
console.log(Reflect.isExtensible(person3)); // false
```

This would then lock the object from accepting new `defineProperty` calls on it. So if I made a brand new property, and then tried calling it on the object, I would get an `undefined` returned to me; as it never accepted the `defineProperty` in the first place.

Going back to prototype associations, Reflect includes an interesting method that can help in finding out this particular question:

```
console.log(Reflect.getPrototypeOf(person3)); // Person { greet: [Function] }

// I can also set the prototype of the object
let proto = {
    name: 'Dan'
};

Reflect.setPrototypeOf(person3, proto);

console.log(Reflect.getPrototypeOf(person3)); // { name: 'Dan' }
```

Of course class *Object* itself does also contain these prototype methods, as I had already previously shown. But again, *Reflect* is also a central place which can handle dynamic object configurations. So we might as well use it with this object type too. The main selling point to be aware of, is that it offers the user an opportunity to have more control over the state of an object's `this` keyword. Not to mention the extendable customizations, as was shown with the `defineProperty` method.

Having that kind of control can become handy when you want to be sure that you are indeed accessing the JS object that you were expecting, along with the appropriate behavior that you set for it.

**The Proxy API**

The Proxy API allows you to wrap objects, functions, and handle incoming property accessing, function calls etc. You may think of Proxies as a filter which has to be passed into, and can be made to interrupt access on a wrapped element for additional content manipulation.

*Proxy* constructors expect two arguments, the first is the *target*, the second is the *handler*, which contains the logic of the proxy wrapper. The `handler` object can define any of the available *traps*, which are methods that provide *property access*. This is analogous to the concept of traps in operating systems. These traps also happen to be the same methods that the *Reflect API* contains, they are just declared in an object (`handler`) property function instead. This can make *Proxy* and *Reflect* good companions to one another as we'll see.

```
let person = {
    name: 'Juan'
};

let handler = {
    // using the handler.get() method trap for getting a property value
    get: function (target, name) {
        // using 'in' operator as a boolean
        return name in target ? `target is an object that contains the property value: ${target[name]}` : 'No such property exists';
    },

    // using the handler.set() method trap for setting a property value
    set: function (target, property, value) {
        if (value.length > 2) {
            // using Reflect.set in conjunction with the Proxy handler
            Reflect.set(target, property, value);
        } else {
            console.log('Your name needs to be at least 3 characters long');
        }
    }
};

var proxy = new Proxy(person, handler);

console.log(proxy.name); // target is an object that contains the property value: Juan

// for reference
console.log(person.name); // Juan
console.log(person['name']); // Juan

proxy.name = 'JG';

console.log(proxy.name); // Your name needs to be at least 3 characters long
                                               // target is an object that contains the property value: Juan
```

Since the proxy acts as a wrapper, it's like calling it on the object itself. With that extra wrapper becoming a layer that contains several traps. This particular example also points out the key difference between the default *getter/setter* and the `Proxy` *getter/setter*. With that created object `handler`, I can use the getter/setter on any valid object, while the default getter/setter would end up having to be *bound* to a class. You probably also noticed the cool thing about using traps and Reflect API methods. They use the same logic and arguments, which makes dual interaction very easy.

Another interesting thing to consider is having a proxy become the prototype of any object. Here I am now making a vanilla proxy object with no target, so that I can dynamically generate it to any type of object as you'll soon see.

```
var proxyProto = new Proxy({}, handler);

console.log(proxyProto.name); // No such property exists
console.log(Reflect.getPrototypeOf(person)); // {}
console.log(Reflect.getPrototypeOf(proxy)); // {}
console.log(Reflect.getPrototypeOf(proxyProto)); // {}
console.log(person.prototype === proxyProto.prototype); // false
```

So how do I make it compatible with objects that are not related it? Well I can set this default proxy as the *prototype*, so that I can then make unrelated objects have the opportunity to be extended through it.

```
// set prototype of person to become the empty proxy object 'proxyProto'
Reflect.setPrototypeOf(person, proxyProto);

console.log(Reflect.ownKeys(person)); // [ 'name' ]
console.log(Reflect.ownKeys(proxy)); // [ 'name' ]
console.log(Reflect.ownKeys(proxyProto)); // []

// setting a value for the name property on the prototype as a reference
proxyProto.name = 'Stark';

// creating a new property for the prototype that is not from the original object 'person'
Reflect.defineProperty(proxyProto, 'age', {writable: false, value: 48, configurable: true});

console.log(proxyProto.name); // target is an object that contains the property value: Stark
console.log(proxyProto.age); // target is an object that contains the property value: 48
console.log(Reflect.getPrototypeOf(person)); // { name: 'Stark' }
console.log(Reflect.getPrototypeOf(proxy)); // { name: 'Stark' }
console.log(Reflect.getPrototypeOf(proxyProto)); // {}
console.log(person.prototype === proxyProto.prototype); // true
```

As you can see, both the `person` and `proxy` objects get the `proxyProto` reference returned as the set prototype property. If you're wondering why the '`proxy`' object is assigned as well it's because it was a referenced proxy to the `person` object. That's one of the unique techniques that can be used with the `Proxy` class. You can assign proxies as prototypes, add new features to it that the original objects didn't have, and the prototype will still waterfall through its associated siblings.

```
console.log(Reflect.ownKeys(person)); // [ 'name' ]
console.log(Reflect.ownKeys(proxy)); // [ 'name' ]
console.log(Reflect.ownKeys(proxyProto)); // [ 'name', 'age' ]
```

If by this point you were wondering if its also possible to wrap a proxy as the prototype to a proxy, then the answer is also yes:

```
let protoHandler = {
    // using the handler.get() method trap for getting a property value
    get: function (target, name) {
        return `Calling 'proxy' object handler from proxyInProxy's protoHandler: [${target[name]}]`;
    }
};

var proxyInProxy = new Proxy(proxyProto, protoHandler);

Reflect.setPrototypeOf(person, proxyInProxy);

proxyInProxy.location = 'USA';

console.log(proxyInProxy.location); // Calling 'proxy' object handler from proxyInProxy's protoHandler: [target is an object that contains the property value: USA]
console.log(Reflect.ownKeys(proxyInProxy)); // [ 'name', 'age', 'location' ]
console.log(Reflect.getPrototypeOf(person)); // { name: 'Stark' }
console.log(Reflect.getPrototypeOf(proxy)); // { name: 'Stark' }
console.log(Reflect.getPrototypeOf(proxyInProxy)); // {}
console.log(person.prototype === proxyProto.prototype); // false
console.log(person.prototype === proxyInProxy.prototype); // true
```

As I have shown you, it's quite a common practice to use `Reflect` related calls with `Proxy` because of their similarities. Take the apply method for example:

```
function warning(data) {
    if (data >= 201) {
        console.log(`File is worth ${data}mb, it's too large to upload`);
    } else {
        console.log(`File is ${data}mb and has been uploaded`)
    }
}

const funcHandler = {
    apply: function(target, thisArg, argumentsList) {
        if (argumentsList.length <= 200) {
            return Reflect.apply(target, thisArg, argumentsList);
        }
    }
};

var funcProxy = new Proxy(warning, funcHandler);

// calling the proxy object like a function
funcProxy(201); // File is worth 201mb, it's too large to upload
```

Notice how I don't directly call the `apply` method on the proxy either, it's referenced on its own simply by the logic that I built on the handler. All it needs is an argument to be attached to the proxy as if it was a function call with a set parameter. This quickly shows us the easy to use capabilities of executing assigned functions, within a proxy object. It's a natural way to not only wrap objects and use traps to regulate logic, but it can also be used to make sure that function calls work the way you expect them to.

**Proxy Revocable**

So far I've shown you default proxies, but there's another format for them called *revocable proxies*. That means that after you set up a proxy as a wrapper, you can remove added functionalities if you so desire. You can't however, make previous related code undone, but you can make sure that the proxy is no longer active after you call revoke.

`Proxy.revocable` returns to me an object which has a proxy and a remote field. The proxied object is the first argument, and the field can be a handler for logic. Once a revocable object is created, it automatically contains two properties. One is '`proxy`' which can be appended to its variable declaration to call on its original passed in parameter (`animal` in this case). The other is `revoke()`, which nullifies any further actions that would be involved with the `Proxy.revocable` object. Let me show you a quick example:

```
let animal = {
    name: 'Cat'
};

// assigned object animal, and a built-in handler as the parameters for the Proxy.revocable variable
let revocable = Proxy.revocable(animal, {
    get: function(target, name) {
        return Reflect.get(target, name);
    }
});

// assigning the revocable.proxy method to variable pet in order to reference object animal
let pet = revocable.proxy;

console.log(pet.name); // Cat

// called the revoke() method from revocable, which now voids any actions to its references
revocable.revoke();

console.log(pet.name); // TypeError: Cannot perform 'get' on a proxy that has been revoked
pet.name = 'Dog';        // TypeError: Cannot perform 'set' on a proxy that has been revoked
delete pet.name;         // TypeError: Cannot perform 'deleteProperty' on a proxy that has been revoked
typeof pet;                  // 'Cat', typeof doesn't trigger any trap
```

As you can see, using the revoke feature can be handy for removing a proxy after a certain triggered event has occurred.

**Wrapping Up**

This guide covered all of the major stepping points in object oriented JavaScript. While it may have been a long and successive read (it was a long and studied write up for me too!) it will certainly give you a leg up compared to others when comprehending the more obscure fashions of OOP for this language. I personally know that I will be using this dearly written guide as a back and forth reference for when I may need a refresher; so as to remind myself just how different the roadmap is when taking a trip to (JS) object oriented land!

If you are still curious to learn even more, here are some topics of further interest:

* [Generators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*)
* [Dependency injections](https://dev.to/kayis/dependency-injection-in-javascript-4km)
* [Maps](https://stackoverflow.com/questions/18541940/map-vs-object-in-javascript)

> This concludes the Approaching Object Oriented JavaScript series
> 
> Thanks so much for reading!

~Juan
