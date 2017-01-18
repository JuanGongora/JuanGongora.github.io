---
layout: post
title:  "Discovering the Object's objective"
date:   2017-01-18 01:39:48 +0000
---

That dark hole with the sign Object...

<a href="http://imgur.com/fl5KxLh"><img src="http://i.imgur.com/fl5KxLhl.jpg" title="There's a scary skull next to a dark hole..." /></a>

It scared the firecrackers out of me! I had to take a flight back home and find my lucky pair of pants to replace the ones I was wearing then... 

************ Insert image of pants ***********


Returning back here took longer than I thought, but thanks to the trail of notes we left [behind](http://imjuan.com/2016/09/20/oh_module_where_art_thou/) we know where we left off:



> What is the difference between a class and a module?

* *Modules* are collections of methods and constants. They can't create instances. *Classes* however are able to generate instances (*objects*), and have per-instance state *(instance variables*).

* *Modules* may be *mixed-in* to classes and **other** modules. The *mixed-in* module's constants and methods blend into that class's own, augmenting the class's functionality to that of a replicated form of inheritance. *Classes*, however, can't be *mixed-in* to anything.
?
* A class may *inherit* from another class, but not from a module(in the traditional sense so to speak).

* A module may not *inherit* from anything.

> Syntax of require/load vs. syntax of include

* You may remember that when we use the `require` method, the name of the *required* item is put into *quotation marks*; but when using `include`, there aren't any. That's because  `require` takes  [*strings*](https://ruby-doc.org/core-2.2.0/String.html)  as their arguments, while `include` takes the name of a module in the form of a [*constant*](http://ruby-doc.org/docs/ruby-doc-bundle/UsersGuide/rg/constants.html).

***

Well I hope that helped, because I just realized that by picking these notes up, we've lost the trail that we set to get us back out of this ancient structure...

Looks like we'll have to discover another way out, but hey that's what we *[explorers](http://imjuan.com/2016/08/19/reaching_the_end_of_the_ruby_class_jungle/)* do! Let's jump into the Object now and see what we can discover in there.

***** Insert image of going down the hole *****

***

Jumping hyena what the hell is that!? Omg it's the rest of that skull's skeleton... Looks like it's holding a note in its hand. You go take a look at it though, I'm too scared to pry it off its boney grasp.

***** insert image of the skeleton remains ****

To whom it may concern,

As you may know by now, from having traversed through the jungle and found your way to the Ruby ziggurat, that this path initially set rules for us to obey without question. Perhaps... you may or may not be asking yourself: *"What are they exactly?"*

Well my never to meet friend, this restriction that I'm speaking of is in relation to *classes*. Every Ruby class can
have only one *superclass*, it's very particular about keeping its rule of [*single inheritance*](http://rubylearning.com/satishtalim/ruby_inheritance.html), meaning it doesn't allow [*multiple class inheritance*](http://stackoverflow.com/questions/10254689/multiple-inheritance-in-ruby) to ever exist. 

Just take a look at the path that was taken to get here and you'll see what I mean:

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
```

Terminal:


```
[Village, Jungle, CampSite, Ziggurat, Object, Kernel, BasicObject]
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

If you tried to, they would just result in a type error.

Every class in Ruby ultimately ascends or descends from one single class, where its related parent or child class continue to follow suit in this hierarchical order(as class or subclass or sub-sub class, so on and so forth).

Despite what might be your first impression, Ruby’s single inheritance doesn’t
restrict you: Ruby provides modules, which are bundles of programming functionality
similar to classes (except that they don’t have instances), that you can easily graft onto
your class’s family tree to provide as many methods for your objects as you need.
(Chapter 4 will focus on modules.) There’s no limit to how richly you can model your
objects—it just can’t be done strictly with classes and inheritance.

The single inheritance principle means that you can’t just draw a big tree of entities
and then translate the tree directly into a class hierarchy. Inheritance often functions
more as a convenient way to get two or more classes to share method definitions
than as a definitive statement of how real-world objects relate to each other in terms of
generality and specificity. There’s some of that involved; every class in Ruby, for example,
ultimately descends (as subclass or sub-subclass, and so on) from the Object class,
and obviously Object is a more general class than, say, String or Ticket. But the singleinheritance
limitation means that you can’t bank on designing a hierarchy of classes
that cascade downward in strict tree-graph fashion.
Again, modules play a key role here, and they’ll get their due in chapter 4. For
now, though, we’ll follow the thread of inheritance upward, so to speak, and look at
the classes that appear at the top of the inheritance tree of every Ruby object: the
Object and BasicObject classes.


The Kernel module is included by class Object, so it's method's are available in every Ruby object.

Object is the parent class of (almost) all classes in Ruby. It's method's are therefore available to all objects unless explicitly overridden.

Object mixes in the Kernel module, making the built-in kernel functions globally accessible. Althoughthe instance methods of Object are defined by the *Kernel* module. The *Kernel* module is included by class Object, so it's methods are available in every Ruby object.
***

good query for BasicObject in TPPG pg 386-388

<pre><code>def family(the_class)
  unless the_class == nil
    puts "#{the_class}, comes from the super class:
#{the_class.superclass} . . ." 
    family(the_class.superclass)
  end
end

family(Class)
</code></pre>

Terminal:

<pre><code>Class, comes from the super class:
Module . . .
Module, comes from the super class:
Object . . .
Object, comes from the super class:
BasicObject . . .
BasicObject, comes from the super class:
 . . .
=> nil
</code></pre>

All classes in Ruby inherit from the Object class by default.
Object inherits from the BasicObject class (which was
introduced in Ruby 1.9). Object also includes the Kernel
module.

```
class Object < BasicObject
  include Kernel
end
```

<pre><code>def family(the_class, other_class)
  puts "#{the_class}, comes with these many built-in methods:"
  puts "#{the_class.methods.count} . . ."
  puts "#{other_class} however, has #{other_class.methods.count - the_class.methods.count} more methods:"
  puts "#{other_class.methods - the_class.methods} . . ."
end 

family(Class)
</code></pre>

An intersting thing to point out here is that because these methods come from Kernel, a lot of the local scope methods we use are actually being constructed as private instance methods:
https://codequizzes.wordpress.com/2014/04/22/rubys-kernel-module/

http://stackoverflow.com/questions/8894817/whats-the-difference-between-object-and-basicobject-in-ruby


