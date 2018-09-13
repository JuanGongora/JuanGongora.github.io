---
layout: post
title:      "Approaching Object Oriented JavaScript (§ 1)"
date:       2018-09-12 15:12:07 -0400
permalink:  approaching_object_oriented_javascript_1
---

> Author's Note: This is a mini series, which will host a comprehensive outline of integrated object orientation within JavaScript versions ES5 and ES6 respectively.
> 
> §1 Topics:
> 
> 1. JS similarities/differences to traditional OOP
> 1. Property Access
> 1. JavaScript primitives
> 1. Functions are objects
> 1. Function Properties
> 1. Method calling
> 1. Functions in functions
> 1. Using call and apply
> 1. Binding

By far JavaScript is one of the most oddly associated languages to object orientation that I have recently dealt with. Some of the things that make up its OOP logic in comparison to Ruby or PHP (which are languages I frequently use) are pretty out there. That is not to say that it isn't illogical however. At the very least, it has peaked my curiosity for comprehension. Thus I have conglomerated this introductory OOP guide into the inner fabric of JavaScript, so that it can retain my referenced sanity (and hopefully yours too!). To start it off let's make a comparison list:

**How Javascript differs from other OOP languages**

* Objects without classes are common in JS (generic objects)
* There is no formal concept of a class; classes are instead just functions that create objects (constructors)
* There are no access modifiers in JS (public, private, protected)
* JS has additional built in mechanisms for code re-use/revision, it is prototypal in nature
* Methods can be invoked as if they belonged to other objects
* Functions that aren't associated with an object can be invoked as if they were methods of an object

**How Javascript is similar to other OOP languages**

* Method/property access syntax is similar (using periods as a delimeter to access a property/method)
* JS provides an instanceof operator (also used in PHP, Ruby, etc...)
* JS provides dynamic dispatch (correct method will be applied at the correct time during runtime)
* JS offers polymorphism

Okay, now let's get to some coding.

First, to create an object you can simply use its object literal syntax:

`var o = {name: "object1"};`

This is now an object, with the property `name`, that has the value `object1` assigned to it. In JS, objects can be modified at any time.

For example, I can add the following new property to the object `o`:

`o.color = "red";`

Calling `o` would now return the following:

`console.log(o); // {name: "object1", color: "red"}`

You can also delete properties from an object:

`delete o.color; // {name: "object1"}`

**Property Access**

In JS there are two ways to access a property.

*Dot notation:*

As was sampled above i.e. `o.name; // {name: "object1"}`

*Square bracket notation (computed member access):*

`o['name']; // {name: "object1"}`

You most likely noticed that this syntax is very similar to accessing a value in an array. Keys, or properties in objects are defined as strings in this case. When a property is defined with an unusual character, such as having a number, or a non alphanumeric character, then it should be associated within a string.

For example:

`o.1name = "object2"; // {name: "object1", "1name": "object2"}`

Here the `1name` property is encapsulated within a string, while `name` is not. Irregular properties such as these, are usually accessed through square bracket notation.

For example:

`o['first name'] = "Juan"; // this property has a space in it, thus it can't be called through dot notation`

There is also a rather odd way of accessing property values from an external variable. First I'll create a variable, whose value is the property of an object:

`var prop = "1name";`

Then I call this variable into the object, inside the square brackets:

`o[prop]; // "object2"`

This in turn will return the property `1name`'s value, which is `object2` in this case. If I was to define `prop` as a string literal:

`o['prop']; // undefined`
 
JS then looks for a property called `prop` within the object, however there is no such thing, as `prop` is an external variable. So it will return as being undefined.

I can also use this style of calling to construct property names through expressions:

`o[1 + 'name']; // "object2"`

This concatenates the integer `1` with the string `name` to format the property `1name`, which returns its contained value `object2`.

**JavaScript primitives**

In JS there are only five non-object types, or primitives as they are called. They are *undefine*, *null*, *number*, *string*, and *boolean*.

It's easy to get confused however, as you can still access methods on them as you would an object.

For example:

`var s = "string";`

`s.toUpperCase(); // STRING`

