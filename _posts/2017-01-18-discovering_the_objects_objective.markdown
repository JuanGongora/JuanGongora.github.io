---
layout: post
title:  "Ruby's Grandfather Object"
date:   2017-01-17 20:39:48 -0500
---

That dark hole with the sign Object...

<a href="http://imgur.com/fl5KxLh"><img src="http://i.imgur.com/fl5KxLhl.jpg" title="There's a scary skull next to a dark hole..." /></a>

It scared the firecrackers out of me! I had to take a flight back home, and find my lucky pair of pants to replace the ones I was wearing then... 

<a href="http://imgur.com/ClisVOP"><img src="http://i.imgur.com/ClisVOPl.jpg" title="My favorite pair of pants." /></a>

Returning back here took longer than I thought, but thanks to the trail of notes we left [behind](http://imjuan.com/2016/09/20/oh_module_where_art_thou/) we know where we left off:



> What is the difference between a class and a module?

* *Modules* are collections of methods and constants. They can't create instances. *Classes* however are able to generate instances (*objects*), and have per-instance state *(instance variables*).

* *Modules* may be *mixed-in* to classes and **other** modules. The *mixed-in* module's constants and methods blend into that class's own, augmenting the class's functionality to that of a replicated form of inheritance. *Classes*, however, can't be *mixed-in* to anything.

* A class may *inherit* from another class, but not from a module(in the traditional sense so to speak).

* A module may not *inherit* from anything.

> Syntax of require/load vs. syntax of include

* You may remember that when we use the `require` method, the name of the *required* item is put into *quotation marks*; but when using `include`, there aren't any. That's because  `require` takes  [*strings*](https://ruby-doc.org/core-2.2.0/String.html)  as their arguments, while `include` takes the name of a module in the form of a [*constant*](http://ruby-doc.org/docs/ruby-doc-bundle/UsersGuide/rg/constants.html).

Well I hope that helped, because I just realized that by picking these notes up, we've lost the trail that we set to get us back out of this ancient structure...

Looks like we'll have to discover another way out, but hey that's what we *[explorers](http://imjuan.com/2016/08/19/reaching_the_end_of_the_ruby_class_jungle/)* do! Let's jump into the *Object* now and see what we can discover in there.

<a href="http://imgur.com/KUZ5MKe"><img src="http://i.imgur.com/KUZ5MKel.jpg" title="Climbing down to see what's in Object!" /></a>

Jumping hyena what the hell is that!? Omg it's the rest of that skull's skeleton... Looks like it's holding a note in its hand. You go take a look at it though, I'm too scared to pry it off its boney grasp.

<a href="http://imgur.com/LuLSIgx"><img src="http://i.imgur.com/LuLSIgxl.jpg" title="The skeleton is holding a note..." /></a>

*To whom it may concern*,

As you may know by now, after having traversed through this jungle, and then finding your way to the Ruby ziggurat... that this path we set on had initially set rules for us to obey. Or Perhaps... you actually may be asking yourself: *"What are these rules exactly?"*

Well my never to meet friend, this restriction that I'm speaking of is in relation to *classes*. Every Ruby class can
have only one [*superclass*](http://stackoverflow.com/questions/10558504/can-someone-explain-the-class-superclass-class-superclass-paradox), it's very particular about keeping its rule of [*single inheritance*](http://rubylearning.com/satishtalim/ruby_inheritance.html), meaning it doesn't allow [*multiple class inheritance*](http://stackoverflow.com/questions/10254689/multiple-inheritance-in-ruby) to ever exist. 

Just have a look at the path that was taken to get here and you'll see what I mean:

```
class Ziggurat
end

class CampSite < Ziggurat
end

class Jungle < CampSite
end

class Village < Jungle
end

p Village.ancestors
p "As you can see, Ziggurat, our last class, has the super-class of #{Ziggurat.superclass}."
```

Terminal:


```
[Village, Jungle, CampSite, Ziggurat, Object, Kernel, BasicObject]
"As you can see, Ziggurat, our last class, has the super-class of Object."
```

You can't for example attempt to do this:

```
class Village < Jungle < CampSite
end

class Village < Jungle
  include CampSite
end

class Village < Jungle
  extend CampSite
end
```

If you tried to, they would all just result in a type error.

So... What this initially points out to us is that every class in Ruby ultimately ascends or descends from one single class, where its related parent or child continue to then follow suit in this hierarchical order(as a class, or subclass, or even a sub-sub class... so on and so forth).

Although this might seem like a cumbersome restriction at first, especially if we want to make a class more dynamic(with different methods coming in from different classes) we first have to remember just how it is that we got here in the first place... That's right, the [*Hall of Modules*](http://imjuan.com/2016/09/20/oh_module_where_art_thou/).

Thanks to our discoveries from the floor above, we already know that we are in fact fully capable of providing our classes with as many additional methods as we'd wish to have, with the help of *module* [inclusions/extensions](http://stackoverflow.com/questions/156362/what-is-the-difference-between-include-and-extend-in-ruby). It just can’t be done strictly with classes and the inheritance chain, as was displayed on our path example...

But here's the thing, if you continue to go up the inheritance chain you eventually hit the [*Object*](http://ruby-doc.org/core-1.9.3/Object.html) class. From this class *Object*, is where many of the methods we know and use on Ruby initially come from, and so any method that is available to a bare instance of *Object*, is also available to every object... *Object* is therefore the parent class of *[(almost)](https://ruby-doc.org/core-2.2.0/BasicObject.html)* all classes in Ruby. 

```
class Object
  def gloat
    puts "gloat is a universal method now!"
  end
end

class Village
end

pallet_town = Village.new
pallet_town.gloat
```

Terminal:

```
gloat is a universal method now!
nil
```

Enigma discovered... If classes cannot share multiple method hierarchies like modules do then how is it that all classes are originated from *Object*, and are <u>capable</u> of using class *Object*'s methods? Like shown above? It's not like *Object* was a module that was included into class `Village`, and `Village` had various parent classes before it as well... so what's going on? Well, that's because the method was actually INCLUDED from `Kernel` which is a MODULE.

That's right, the instance methods of `Object` are defined by the *Kernel* module. With the `Kernel` module included into class `Object`, it's methods end up being available to every Ruby object.

An intersting thing to point out here is that because these methods come from `Kernel`, a lot of the local scope methods we use are actually being constructed as [private instance methods](http://culttt.com/2015/06/03/the-difference-between-public-protected-and-private-methods-in-ruby/):

```
class Village
 self.puts "I won't work since I am trying to overwrite a private instance method that is not mine."
end

class Village
  puts "I will work since I am a method implicitly called from Kernel and am a descendant of Object."
end

class Village
  Kernel.puts "I will work too since I am explicitly defining the module where I originally come from."
end
```

If the above example is not enough proof for you... just try this code out in your editor:

```
def self.hello
  puts "Hi there, I'm #{self}!"
end

hello
p self.is_a?(Object)
p self.class

Kernel.puts "I will work since #{self} comes from Object, and Obect has Kernel's methods!"
```

Even within the *local scope* we are essentially building methods and variables inside of class `Object` itself; `hello` for example is actually a private instance method being defined on the `Object` class. This means that the `self.hello` method would be available (as a private method) to nearly every object in your ruby program. All methods defined at the top-level [*(main)*](http://stackoverflow.com/questions/917811/what-is-main-in-ruby) are actually defined as private instance methods on the `Object` class. Which also explains why it is that we are able to use the included methods from `Kernel` globally.

```
def hello
  puts "Hi there, I'm #{self}!"
end

p method(:hello).owner
p Object.private_method_defined?(:hello)
```

Terminal:

```
Object
true
```

This is how Ruby implements ‘global functions’: since top-level methods are defined on `Object` they can be accessed everywhere, and since they’re private they must be invoked in a functional style (with no explicit receiver).

Well, now that we've got that settled let me point you back to the previous `p Village.ancestors` reference:

```
[Village, Jungle, CampSite, Ziggurat, Object, Kernel, BasicObject]
```

You see how `Kernel` is to the right of `Object`? That's because as we discovered, `Kernel` is *mixed-in* to `Object`. So the methods that come from `include` will have higher priority in the inheritance hierarchy than methods that come from its *superclass*. Which means that Ruby will search the lexical scope in the *included* module before it does its parent class. Just for good measure, if we were to see the layout of how class `Object` looks, this is how it would be:

```
class Object < BasicObject
  include Kernel
end
```

Which leads us to the ancient one: [*BasicObject*](https://ruby-doc.org/core-2.2.0/BasicObject.html). 

I will give you a warning about this class, I was unable to leave this floor because of `BasicObject`. I tried numerous *methods* on it but it wouldn't budge. There were inscriptions on the walls that explained what it was but I couldn't decipher them. I hope that you can figure them out, because this class is blocking the exit to the Ziggurat. I paid a high price for discovering Ruby's arcane knowledge, I pray that you don't get trapped here like me... 

<sub>~</sub>*Fin*

.............Uhhh...... That sounds super reassuring....<br>
Poor guy... We better figure out how <u>*not*</u> to end up like our headless skeleton friend...

Looks like we have no choice but to move forward now. Let's see if we can find some clues about *BasicObject*. 

Huh? You found some inscriptions? Oh yeah, it looks like complete gibberish... Now we know why Mr. Skeleton was trapped here... It doesn't even look like a language of any kind...

<a href="http://imgur.com/dtKW4BF"><img src="http://i.imgur.com/dtKW4BFl.jpg" title="I don't know what this says..." /></a>

Hey you see that thin crack in the middle? It looks kind of weird... 

What's that? You say that the color tone of this calligraphy slab is different than the rest of the wall? You're right! It seems as if this part of the wall was applied later! Hand me your walking stick, we'll use it as a hammer and see if it's trying to conceal something.

*WHAM!!*

Well... Would you look at that...

That fake layer was hiding the real inscriptions! Now let's see if it will tell us some truth about *BasicObject*! 

**BasicObject**

*BasicObject* sits at the top of Ruby’s class tree. For any Ruby object, the following is true:

```
some_object = "I'm an object."
p some_object.class.ancestors.last
```

Terminal:

```
BasicObject
```

If you want to be a little adventurous, try out this method in your editor, and see how all the Ruby classes in existence end up at *BasicObject*.

```
ObjectSpace.each_object(Class) do |summary|
  begin
    print summary
    summary = summary.superclass
    print " => " if summary
  end while summary
  puts
end
```

And yes that means Modules too, since Modules come from the `class Module` (confusing I know) and `Class` is a sub-class of `Module` (even more confusing).

[*David A. Black*](http://stackoverflow.com/questions/7675774/the-class-object-paradox-confusion) had a good way of describing the reasoning behind this paradox, in a short and concise manner:

> If you want to know in brief how it works, it’s like this: every object has an internal record of what class it’s an instance of, and the internal record inside the object `Class` points back to `Class` itself.

Here's some proof for the pudding:

```
p Class.class
p Class.superclass
puts "---------------"
p Module.is_a?(Class)
p Module.class
p Module.superclass
puts "---------------"
p Object.class
p Kernel.class
p Object.superclass
```

Terminal:

```
Class
Module
---------------
true
Class
Object
---------------
Class
Module
BasicObject
```

Anyways... 

The `BasicObject` class actually contains a very minimal amount of methods, even though it's the grandfather of all objects:

```
p BasicObject.instance_methods
p BasicObject.private_instance_methods
```

Terminal:

```
[:==, :equal?, :!, :!=, :instance_eval, :instance_exec, :__send__, :__id__]
[:initialize, :singleton_method_added, :singleton_method_removed, :singleton_method_undefined, :method_missing]
```

Although this class is a very peculiar thing to have existing in the first place, as it doesn't supply us with much initial usage, there's a purposeful reason for this.

> "Swish! Gloop, gloop, slither...."

Did you hear that? That was weird... Oh well, let's continue on, it looks like that was the last of the inscriptions for this wall. Let's find the next one!

Hey!! Over here! There's another fake wall! 

*Bang!!*

Alright, let's see what this one says:

`BasicObject` exists so that you can create... empty objects. Meaning that they really don't have any knowledge of all the predefined methods that originally come from Object/Kernel. What this means for you is that you are then able to teach them anything and everything, without worrying about accidentally clashing with pre-existing methods.

Typically, this means that you've got to use some <a id="basicObject_example">[*Ruby black magic*](https://robots.thoughtbot.com/always-define-respond-to-missing-when-overriding)</a> to make things work, since `BasicObject` knows very little.
One such method to get things rolling is  `method_missing`. By defining `method_missing` for `BasicObject` or a class that inherits from `BasicObject`, you can then build objects that completely rely on you to tell them what sort of [*behavior*](https://github.com/thoughtbot/til/blob/master/ruby/basic-object.md) they're supposed to do.

But what if you really needed to implement a known method into a `BasicObject` sub-class? Thankfully, the [*Ruby docs*](http://apidock.com/ruby/BasicObject) have a very neat way of displaying how to do just that! But for simplicity's sake we'll make a made up example to show how to start things off:

```
module MonsterCapture
  class ShrinkRay
    def self.zapper(method_name)
      "#{method_name} has been zapped to micro size!"
      #some code that implements other usage of that method call from EscapeDungeon...
      #...
      #..
    end
  end
end

class EscapeDungeon < BasicObject
  def self.method_missing(name)
    ::MonsterCapture::ShrinkRay.zapper("#{name} in EscapeDungeon")
  end
end
```

Here we have `EscapeDungeon`, that inherited from `BasicObject`. It's using `method_missing` to define *class methods* for [*namespacing*](http://stackoverflow.com/questions/991036/what-is-a-namespace) in `MonsterCapture`'s `ShrinkRay` class.

`method_missing` is a well-known tool in Ruby metaprogramming. It’s a *callback* method that gets called when an object tries to call, you guessed it, a missing method!

We can then set a yet unknown *class method* to `EscapeDungeon` as its attribute, even though `EscapeDungeon` has not yet defined it. But how do we now access the unknown method to be recognized as the real deal? 

For example, our `EscapeDungeon` class knows very little since it's coming from `BasicObject`.  Remember, `BasicObject` doesn't *include* `Kernel` and is also outside of the *namespace* of the standard library so common classes won't be found... 

Our goal here is to have `MonsterCapture` (which does include `Kernel`) recognize that method in its internal class `ShrinkRay`, so that it can then operate on that utility method on behalf of `EscapeDungeon`.

In order for us to make this a possibilty, we have to access the Ruby standard library by referencing the desired constant(class or module) using a full class path. Like we have done above with ` ::MonsterCapture::ShrinkRay.zapper`(*this brings us back to the usage of the* [*scope resolution operator*](http://imjuan.com/2016/09/20/oh_module_where_art_thou/#target)). As a result, we are then able to call the utility methods coming from the module's class into a class from `BasicObject`.

```
#=> yet to be defined method 'monster' being called from the BasicObject child class

skeleton_key = EscapeDungeon.monster 
puts skeleton_key
```

Terminal:

```
#=> 'monster' method is referenced by ShrinkRay.zapper(method_name) and is now able to work within EscapeDungeon

monster in EscapeDungeon has been zapped to micro size!
```

> "Rumble, rumble, slither...."

There's that weird noise again.... Well it looks like that's the end of this inscription. It doesn't look like there's anymore around here either...

So this definitely explains to us why it was that Mr.Skeleton couldn't operate on `BasicObject`. That class didn't even know any of the methods that he was probably trying to use on it! 

Let's look for the exit now that we've pieced this puzzle together...

>"Groan, gloop, gloop..."

<a href="http://imgur.com/E6ffCFR"><img src="http://i.imgur.com/E6ffCFRl.jpg" title="We can't get past it..." /></a>

WHOOAA!!!

Is that `BasicObject`?! There's no way we can get past it! It's huge!

Okay, okay, don't panic... 

**Let's gather our thoughts together...**

***

* All classes in Ruby inherit from the `Object` class by default. It's methods are therefore available to all objects unless explicitly overridden.

* The `Kernel` module is *included* by class `Object`, which is what makes the built-in method functions globally accessible.

* Every class is an instance of the class `Class`. With the `Object` class being an instance of the class `Class`.

* The class `Class` however, is also a subclass of the class `Object`. So you need the class `Object` for the class `Class` to be created. 

* Newly created classes initially inherit from `Object` unless you explicitly specify its super-class, and in general most programmers will never need to use or inherit from `BasicObject`.

* Class `Object` however, inherits from the `BasicObject` class (which was introduced in Ruby 1.9).


```
def family(the_class)
  unless the_class == nil
    puts "#{the_class}, comes from the super class:
#{the_class.superclass} . . ." 
    family(the_class.superclass)
  end
end

family(Class)
```

Terminal:

```
Class, comes from the super class:
Module . . .
Module, comes from the super class:
Object . . .
Object, comes from the super class:
BasicObject . . .
BasicObject, comes from the super class:
 . . .
=> nil
```


* `BasicObject` is a very simple class, with almost no methods of its own.

* You can use `BasicObject` as the parent of your object in case you don't need the initial methods of the `Object` class, so as to avoid method name clashing from `Object` inheritance.

* Access to classes and modules from the Ruby standard library can be obtained in a `BasicObject` subclass by referencing the desired constants from the root path.

***

That's right! We have to use the path `::MonsterCapture::ShrinkRay.zapper` inside of the `method_missing` for `class EscapeDungeon < BasicObject` to know how to operate on a yet <a href="#basicObject_example">unknown method</a>, that's from module `MonsterCapture`'s `ShrinkRay` class!

Let's do this now that we know how, and apply a new method onto `EscapeDungeon`:

```
puzzle_solver = EscapeDungeon.blobfish
puts puzzle_solver  #=> blobfish in EscapeDungeon has been zapped to micro size!
```

Look it actually shrunk!!

Freedom!!!

<a href="http://imgur.com/d2Bh1NV"><img src="http://i.imgur.com/d2Bh1NVl.jpg" title="There's a ladder to climb down!" /></a>
