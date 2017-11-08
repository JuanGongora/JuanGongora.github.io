---
layout: post
title:  "Oh Module where art thou?"
date:   2016-09-19 22:19:00 -0400
---

Under the canopy of a lustrious tree, laid our camping ground. Haphazardly set up due to fatigue from our long treck into the heart of the Ruby jungle. I've been logging our discoveries in my journal since we started this treck. 

You accidentally left your walking stick behind? Let me see, maybe I wrote down where you last left it in [Reaching the end of the Ruby Class Jungle](http://juangongora.github.io/2016/08/19/reaching_the_end_of_the_ruby_class_jungle/).

Okay, here it says that we stopped by a couple of different places. Let's see...

1. Variables which begin with two @@ characters are called *class variables*. They give you automatic sharing throughout the class's hierarchy.

2. *Class methods* (also referred to as [*singleton methods*](http://www.rootr.net/rubyfaq-8.html#singleton_method)) are for things that don’t operate on the individual instance of an object, or for cases where you don’t have the instance available to you. It’s primary use is for updating all users of the class to a specific condition.

3. In the context of a class, `self` refers to the current class, which is simply an instance of the class [`Class`](https://ruby-doc.org/core-2.2.0/Class.html). Defining a method on `self` creates a *class method*.

4. With *attribute accessors*, Ruby provides us with an easy way to access an object’s variables. An *[attribute accessor](http://www.rubyist.net/~slagell/ruby/accessors.html)* is the property of an object whose value can be read and/or written through the object itself.

Did that help you remember where you left it? Oh good, let's pack up and get it then. While we're walking there, let's make a plan to get ready to go into that massive Ziggurat. You know, the one we camped outside of... That location has been what we've been searching the whole jungle for after all!

Okay, so the first clue we got from trying to pry into the Ziggurat was that it's built on numerous different levels. It mentioned that our first entrance would lead us to the "Hall of Modules". *Modules*, that word sounds familiar... In fact, I think the *attribute accesors* we worked on in the last blog are related to *Modules*!

Before we get ahead of ourselves though, let's check out the map:

Alright it looks like *Class* leads us to *Module*. 

<a href="http://imgur.com/yiZovC1"><img src="http://i.imgur.com/yiZovC1m.jpg" title="source: imgur.com" /></a>

We already know what classes are thanks to our earlier trecks(from [here](http://juangongora.github.io/2016/06/28/getting_to_know_classes_in_ruby/), to [there](http://juangongora.github.io/2016/07/17/diving_deeper_into_rubys_class_pool/), and [back](http://juangongora.github.io/2016/08/19/reaching_the_end_of_the_ruby_class_jungle/) again!). 

Let's refresh the mind for old time's sake. Classes are objects, just like almost everything else in Ruby. But they're also the only type of object that's capable of summoning *new* objects: through *[instantiation](https://en.wikibooks.org/wiki/Ruby_Programming/Syntax/Classes#Instantiation)*. Classes can send and recieve messages to their objects, as well as add methods and arguments to other objects.

You can even make new classes in the same fashion that you would when making a new object variable:

`gold = Class.new`

Here we are assigning the *Class* constructor to the variable `gold`, which is now capable of making *instantiated* versions of itself:

`nugget = gold.new`

We can even tweak the *[unnamed class](https://ruby-doc.org/core-1.9.3/Class.html#method-c-new)* of `gold`(which is just assigning a new instance of the class `Class` to the variable named `gold`) to have it's own built in *instance methods* upon creation!

```
gold = Class.new do
  def rich
    puts "I found me some gold!!"
  end
end

nugget = gold.new

p nugget.rich
```

Terminal:

```
I found me some gold!!
nil
```

You might be getting confused though about why `nugget` is able to function as a class... Even though it's a [*local variable*](http://ruby-doc.org/docs/ruby-doc-bundle/UsersGuide/rg/localvars.html), and not a [*constant*](http://ruby-doc.org/docs/ruby-doc-bundle/UsersGuide/rg/constants.html): which is the more formal way that you and I know about class creation:

```
class Gold

  def rich
    puts "I found me some gold!!"
  end

end
```

The reason behind this is that all classes(including newly made classes) that have been *instantiated*, are actually *instances* coming from the class `Class`. So the class `Gold` written above is an *instance* of `Class`, and `Class` already comes built with the `new` method. This is why we can do this for both the versions that were described:

```
# from the local variable assigned to instantiate from Class

gold = Class.new

# from an instantiated variable of the new class Gold

instance_of_Gold = Gold.new
```

You should probably know that there actually are two different forms of `new` for the parent class `Class`. One is an *instance method*, and the other is a *class method*. So when you use `Class.new`, you're actually incorporating a *class method* from the parent class `Class`. While using `Gold.new` uses an *instance method* that was ancestored from `Class`.

Ahhh there's your walking stick! Let's head back to the Ziggurat now: 

<a href="http://imgur.com/PT201cK"><img src="http://i.imgur.com/PT201cKl.jpg" title="source: imgur.com" /></a>

Phew!! Those were quite a lot of steps just to get to the entrance! Alright I'm going to have to turn on my flashlight, it looks pretty dark in there. Huh? What's this? inscribed on the floor... It says:

> The superclass of Class is Module

Just like our map said! It looks like if we continue going forward there's more writing for us to see. Let me take out my journal and jot down what we see as we go further in. Can you aim the light for me?

Okay, so... Modules are actually very similar to classes in that they also contain methods and constants. They don't however contain *instances* that are traditonally called like our classes are(i.e. no object can be created from a module). BUT, they can hold these *instance variables/methods* inside the module itself, which could then be passed *into* a class(in order to build up [*multiple inheritance*](http://www.tutorialspoint.com/ruby/ruby_modules.htm)). We have ofcourse, already been using modules. Among these modules were the *attribute accessors* from the previous blog:

```
class Sheriff
  attr_reader :dog
  attr_writer :dog
	
end
```

Those method calls are passing [*symbols*](http://www.troubleshooters.com/codecorn/ruby/symbols.htm), which then cause Ruby to create an *instance variable* called `@dog`. Ruby takes the value of *symbols* quite literally, in that its value also becomes its name. From this the *accessor methods* will create methods and variables that match the name of the *symbol*. These method calls then go directly to the class object `Sheriff`, which points to its default object `self`.

As you can see from having used the *attribute accessors*, instances of `Class` therefore have access to the *instance methods* defined in `Module`'s [default private methods](http://ruby-doc.com/docs/ProgrammingRuby/html/ref_c_module.html). From there, the classes then begin to create their OWN *instance variables*.

To spiral back to the hierarchy of Ruby's inheritance, every class object is ALSO a module object. We did however, bring up classes first because of the fact that Ruby is object-oriented; and objects are *also* instances of classes. But you could say that modules are the more basic structure of the two.

So what exactly are modules used for? This can be answered in two words: [*namespaces*](http://stackoverflow.com/questions/991036/what-is-a-namespace) and [*mixins*](https://www.sitepoint.com/ruby-mixins-2/). 

Imagine modules as boxed containers that have methods, constants and classes inside. All of the different items inside this container are made by the same *"company"* so they share the same *"brand"*(or *namespace*) which makes them visible to each other, but not to anyone that is looking just outside of the box(like a window shopper).

So how do we access these? Let's make a sample module and find out:

```
module Artifact

  Shiny = "This is a constant variable"

  def self.fragile
    puts "This is a class method"
  end
  
  def fragile
    puts "This is an instance method"
  end
  
end
```

<span id="target">Okay let's first attempt to access the constant inside of the module</span> `Artifact`:

```
puts Artifact::Shiny
```

Terminal:

```
This is a constant variable
```

Take notice of the double colon `::` between the module and constant names. This syntax is called the [*scope resolution operator*](http://stackoverflow.com/questions/5032844/ruby-what-does-prefix-do), and its what lets us access nested modules and classes.

Now let's try to access the module's *class method*:

```
puts Artifact.fragile
```

Terminal:

```
This is a class method
```

As you can see, we are able to access the *class method* in the same form that we would were it inside a class. This is because modules also have a *[singleton class](http://www.devalot.com/articles/2008/09/ruby-singleton)*.

But what about the *instance method*? Because a module is defined in a closed *namespace*, any code that's outside of the module can't *see* our `fragile` *instance method*.

If this was instead coming from a class, then all we'd have to do is create objects from the class using our `new` method. This would in turn allow the instantiated object to access the internal *instance methods*. But as was mentioned earlier, a module can't create instances of itself. So how do we access them?

**The include method**

```
include Artifact
puts fragile
```

Terminal:

```
This is an instance method
```

By using the `include` method we are able to access the *instance method* within the [current scope](https://www.sitepoint.com/understanding-scope-in-ruby/). 

To show the true power of a module though, we'd have to *include* it (yes the whole module!) inside of a class. This is what's referred to as a [*mixin*](http://ruby-doc.com/docs/ProgrammingRuby/html/tut_modules.html). When you *mixin* a module, it gives the class access to all of its *constants* and *instance methods*, just as if they were part of the class itself:

```
class Statue
  include Artifact

  def examine
    puts "Wow. #{Shiny}, coming from the mixin module!"
 end
	
end	
```

Now lets try calling them:

```
bronze = Statue.new

puts bronze.examine
puts bronze.fragile
```

Terminal:

```
Wow. This is a constant variable, coming from the mixin module!
nil
This is an instance method
nil
```

Both of those calls, as you saw, had content that was initially coming from the `module Artifact`. Pretty awesome, I know...

**Ruby Champ tip:**

Methods that come from `include` will have higher priority in the *inheritance hierarchy* than methods that come from its *superclass*. Which means that Ruby will search the lexical scope in the *included* module before it does its parent class.

We can preview this by using the *[ancestors](http://ruby-doc.org/core-2.0.0/Module.html#method-i-ancestors)* method:

```
module Artifact
end

class Statue
end

class Large < Statue
  include Artifact
end

p Large.ancestors
```

Terminal:

```
[Large, Artifact, Statue, Object, Kernel, BasicObject]
```

As shown in the ancestor array above, the module `Artifact` is accessed before the superclass `Statue`. Huh? What are the other classes in the array then? Those are the higher tier objects in Ruby's hierarchy, of which we'll probably discover more about as we get to the next levels of the Ziggurat, but let's not worry about them for now... 

Aside from inheritance priority, `include` doesn't just copy a module's methods into a class. It will actually just make a reference to them. What this means is that if multiple classes are using the same module, they will all continually direct to the same defined methods; not to duplicates of that same thing.

**The extend method**

Another interesting way to implement methods from a module is using the `extend` method. Using this keyword will actually convert whatever *instance methods* you have inside, into methods that can be reached in the same way that *class methods* are:

```
module Artifact

  def fragile
    puts "This is an instance method"
  end

end


class Statue
  extend Artifact
end
```

To access from the class `Statue`, we simply call it just like we would a *class method*:

```
p Statue.fragile
```

Terminal:

```
This is an instance method
 nil
```

To access from an instantiated object:

```
bronze = Statue.new
bronze.extend(Artifact)

p bronze.fragile
```

Terminal:

```
This is an instance method
 nil
```

We can even do this from within the module itself:

```
module Artifact
  extend self

  def fragile
    puts "This is an instance method"
  end

end
```

This allows us to then define and call *instance methods* directly from within the module, while still making it functional for extension to classes or objects.

```
p Artifact.fragile
```

Terminal:

```
This is an instance method
 nil
```

By attaching `extend` inside the module, we end up converting the internal defintions of our methods into both
*instance methods* and *singleton methods*.

Ofcourse, none of this would even matter however, if there isn't a reference to the module inside your working file...

**The require method**

If the module is in a seperate file, you must use the keyword `require` to drag that file into your current one before you can even use `include` or `extend`. 

So let's say that our module `Artifact` is inside a file called `modules.rb`, in order to access it we would call the file like so:

`require "modules.rb"`

You can also call it without the `.rb` at the end and it will still work the same:

`require "modules"`

This is usually the preferred way to do it since not all extensions use files ending in `.rb`.

You also have to take note if the file `module.rb` is even accessible through your working directory. To make sure this happens, you can use the `$:` (Dollar Colon) which is basically a shorthand version of [$LOAD_PATH](http://stackoverflow.com/questions/837123/adding-a-directory-to-load-path-ruby?noredirect=1&lq=1). 

The *global variable* `$:` contains an array of paths, which represent the directories that your script would search through  when using `require`. You can add a directory to this array variable by using the *append method* `<<`:

```
$: << "C:\my_directory"
```

There's also another form to load our files with:

`require_relative "modules"`

This command loads features by searching relative to the directory of the file in which the actual calls are made, rather than the folder in which the script was executed. This way you can go without manipulating the load path to include the current directory. `require_relative` is convenient when you want to navigate a local directory hierarchy. You can learn more about it [here](http://stackoverflow.com/questions/16856243/how-to-require-a-ruby-file-from-another-directory).

**Ruby Champ tip:**

If `require` is called more than once with the same arguments, it won't reload those files into your current directory. Ruby does a good job of keeping track of what's been *required*, in order to avoid unnecessary duplication. But if you wanted to load multiple versions of the same file for some reason, you can use `require`'s close cousin: `load`. You can find out more about `load` [here](https://www.practicingruby.com/articles/ways-to-load-code).

**Ruby's pre-defined Modules**

The [Ruby interpreter](https://en.wikipedia.org/wiki/Ruby_MRI); the program that's in charge of reading your code and then running it, comes with a series of pre-defined modules that you may want to know about for future reference. You can check out what the modules are in your current version of Ruby, by writing this code out in your IDE:

`puts Module.constants.sort.select {|x| eval(x.to_s).instance_of? Module}`

Here is a short description of each one, taken from the [Ruby docs](http://ruby-doc.org/). But to get the best walkthrough of what each is possible of, you should check their additional documentary for more examples. As of Ruby version 2.2 here's the list:

*Comparable*:

Is a *mixin module* which permits the including class to implement comparison operators. The including class must define the `<=>` operator, which compares the receiver against another object, returning -1, 0, or +1 depending on whether the receiver is less than, equal to, or greater than the other object. *Comparable* uses `<=>` to implement the conventional comparison operators `(<`,` <=`, `==`, `>=`, and `>`) and the method `between?`.

*Enumerable*:

is a *mixin module* for enumeration. It's included in `Array` and a few other classes. This module is composed of a number of very powerful *iteration methods*. For example, you might be familiar with the `each` method.

*Errno*:

Operating systems typically report errors using plain integers. In Ruby, errors tend to be reported as exceptions, so Ruby defines one *exception class* for each possible OS error. It then sticks all of these exceptions into a module called *Errno*. The *Errno* exceptions are essentially an adapter for those integers. They connect operating system errors to Ruby's exception system.

*FileTest*:

The *FileTest* module offers numerous methods for getting status information about files. Its methods can also be accessed from the `File` class. The methods available as *class methods* of `File` and `FileTest` are almost identical; they’re mostly aliases of each other.

*GC*:

The *GC* module provides an interface to Ruby’s mark and sweep garbage collection mechanism. Some of the underlying methods are also available via the *ObjectSpace* module.

*Gem*:

Gems contain package information along with files you can install, which then allow you to use their libraries on projects in your server. If you make some code that you would like to re-use or share in the future, you can make a custom gem for it. 

Kernel:

Is a module included by the `Object` class. *Kernel* defines Ruby’s ‘built-in’ methods, such as `print`, `puts` and `gets`.

*Marshal*:

An alternative way of saving and loading data is provided by Ruby’s *Marshal* library. This has a similar set of methods to [YAML](https://en.wikipedia.org/wiki/YAML) to enable you to save and load data to and from disk. *Marshal* files are in binary format. So while you may be able to read some characters, such as those in the strings, you won’t simply be able to load the saved data and modify it in a text editor. Marshaled data has major and minor version numbers stored along with the object information. In normal use, marshaling can only load data written with the same major version number and an equal or lower minor version number.

*Math*:

Is a module containing module functions for basic trigonometric and transcendental functions. It has both *instance methods* and *module methods* of the same definitions and names.

*MonitorMixin*:

In concurrent programming, a *monitor* is a synchronization construct that allows threads to have both mutual exclusion and the ability to wait (block) for a certain condition to become true. *Monitors* also have a mechanism for signalling other threads that their condition has been met. A *monitor* consists of a mutex (lock) object and condition variables. A condition variable is basically a container of threads that are waiting for a certain condition. *Monitors* provide a mechanism for threads to temporarily give up exclusive access in order to wait for some condition to be met, before regaining exclusive access and resuming their task.

*ObjectSpace*:

Is a module which contains routines that interact with the *garbage collection* facility and allow you to traverse all living objects with an iterator.

*Process*:

Is the module for manipulating processes. All its methods are *module methods*.

*RbConfig*:

This module is an interface to a lot of compiled-in configuration information about your Ruby installation. It gives access to mostly compile time properties of the current Ruby implementation. 

*Signal*:

Is the module for handling signals sent to running processes. The list of available *signal* names and their interpretation is system dependent.

**Finally, the end...**

Oh man, I don't know about you but my feet are killing me. I think we've reached the end of the hall, but I don't see a door to the next level... Gahh!!! 

Holy crap!! I almost fell through the floor! What in the world is going on?! Can you aim the light where I was standing?

What the...

<a href="http://imgur.com/fl5KxLh"><img src="http://i.imgur.com/fl5KxLhl.jpg" title="source: imgur.com" /></a>

Okay, so I guess this is how we get to the next level...

Let's gather up our things before we go down there and continue exploring. We should probably mark a trail though so that we know how to get back out... Alright, let's see what we can set down to point us back to the entrance:

> What is the difference between a class and a module?

* *Modules* are collections of methods and constants. They can't create instances. *Classes* however are able to generate instances (*objects*), and have per-instance state *(instance variables*).

* *Modules* may be *mixed-in* to classes and **other** modules. The *mixed-in* module's constants and methods blend into that class's own, augmenting the class's functionality to that of a replicated form of inheritance. *Classes*, however, can't be *mixed-in* to anything.

* A class may *inherit* from another class, but not from a module(in the traditional sense so to speak).

* A module may not *inherit* from anything.


> Syntax of require/load vs. syntax of include

* You may remember that when we used `require`, the name of the *required* item was in *quotation marks*; but with `include`, there weren't any. That's because  `require` takes  [*strings*](https://ruby-doc.org/core-2.2.0/String.html)  as their arguments, while `include` takes the name of a module in the form of [*constants*](http://ruby-doc.org/docs/ruby-doc-bundle/UsersGuide/rg/constants.html).

I'd say that's a fair amount to line up for now. These will keep us grounded in case we need to get back out. Alright, well... are you ready for this next venture? Okay, let me just change to a different pair of pants before we do this...