So while it may appear that they are accepting global object methods, as if they were objects themselves, JS instead has object types which correspond to each primitive type (excluding *undefined* and *null*).

For example, if I try and reference the property of a string, like `s` in this case, what ends up happening is that JS creates a *String* object instance, invokes that method onto it, and then immediately discards the object.

So the variable `s` here is converted into a String object with a capital S. The method related to the String object type, `.toUpperCase()` is then called to return the value for this instantiated object, and then relates it to the variable `s`. After which the object is immediately sent to the garbage collector, leaving only its returned value from the associated non-object variable: `s`.

Very trippy in my personal opinion.

You can however create objects that correspond to the primitive types, although this is usually not a recommended practice:

```
var so = new String("string object"); // you can also construct the primitive object without using the 'new' keyword

console.log(so); // [String: 'string object']
```

As this string variable is now an object, you can assign properties to it without getting the undefined value:

```
so.isPrimitive = false;

console.log(so.isPrimitive); // false
```

On the other hand, if I had set `isPrimitive` into the var `s`, and then called it like I did above, it would have instead returned *undefined*. But again, this is not a recommended practice for primitive objects. It's best to stick to the literal versions of primitives.

> Hint: you can check the type of a variable by using the typeof command: 
> 
>```
console.log(typeof s); // string
>console.log(typeof so); // object
```

> Hint: As catalogued at the very beginning, instanceof can also help to match what a variable is related to: 
> 
> ```
console.log(s instanceof String); // false
> console.log(so instanceof String); // true
```
> 
> Useful example for implementing both:
> 
> ```
var ar = [];
> console.log(typeof ar); // object
> console.log(ar instanceof Array); // true
> console.log(ar instanceof Object); // true
```
> That's right, arrays are actually considered to be an object type in JS.

**Functions are objects**

In JS, functions themselves are objects:

```
function f() {
    return "I'm a function";
}

console.log(typeof f); // function
console.log(f instanceof Function); // true
console.log(f instanceof Object); // true
```

As you can see, `f` is a function, but at the same time, it's also an object. I can also test to see if it's indeed an object by assigning `f` a property:

```
f.foo = "bar";
console.log(f.foo); // bar
```

This returns the property value `bar`, and not *undefined* as you may have thought at first.

To make things even more weird, I can even assign a function property to the already created function `f`:

```
f.metafunction = function () {
    return "I'm a function in a function";
}

console.log(f()); // I'm a function
console.log(f.metafunction()); // I'm a function in a function
```

**Function Properties**

A function that's a property of an object, is called a method. This object oriented concept also holds true to JavaScript. Methods in JS also bind to a special variable called '`this`', which refers to the object that the method was called on. Here's an example:

```
var cart = {
    customer: 'Juan',
    subtotal: function () {
           console.log('subtotal called for ' + this.customer);
    }
}
                                                                        
cart.subtotal(); // subtotal called for Juan
```

Notice how the returned value for customer was `Juan`. This was a result of assigning the receiver '`this`' to the property called `customer`. If I had instead coded the string inside `console.log` without using the '`this`' keyword, JS would have then thought that I was referring to a global variable called `customer`. However, because the object `cart` does contain a property called customer, I am able to refer to itself by assigning '`this`' as the reciever of `customer`.
                                                                                            
Now what would happen if I was to reference the function `subtotal` (from the `cart` object), into another, unrelated object?

```
var cart2 = {
    customer: 'Greg',
    subtotal: cart.subtotal // excluded parenthesis as I don't want to invoke function, I want a reference instead                      
}

cart2.subtotal(); // subtotal called for Greg
```
                                                                                             
As you can see, it's still able to distinguish between those two returned values, because it understands which objects I'm actually calling them against. The binding of '`this`' is directly dependent on how that function is invoked.
                                                                                  
For example, I'll create a reference to `subtotal()` that isn't associated to an object, but to a variable instead:
                                  
```
var singleSubtotal = cart.subtotal; // again I excluded parenthesis as I don't want to invoke function, I want a reference
                                                                                                         
singleSubtotal(); // subtotal called for undefined
```

Because `singleSubtotal()` is not called against an object, its customer property ends up being `undefined`. So when you invoke a function that's not specifically on an object, like it is above, it will instead use the root or global object as the '`this`' placeholder.

