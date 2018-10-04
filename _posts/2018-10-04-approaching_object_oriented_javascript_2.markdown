---
layout: post
title:      "Approaching Object Oriented JavaScript (§ 2)"
date:       2018-10-04 12:13:59 -0400
permalink:  approaching_object_oriented_javascript_2
---

> Author's Note: This is a mini series, which will host a comprehensive outline of integrated object orientation within JavaScript versions ES5 and ES6 respectively.
> 
> §2 Topics:
> 
> 1. Function Scope
> 1. JavaScript Function Closures
> 1. Immediately-Invoked Function Expression
> 1. Constructor Functions
> 1. Inheritance/Prototype Chains
> 1. ES5 Helper functions and introducing ES6
> 1. Hoisting in ES6
> 1. Fat Arrow Functions

In the [*previous installment*](http://imjuan.com/approaching_object_oriented_javascript_1) to this series, I went over ES5 related subjects on the introductory blueprint of a JavaScript object. There were various easy to follow discussions on properties and functions. As well as the different ways to interpret their uniquely contained information.

To refresh the memory a bit more to where we had left off, I was discussing the concept of an object's *self* (or `this` in the case of JS). Using its association to confer an object's relation, `this` helps us to know the current state of an object. This state, is by traditional OOP standards, found within a block based scope. JS likes to keep you on your toes however, since its scope is actually termed through functions instead.

**Function Scope**

So JavaScript variables have function scope; which differs from other OOP based languages where it's actually a block based scope. Let's make an example here:

```
function  scopeTest() {
    if(true) {
        var foo = 'bar';
    }
    console.log(foo);
}
```

Now in other OOP languages, the above would fail to compile because `foo` is defined inside the block of the `if` statement. And if the condition was *false*, the console would be trying to return a variable that *never existed*, so it would error out.

But in JavaScript there is function scope. So `foo` is defined within the function `scopeTest`. Therefore it's available throughout the entire function. We can verify this by running the function:

`scopeTest(); // bar`

The way that JS manages function leveled scope is through a process called *hoisting*. Variable declarations are always hoisted to the top of a function, but not the variable assignment.

So when JS goes to evaluate `scopeTest()`, the first thing it does is hoist all the variable declarations (not *assignments* just the *declarations*). To get a visual of what this means for the function, JS will parse through the syntax and it will see a variable declaration inside of the `if` statement. The variable `foo` is being declared, so JS will take that declaration, and it will hoist it to the top of the function:

```
function  scopeTest() {
    // var foo;
    if(true) {
        var foo = 'bar'; // the assignment isn't hoisted, just the declaration, so the var here would be excluded
    }
    console.log(foo);
}
```

This should make it more clear on how `foo` is still available to the console log, even though it's declared inside of a conditional statement. Because it hoisted the declaration to the function level scope.

Something that can also easily trip one up is unintentionally masking variables in outer scopes:

```
function scopeTest2() {
    var msg = 'unlucky';
    [1, 2, 3, 4, 5].forEach(function (n) {
        if(n < 3) return console.log(n + ':' + msg);
        var msg = 'lucky';
        console.log(n + ':' + msg);
    });
}

// How we expect this function to work is that it will print 1 and 2 with 'unlucky', then 3, 4, and 5 with 'lucky'

scopeTest2();

// 1:undefined
// 2:undefined
// 3:lucky
// 4:lucky
// 5:lucky
```

You see however, that we get `undefined` for 1 and 2. The problem resides with there being an *anonymous function* declared inside of the `forEach` loop. So all the variables inside of that anonymous function, have function scope. So let's employ the rules of hoisting, and see how JavaScript would rewrite this:

```
function scopeTest3() {
    // var msg;
    'use strict';
    var msg = 'unlucky';  // the var here would be excluded as msg declaration is hoisted to top
    [1, 2, 3, 4, 5].forEach(function (n) {
        // var msg;
        if(n < 3) return console.log(n + ':' + msg);
        var msg = 'lucky';  // recognizes a variable declaration, so the var here would be excluded and msg gets hoisted to top of inner function
        console.log(n + ':' + msg);
    });
}
```

Now it's a little more clear why the first two numbers are returning as `undefined`, because right after the `forEach`, inside the anonymous function, it declares a new variable `msg`, which ends up masking the variable in the outer scope. And by default, new variables have an assigned value of `undefined`.

This brings into consideration the `let` variable; `let` declares variables in a *block scope* instead of the *function scope*:

```
function scopeTest4() {
// function-level strict mode syntax
    'use strict';
    if(true) {
        let foo = 'bar';
        console.log(foo);
    }
     console.log(foo);
}

scopeTest4(); // ReferenceError: foo is not defined
```

JS tells us that `foo` is *undefined*. That's because `let` informs JS that the variable `foo` is in a block scope, and will exist only in the block made up by the `if` body. You'll also notice that I have a `use strict` directive. This tells JS that it should *use strict language parsing*. If you want to use `let` in JavaScript engines that support [harmony](https://www.quora.com/Why-is-ES6-called-ES-harmony), you'll have to use `'use strict'`. With strict mode, you can't for example use *undeclared* variables (meaning they have no preffix of `var`/`let`).

Another thing that is good to be aware of is the creation of *implicit* global variables. If you forget to declare a variable within a function (adding a prefix statement), you are creating an implicit global. In general, global variables are considered to be a bad practice. They can create side effects that are hard to track down, and can lead to fragile, and unmaintainable code:

```
function scopeTest5() {
foo = 'global';
}

// if I call scopeTest5 I would expect foo to be defined, and live entirely within the scope of the function

console.log(scopeTest5()); // undefined

// as you can see, that's not what happens, it is in fact undefined

// since I omitted the var/key keyword, JS assumes that I wanted a global variable

console.log(foo); // global
```

Alas, that is what ends up actually returning. Not as `undefined`, but rather in the *global scope*.

Implicit globals are generally a terrible idea, and it's widely considered to be one of the weaknesses of JavaScript. One way to prevent this from accidentally happening is to always use `'use strict'`. If you simply must modify a global variable, then you should make it explicit by naming the global object in a *browser*, which is traditionally defined as `window`.

**JavaScript Function Closures**

One aspect of object oriented programming that JavaScript doesn't natively support is *data hiding*. In most object oriented languages you can declare a method or a member variable to be restricted somehow, such as *private* or *protected*. 

Although JS doesn't allow you to mark object properties as private, data hiding is often accomplished in JS through the usage of *closures*. In addition to being a benefit for data hiding, understanding closures can be essential, just to comprehend how most modern JS code works.

Whenever you're inside of a *function*, you're inside of a *closure*. As long as that closure exists, its variables also exist:

```
function closure() {
    var insideClosure = "Inside of the closure.";
    return function () {
        console.log(insideClosure);
    };
}

console.log(closure()); // [Function]

var fn = closure(); // saving function to variable fn

console.log(fn); // [Function]

// invoking fn as a function below, by adding parentheses

fn(); // Inside of the closure
```

Now what's interesting is that normally when inside of a function, you'd think of variables lasting only for the scope of the function call; and then disappearing. For example if I didn't do anything special inside of the `closure` function, the variable `insideClosure` would be released after the function finished executing.

But since it returns an *inner function* that accesses that same variable, JS knows it has to keep it around, since it doesn't yet know when that function might be called. In a way, it has captured a value inside of this closure. And JS will keep that variable in memory until there's nothing left pointing to it.

Another consequence of the closure is that I can't actually get at the variable `insideClosure`. I can see its value if I call
the function that was returned from the closure function, but I can't modify it. In essence, that variable has been hidden from us by the *closure*.

I can however, leverage this ability in order to create a hybrid form of a private variable or object. Let's use this concept to create a function that counts the number of times it's been invoked:

```
function getCounterFn() {
    var count = 0;
    return function (arg) {
        if(arg === 'reset') {
            count = 0;
            console.log('counter reset.');
        } else {
            console.log('function called ' + ++count + ' times.');
        }
    };
}

// reassigning fn to the new function

var fn = getCounterFn();

fn(); // function called 1 times.
fn(); // function called 2 times.
fn(); // function called 3 times.
fn(); // function called 4 times.

fn('reset'); // counter reset.
```

What's interesting about this output, is that there is no way for me to alter that `count` variable from what it was originally intended to report. I can't mess it up, or interfere with it. It will always accurately report the number of times it's been called, just as the function intended it to. The only way to change it is by activating the conditional `reset`, which again is only accessible to operating within its own scope.

So you can see in this example, that by using an enclosure, we can actually create variables that are only reachable by what that function's closure chooses to expose to us. This methodology can then be adopted into object oriented programming for JS, in order to create a sort of hidden private variable.

**Immediately-Invoked Function Expression**

When the JavaScript parser encounters the `function` keyword, it usually assumes we’re writing a function declaration, unless we explicitly tell it that we’re not. The way to tell it that we're not is by wrapping the function in parenthesis, this tells JavaScript to parse it as a *function expression*, and not a *function declaration*. To call it however, you set a pair of parenthesis immediately after the function declaration, which will then invoke the function:

```
function countdown() {
    var i;
        for(i=5; i>0; i--) {
            (function (icaptured) {
                setTimeout(function () { console.log(icaptured); }, (5-icaptured)*1000);
            })(i);
        }
}

countdown();

// 5
// 4
// 3
// 2
// 1
```

In this function declaration of `countdown()`, there's a `for` iterator which contains a parenthesis enclosed *anonymous function*. If I didn't *encapsulate* that anonymous function, it would instantly error out. Because it would think that I made a typo by forgetting to name it's declaration, like so for example: `function someName(){  }();` 

Inside of this *encased anonymous function*, there's a `setTimeout` method that logs the iterator. At the end of the anonymous function declaration, there's the *invocation*. Which sets the argument of `i` from `var i;` into what will be passed into `icaptured`. `icaptured` doesn't have to be named that ofcourse, it could be anything, even `i`. 

The good part is that you wouldn't have to worry about *variable masking* either, because by enclosing that anonymous function within those parenthesis, `icaptured` has become a different variable from the outside `i`. So when `setTimeout` eventually calls it, the variable becomes a valued copy of the outer scoped `i`. Which is then stored and captured at that specific moment in time, but in a different closure.

This is what IIFE is, and it can be useful for *privacy*. Since in JavaScript, variables are scoped to their containing function. This means that they can’t be accessed outside of the function. Also since an IIFE isn’t *named* (a.k.a. anonymous) it can’t accidentally be called later, preventing overusage of the global namespace, and avoiding any potential security implications as a result.

Here's a simple visual reference to keep logged in thought for how an IIFE is written:

```
( function (/*...1...*/){/*...2...*/}(/*...3...*/) );

// 1: optional passed in argument
// 2: do Something
// 3: calling function with optional passed in argument
```

**Constructor Functions**

As has been previously mentioned, JavaScript doesn't have a formal concept of classes like other OOP languages do.
It does however, offer a mechanism for providing some of the same functionalities that a general class would have. Whereby a function can create object instances, that have a somewhat familial structure:

```
function Cart() {
    this.store = 'Cumberland Farms';
    this.items = [];
}
```

You probably noticed that the function name starts with a *capital letter*. Now that's some familiar territory for class name declaration. There isn't however, a keyword for a *class* when using ES5; It's still just defined as function. Another thing that's being used here is `this`, even though the function doesn't appear to be a JS method (as has been previously shown in other examples).

I already know that I can bind the special variable `this`, using `call`, `apply`, or `bind`. But JavaScript has a different intended usage for this, which is specifically aimed for class based functions. And that's for the associated relation of the `new` operator. *New* is designed to create a *new instance* of an object, using a construction function:

`var mycart = new Cart();`

Here, the standard convention is still holding true, by having the instance variable begin with a lowercase letter. It's then assigned to the `new` operator, which tells JS to treat the invocation as an object constructor related to `Cart`. Note that I also supply parentheses to `Cart`, as if it was being invoked like a normal function.

As a result, the `mycart` variable will get assigned the value of a newly generated `Cart` object. So each time that the constructor function gets called (`new Cart()`), a new `store` and `items` property also gets assigned to the newly generated `Cart` instance.

Instance variable property calling, as well as assignments, are still somewhat similar to traditional OOP conventions:

```
console.log(mycart.store); // Cumberland Farms

mycart.items[0] = 'lettuce';

console.log(mycart.items); // [ 'lettuce' ]
```

> Hint: If you omit the `new` operator while making the constructor function, it will execute in the global scope. Meaning that the variable mycart then becomes undefined, and the properties within the class (store and items) now become global variables instead of instance properties.

Now if I wanted to continue adding items to the instance property `items`, I'd prefer to have a more pragmatic way of doing it:

```
mycart.addItem = function (item) {this.items.push(item)};

mycart.addItem('potatoes'); // [ 'lettuce', 'potatoes' ]
```

By having made the `addItem` function expression, I can more easily assign new values to the `item` property. But what would happen if I made a new instance of `Cart`, and I then tried to call the `addItem` property function onto this newly made variable?

```
anothercart = new Cart();

anothercart.addItem('fish'); // TypeError: anothercart.addItem is not a function
```

This is where the *prototype* property comes in. Every function has a property called `prototype`. When you're using a function as a constructor, that *prototype* is attached to the newly created object. And that object then has access to the properties defined in that `prototype`:

```
Cart.prototype.addItem = function (item) {
    this.items.push(item);
};
```

Even though I created the `mycart` instance before I created this `prototype addItem` method, I can still call it to `mycart`:

```
mycart.addItem('tomatoes');

console.log(mycart.items); // [ 'lettuce', 'potatoes', 'tomatoes' ]
```

That's because every instance of `Cart` has a reference to the `Cart` constructor's `prototype` object, and there's only one of them. So if I add something to it or modify it, it immediately becomes available for all other `Cart` objects:

```
anothercart.addItem('fish');

console.log(anothercart.items); // [ 'fish' ]
```

Defining methods on a *constructor's prototype* has two additional advantages over defining methods in the constructor. First it's more efficient than if you define a method in the *constructor*. Specifically because the prototype ensures that functions are only defined once, and are shared by all instances of that class.

Second, if you need to modify or fix a method on the fly, without worrying about destroying and recreating existing instances, you can do so using a `prototype`.

As a general rule of thumb however, *value properties* should be added to the constructor when it's first being coded, and *methods* should be added to the constructor's prototype as they become required.

**Inheritance/Prototype Chains**

As you may know, most object oriented languages support the concept of *multiple inheritance*, where a single
class is capable of inheriting from multiple parents.

JavaScript however, does not support multiple inheritance through its prototypes. Although it can actually offer even more powerful ways to inherit functionality from other classes; depending on how you use it.

Let's establish an inheritance hierarchy:

```
function Animal() {

}

function Mammal() {

}

function Cat() {

}
```

JavaScript has a built in function called `Object.create`, which will create an assigned subclass prototype, based off of its superclass prototypes.

I'll start this example by making the `Mammal` prototype become a subclass of `Animal`:

`Mammal.prototype = Object.create(Animal.prototype);`

Note that I don't just set the `Mammal` prototype property to an `Animal` prototype. If I did just that without `Object.create`, then a `Mammal` couldn't functionally be distinguished from an `Animal`. This is because they'd end up sharing the same *prototype object*.

Now I'll make `Cat` become a subclass of `Mammal`:

`Cat.prototype = Object.create(Mammal.prototype);`

You should also be aware that the order of assignment is important. If I had done this assignment the other way around, by changing the `Mammal` prototype assignment, I'd be breaking the connection between `Mammals` and `Animals`.

Now to test some inheritance functionality:

```
Animal.prototype.eat = function () {
    return 'Food consumed!';
};

Mammal.prototype.milk = function () {
    return 'Milk produced!';
};

Cat.prototype.purr = function () {
    return 'Purrrrrr.';
};
```

So now that I have some classes in an inheritance hierarchy, with some associated property functions, let's create some class instances:

```
var milou = new Cat();

var regularMammal = new Mammal();

var regularAnimal = new Animal();


console.log(milou.purr()); // Purrrrrr.

console.log(milou.milk()); // Milk produced!

console.log(milou.eat()); // Food consumed!


console.log(regularMammal.purr()); // TypeError: regularMammal.purr is not a function

console.log(regularMammal.milk()); // Milk produced!

console.log(regularMammal.eat()); // Food consumed!
```

As you saw above, if I try to call `purr` on `regularMammal` I get an error returned. That's because only cats can purr, and `regularMammal` is a *superclass* of `Cat`, not a *subclass*. However, it can still use the `milk` and `eat` properties.

This means that for the last instance, `regularAnimal`, it can't use `purr` or `milk`, but it can `eat`. Note that when you try to access the property of an object, JavaScript walks the prototype chain *backwards*, starting with the most specific prototype.

For example, if I call `milou.eat()` Javascript then says:

Does `Cat` prototype have the `.eat()` property? *No*. Does `Mammal` prototype have the `.eat()` property? *No*. Does `Animal` prototype have the `.eat()` property? *Yes*!

This is the one exception for when *masking* is actually a preferred result, because prototypes that are lower down their prototype chain, will actually mask properties higher up in the prototype chain. Which is what we generally want anyways in terms of OOP logic.

For example, if I wanted cats to eat differently than the original inherited property:

```
Cat.prototype.eat = function () {
    return 'Cat nip consumed!';
};

console.log(milou.eat()); // Cat nip consumed!
```

And now when I call `milou.eat()` notice how this time it's pulling off the function from the nearest item in the prototype chain, which is `Cat.prototype`.

Something to realize about this example, is driving home the comprehension of a *declared inheritance*. Where all things that are considered to be objects in JavaScript (excluding the [*primitives*](http://imjuan.com/approaching_object_oriented_javascript_1) as I previously discussed) are instances of `Object`. So a typical object will be inheriting properties (and methods) from `Object.prototype` in their prototype chain. For example, `Object.prototype` defines such methods as `toString()`. So even though I didn't specifically define a `toString()` function on `cat`, I can still use that function to return a string:

`console.log(milou.toString()); // [object Object]`

**ES5 Helper functions and introducing ES6**

Some people advocate the use of what's called a *helper function*, which is intended to attach methods to class prototypes.

For example, instead of doing the following:

```
Cat.prototype.hello = function () {
    return 'Meow!';
};

Cat.prototype.goodbye = function () {
    return 'Sniff sniff';
};
```

You can instead make a helper function that mainstreams the production of various new methods, all at once:

```
Function.prototype.method = function (name, func) {
    this.prototype[name] = func;
    return this;
};

// with the helper function written above, I can make multiple associated methods to Cat like so

Cat
    .method('sleep', function () { return 'ZZZzzzZZZzzz...'})
    .method('drink', function () { return 'Sip sip...'});

console.log(milou.sleep()); // ZZZzzzZZZzzz...

console.log(milou.drink()); // Sip sip...
```

This can be handy if you have a large number of short methods to add to a class.

Another way to make a helper function is through the prototype chain, by referencing the constructor function:

```
Mammal.prototype = Object.create(Animal.prototype);
Mammal.prototype.constructor = Mammal;

Cat.prototype = Object.create(Mammal.prototype);
Cat.prototype.constructor = Cat;
```

`Object.create` copies all of the properties of its contained arguments, including the reference to its constructor function (which is used to create objects of that type). So by *explicitly* setting the value of the constructor to the intended *child class*, we correctly resolve the association of the `Mammal` constructor unintentionally pointing to the `Animal` constructor instead. So in the end, this makes sure that the constructor object is set correctly for `Mammal` and `Cat`, which it otherwise wouldn't be.

So now that I've explained that, I can make the helper function that can potentially speed up that hierarchical set up, while also making it more clear when being read:

```
Function.prototype.extends = function (superclass) {
    this.prototype = Object.create(superclass.prototype);
    this.prototype.constructor = this;
};

// with the helper function written above, I can now do this when setting a class hierarchy

Mammal.extends(Animal);
Cat.extends(Mammal);
```

Now it's become simpler to write, and is also more clear. You can see at a glance that `Mammal` is intended to be a subclass of `Animal` and `Cat` is intended to be a subclass of `Mammal`. This result is considerably faster than what was previously being done:

```
Mammal.prototype = Object.create(Animal.prototype);
Mammal.prototype.constructor = Mammal;
```

Note that the order in which this is assigned is still important, and I still have to declare them before I can add any method to the prototypes of those classes.

With the introduction of ES6 however, the syntactic sugar for OOP is much more familial. As it makes some of the obscure conditions I have written before, become a little more understandable for a JS outsider:

```
class Animal {

    constructor(name) {
        this.name = name;
    }
		
    eat() {
        return 'Food consumed!';
    }
		
}

class Mammal extends Animal {

    milk() {
        return 'Milk produced!';
    }
		
}

var animal = new Animal('Human');

console.log(animal.name); // Human
console.log(animal.eat()); // Food consumed!

var mammal = new Mammal('Cow');

console.log(mammal.name); // Cow -> name property inherited from class Animal
console.log(mammal.eat()); // Food consumed! -> eat method inherited from class Animal
console.log(mammal.milk()); // Milk produced!
```

Aside from the `name` property I set in the `constructor` of class `Animal` (which is now also inherited by `Mammal`), both of these classes are exactly equivalent to the set up and logic that I had previously written for their ES5 counterparts. The only real difference, is in how they are presented. They are simply put, much more closely related to how most other OOP languages template their syntax. 

This is obviously a good thing. But it's important to first understand the more confusing aspects of Javascript's older versions, as they are still quite prevalent out there. And you will absolutely come across them as you continue to work with JS.

**Hoisting in ES6**
 
Remember how I talked about function level scoping with a process called *hoisting*? Well to briefly refresh, JS treats all variable declarations using `var` as if they are declared at the top of a functional scope (if declared inside a function) or global scope (if declared outside of a function) regardless of where the actual declaration occurs. This is called *hoisting*. So with ES5, JS would allow a function like this one to work:

```
function  scopeTest() {
    // var foo is hoisted to top of function to declare it
    if(true) {
        var foo = 'bar'; // the assignment isn't hoisted, just the declaration, so the foo here is just assigned 'bar'
    }
    console.log(foo);
}
```

This feature causes variables to be available before they're declared.

With ES6, this logic is now pushed into a literal declaration, meaning that you can actually see when a variable is declared, and how its assignment then responds. This is certainly more favorable, because there really weren't too many huge advantages to the old approach of pulling everything up to the top, which mostly lead to bad code if you didn't know this unusual JS feature.

In order to do this however, you need to use the `let/const` statements, instead of `var`:

```
// the old way allows this to still return the value

roses = 'red';

console.log(roses);

var roses; // red

// the new way will return an error, telling us to declare the variable first

roses = 'red';

console.log(roses);

let roses; // ReferenceError: roses is not defined
```

In the end, if you really think about this, it still works with the same logic as before. And that's the core thing to keep in mind. The only difference now is that we can actually see its functionality, which makes us have to *code it in*; instead of having JS auto set it for us through *hoisting*.

**Fat Arrow Functions**

Another unique thing that ES6 has brought to the table is a new way to define functions. They are called f*at arrow functions*. They utilize a new token (`=>`) and are also *anonymous* in nature:

```
// with ES5
var multiply = function (x, y) {
  return x * y;
};

// with ES6
let multiply = (x, y) => x * y ;

multiply(3,2); // 6
```

Arrow functions can then become simple one liners, which work much like [*Lambdas*](https://en.wikipedia.org/wiki/Anonymous_function) do in other languages. By using *fat arrow functions*, we avoid having to type the `function` keyword, the `return` keyword (it’s implicit), and sometimes even *curly brackets* if only one expression is present, like it is above.

You can even exclude the beginning parenthesis if there is only *one argument* passed to the function:

```
let addToFive = n => n + 5;

addToFive(5); // 10
```

The other benefit of using arrow functions is that it reduces the confusion surrounding the `this` keyword. With ES5, we saw that when there's multiple nested functions, it can be difficult to keep track of the state of `this`. Some workarounds were using the `bind` method, or creating a closure using `var self = this`.

When using a fat arrow function, it allows you to retain the scope of the caller inside of it, so you don’t need to use any of those previous hacks:

```
<!DOCTYPE html>
<html>
<body>

<button id="button-es5">Try it</button> <!-- will output: [object HTMLButtonElement] --> 
<button id="button-es6">Try it</button> <!-- will output: [object Window] -->

<script>
    var buttonES5 = document.getElementById("button-es5");
    var buttonES6 = document.getElementById("button-es6");

    function scopeES5 () {
        document.write(this);
    }

    var scopeES6 = () => document.write(this);

    buttonES5.addEventListener('click', scopeES5); 
    buttonES6.addEventListener('click', scopeES6);
</script>

</body>
</html>
```

The above example shows that when `scopeES6` was declared (using the fat arrow function) it cemented the state of `this` as being the global object `window`. This is proven by the output it returns when clicking the button (returns `[object Window]`). But when I use the function `scopeES5`, even though it was originally declared within the global object `window`, once it's passed into another property (the `buttonES5`) it will change the assignment of `this` (returns `[object HTMLButtonElement]`). That is one of the key differences of ES5 functions, to fat arrow functions, is that it retains its state of `this`.

Something to be aware of however, is that the methods `call()`, `apply()`, and `bind()` will not change the value of `this` in fat arrow functions (In fact, the value of `this` inside a function simply can’t be changed; it will be the same value as when the function was called). If you need to *bind* to a different value, you’ll need to use a [*function expression*](https://developer.mozilla.org/en-US/docs/web/JavaScript/Reference/Operators/function).

Another thing is that they also can’t be used as *constructors*. If you attempt to use `new` with a fat arrow function, it will throw an error. Fat arrow functions, like built-in functions (aka methods), don’t have a *prototype* property or other internal methods (it's *anonymous*). And because constructors are generally used to create class-like objects in JS, you should use the new ES6 class syntax instead if you want that sort of feature.

> Stay tuned for Approaching Object Oriented JavaScript (§ 3)
> 
> And thanks for reading!

~Juan