We could then try to trick JavaScript by creating a global variable that is defined as the customer property:

```
customer = 'Mr. Worldwide';

singleSubtotal(); // subtotal called for Mr. Worldwide
```

By assigning the variable `customer` above with no prefix (var/let/const) and outside of any block, it becomes a global statement. It is now capable of becoming the placeholder property for the once undefined value inside `subtotal()`.

Doing this is not advisable however, as it's not a very object oriented way to operate, and it exploits a consequence of the way that JavaScript invokes functions. The rule of thumb is that if you use '`this`' in a function, that function should then be invoked as a method (a.k.a. from an object).

**Method calling**

Now to trace back a little to some of the examples above, you'll notice that when I made a reference to an object's method, I excluded the parenthesis. This allows me to access the method without invoking it, returning only the function reference:

`console.log(cart.subtotal); // [Function: subtotal]`

And to invoke it I just need to supply the parenthesis:

`cart.subtotal(); // subtotal called for Juan`

I can also access this method using square bracket notation, just like I had done with properties earlier on in this guide:

```
console.log(cart['subtotal']); // [Function: subtotal]

cart['subtotal'](); // subtotal called for Juan
```

One useful asset of the square bracket notation is the ability to invoke methods dynamically. Consider this example:

```
var cart3 = {
    customer: 'Billy',
    taxrate: 0.15,
    price: 25,
    subtotal: function () {
        return `${this.customer}'s subtotal is $`; // using string interpolation here
    },
    total: function () {
        var announce = this.subtotal() + (this.price + (this.price * this.taxrate));
        console.log(announce);
    }
}

cart3.total(); // Billy's subtotal is $28.75
```

Let's say I wanted to dynamically access either `total` or `price` depending on where I was at a checkout process, and at the very end of the transaction, there would be a variable called `finalStep` that was set to `true`:

`var finalStep = true;`

I can then dynamically figure out which function or property name I want to use depending on the end result:

`var methodName = finalStep ? 'total' : 'price'; // using a ternary operator to see the end result based off finalStep`

So since `finalStep` is true, `methodName` should simply output a string referring to total:

`console.log(methodName); // just returns a string 'total' as it's an unassociated value`

Now if I call `cart3` with square brackets using the `methodName` as a reference, it will recognize the output to be an existing function within itself:

`console.log(cart3[methodName]); // returns [Function: total] because it recognizes that total is a function of cart3`

So if I now invoke it, I should see the total method being returned as if it was called directly using dot notation:

`cart3[methodName](); // the method is invoked so it returns 'Billy's subtotal is $28.75'`

In this way, I can dynamically pick out the methods and properties of an object, using square bracket notation.

**Functions in functions**

Something that I became aware of when testing out scope within functions, is that when using the keyword `this` in relation to an inner function, it can potentially cause errors in interpretation. Here's an example:

```
var cart4 = {
    taxrate: .15,
    subtotal: function () {
        return 15;
    },
    total: function() {
        function getTax() {
            return this.subtotal() * this.taxrate;
        }
        return this.subtotal() + this.getTax();
    }
}

console.log(cart4.subtotal()); // 15
cart4.total(); // TypeError: this.getTax is not a function
```

For this example, I have created the property `total`, which contains a function with an inner function named `getTax()`. When I check for `subtotal()` I get no problem. However, when I try and call the property `total()` I receive an error instead. It indicates that `this.getTax` isn't a function. Why is that?

In JavaScript, variables normally have function scope, so a variable declared in the `total()` function would be considered available to enter functions such as `getTax()`. Given that this is the case, then the variable '`this`' should also be available inside of `total()` as well as in `getTax()`.

But in this case, '`this`' is not the object `cart4` inside of `getTax()`, but is instead a global object. This occured the moment that it became an inner function of `total()`: it then jumped into a seperate scope from the initial object, `cart4`. And since the global object has no method `subtotal` and no property `taxrate` you get an error because JavaScript doesn't know how to invoke the `getTax` function.

What I need to do instead is create a helper variable. This will be a variable that I call `self` (some refer to it as `that`) but it's only usage is to refer to '`this`'. As a result, it becomes a reference to the same object.

`var self = this;`

The difference here is that the variable `self` isn't considered special in any way to JavaScript. So the normal rules of function scope don't apply to `getTax()` anymore, yet it still points to the object we're interested in i.e. what was originally known as '`this`' (`cart4`).

```
var self = this;
function getTax() {
   return self.subtotal() * self.taxrate;
}
```

After replacing the reference to `self` within the `getTax()` function, I'll now need to remove the prefix `this` from `getTax()` as shown below:

`return this.subtotal() + getTax();`

The reason being that `getTax()` is not a directly related function to the object `cart4`, but is rather a function within the scope of the property function `total()`. Here's the full working revision:

```
var cart4 = {
    taxrate: .15,
    subtotal: function () {
        return 15;
    },
    total: function() {
        var self = this;
        function getTax() {
            return self.subtotal() * self.taxrate;
        }
        return this.subtotal() + getTax();
    }
}

console.log(cart4.subtotal()); // 15
console.log(cart4.total()); // 17.25
```


**Using call and apply**

As you most likely have already noticed, JavaScript offers us different ways to invoke functions, there are two special methods that I want to bring up, these are named `call` and `apply`.

Let me start an example to show you how they work:

```
function sqsum(a, b) {
    return Math.pow(a, 2) + Math.pow(b, 2); // setting the arguments to the power of 2
}

console.log(sqsum(2, 3)); // 13

console.log(sqsum.call(null, 2, 3)); // 13

console.log(sqsum.apply(null, [2, 3])); // 13
```

I first start it off with a basic invokation, setting the arguments to the function that then returns to the console my sought for answer, `13`.

I then move forward to the call method, suffixing it to the `sqsum` function. The only additional difference is the null argument within the parenthesis. As expected, this method calls the function with the alloted arguments, and returns the same answer.

Finally, I use the `apply` method, much in the same way as `call`. The main difference being an array is passed, with the arguments inside of it, like a list. Passing the arguments as an array can also come in handy when you have things that are already in an array, and you want to invoke a function with the elements of the array as arguments.

If you're wondering what the `null` parameter in `call` and `apply` are about, it's to specify what to bind to the '`this`' variable. It allows you to have the flexibility of even invoking custom external functions.

We can really start to see that JavaScript is truly a language about functions first, and methods second.

Let's move on to a more in depth example:

```
var hello = {
    name: 'WelcomeBot',
    speak: function (to) {
        return this.name + ' says \"welcome, ' + to + '.\"';
    }
}

var goodbye = {
    name: 'FarewellBot',
    speak: function (to) {
        return this.name + ' says \"Goodbye, ' + to + '.\"';
    }
}

console.log(hello.speak('Juan')); // WelcomeBot says "welcome, Juan."

console.log(goodbye.speak('Juan')); // FarewellBot says "Goodbye, Juan."

console.log(hello.speak.call(null, 'Garfield')); // undefined says "welcome, Garfield."
```

You see that something interesting has happened with the last method call to `hello.speak`. I've used the `call` method, and I passed `null` to the '`this`' object, which means that I've lost the binding to the `hello` object `speak` property. As a result, it's treated as a function that's being invoked without any context.

Look at what happens when I do this though:

`console.log(hello.speak.call(goodbye, 'Garfield')); // FarewellBot says "welcome, Garfield."`

This time I've passed in the `goodbye` object to '`this`', even though I'm calling the `hello` object method `speak`. Again, using the `call` method allows me to do this, and as a result the binding of '`this`' becomes relative to what the property of `name` is for my `goodbye` object (which is `FarewellBot`).

As a result, I now have my `FarewellBot` welcoming me. You can really start to see the utility of being able to invoke methods from one object onto another object, as if they already belonged to each other. It allows you to pass a function around as a variable, and still invoke it as if it were a method. Of course this works in the exact same way with the `apply` method, except for passing the arguments in as a possible array:

```
console.log(hello.speak.apply(goodbye, ['Susan'])); // FarewellBot says "welcome, Susan."

console.log(goodbye.speak.apply(hello, ['Susan'])); // WelcomeBot says "Goodbye, Susan."
```
Now let's say we just wanted to pass the speak method around, and use it as a function:

```
var speak = hello.speak;

console.log(speak('Billy')); // undefined says "welcome, Billy."
```

Even though I pulled the speak method from the `hello` object, when I saved it into a variable, I immediately lost its binding to the object it came from. Which results in an *undefined* value.

Fortunately, I can use the `call` method to get the functionality back on track:

`console.log(speak.call(hello, 'Billy')); // WelcomeBot says "welcome, Billy.`

This manages to invoke the function against the `hello` object, even though I only have the variable `speak` pointing to the function; instead of calling it against an object (as was done in the earlier examples).

I can also invoke functions as methods of objects that are created right on the spot:

`console.log(hello.speak.call({name: 'AnotherGreetingBot'}, 'Rob')); // AnotherGreetingBot says "welcome, Rob.`

Again, you really start to see the flexibility of being able to invoke functions with the `call` and `apply` methods. You can create objects on the fly and invoke methods from other objects.

One common use of JavaScript's ability to change what '`this`' is bound to, is by doing the same operation to a group of simultaneous objects.

Let's say I'd like to number all of the current robots:

```
function numberRobot(n) {
    this.number = n;
}
```

It might strike you as being odd that I'm using the special variable '`this`' in a regular function, as opposed to a method.
And you're right, it definetly is weird in comparison to any other object oriented language. But because it's JS, I can dynamically change what '`this`' points to during invokation:

```
var robots = [hello, goodbye]; // the two robot objects I already have, encapsulated in an array

for(var i = 0; i < robots.length; i++) {
    numberRobot.call(robots[i], i);
}
```

Using this for loop, I'm invoking the `numberRobot` function as if it were a method on each existing robot object. First by binding '`this`' to the result of the index in the variable `robots` (which contains the robot objects), thanks to using the `call` method. And then setting the numerical argument of `numberRobot` in relation to the iterator count.

And now to see the results of the number property, within these robot objects:

```
console.log(hello); // { name: 'WelcomeBot', speak: [Function: speak], number: 0 }

console.log(goodbye); // { name: 'FarewellBot', speak: [Function: speak], number: 1 }
```

I've essentially created a method without attaching it to any objects. Weirder still, it all originated from a regular, and external function!

**Binding**

Using the `bind` method is another way to deal with the problem of invoking methods, when you can't call them against the object they belong to right away. It allows you to permanently bind a specific '`this`' value to a function, making the function always be invoked as a method no matter where or how it's called. 

Normally if I were to save a reference to a method and then invoke it, it won't be called in the context of the original object; as I previously showed with the variable speak:

```
var speak = hello.speak;

console.log(speak('Josh')); // undefined says "welcome, Josh."
```

However, if I revise the `speak` variable to use the `bind` method, it will recognize the original state of the `hello` object:

```
var speak = hello.speak.bind(hello);

console.log(speak('Josh')); // WelcomeBot says "welcome, Josh."
```

Note that even if I use the `call` method on `speak`, in order to point to another object, it will still be bound to the object that I just assigned it to:

`console.log(speak.call(goodbye, 'Josh')); // WelcomeBot says "welcome, Josh."`

That's because once a function has been *bound*, it can't be modified even by the methods `call` or `apply`. So you could say that binding takes precedence over them.

Bind can also be especially useful with callbacks:

```
// revised speak variable to exclude the binding again for this example below

var speak = hello.speak;

// "callback" argument must be a function if I want to log it to the console for this particular case

setTimeout(function () { console.log( speak('Josh') ) }, 2000); // undefined says "welcome, Josh."

// bound the hello object to the speak variable for invocation, set for when the evaluation time is up

setTimeout(function () { console.log( speak.bind(hello, 'Josh')() ) }, 2000); // WelcomeBot says "welcome, Josh."
```

A word of caution however, you should be careful when using the `bind` method, as a bound function will not allow the '`this`' argument to be modified even with `call` or `apply`.

> Stay tuned for Approaching Object Oriented JavaScript (§ 2)
> 
> And thanks for reading!

~Juan
