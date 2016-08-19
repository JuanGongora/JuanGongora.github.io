---
layout: post
title:  "Reaching the end of the Ruby Class Jungle"
date:   2016-08-18 22:21:57 -0400
---


I know it's hard to believe... But there's still a lot more ground to cover on our journey into Ruby's classes. They are after all very beautiful and elaborate in their nature: such things should take time to appreciate and understand.

That means pick up your walking stick, pat the dust off your Indiana Jones hat, and let's depart where we left off...

In my last blog [Diving deeper into Ruby's Class pool](http://juangongora.github.io/2016/07/17/diving_deeper_into_rubys_class_pool/), I explained how a class's innards are filled with *instance variables*, that keep track of the state of instantiated objects: as well as *instance methods,* which contain the variables that are associated with the instance of a class.

**Class Variables**

Okay, so I want to introduce another fellow to the group... It's name? *Class variables*! These variables begin with two @@ symbols (not to be confused with *instance variables* which start with only one @) and are always set at the top tier of your class body.  One major difference between a *class variable* and an *instance variable* is the inheritance of their values: one allows them to be automatically shared to other classes under the same family hierarchy, while the other doesn't. What does that mean? Well let's write an example below:


```
class Alien
  @@count = 13
  
  def get_share
    @share = 9
  end
  
  def get_count
    @@count
  end

end
```

This class called `Alien` contains the *class variable* `@@count` which is set to the default value of `13`. Right under it is an *instance method* with the *instance variable* `@share` at the default of `9`. 


The `get_count` *accessor method* is used to retrieve the value of the *class variable* `@@count`, just like `get_share` does for the *instance variable* `@share`.


```
class Robot < Alien

  def get_share
    @share = 10
  end

  @@count = 14

end
```

Here we create a child class (`Robot`) of the parent class `Alien`. This is done by simply adding a `<` right after the class name, followed by the name of the parent class: `class Robot < Alien`. With `Robot` becoming a member of the `Alien` class, it automatically inherits whatever features were inside of it. But we want to change those values to see the difference in inheritance from an *instance variable* to a *class variable*. Hence `@share = 10` and `@@count = 14`.

Let's test it out then by making new instances of the `Alien` and `Robot` classes, and using their built methods for our terminal to interpret their changing values:

```
a = Alien.new
b = Robot.new
c = Alien.new

p a.get_share
p b.get_share
p c.get_share

p a.get_count
p b.get_count
p c.get_count
```

Okay terminal time...

```
9
10
9
14
14
14
```

We can see now that the value of `@@count` was altered by `Robot`: and then it shared that same value throughout the family classes. Although `@share` seems to have retained its original instance value from `Alien`, even though we changed that value in the `Robot` class. That's because the *instance variable* from `Alien` does not recognize the altered state of `@share` from `Robot`, it only recognizes its own.

To dive deeper into why that's so, we have to remember that a class isn’t the *same object* as any of its instances, and no two instances under the same class are going to be alike. Therefore it’s impossible, by definition, for a class to share *instance variables* with its instances.

But because of a *class variables'* cross communication with its class family, you are capable of outright altering its overall value at any point in time: even if the new value was set in a child class. This means that whatever new value you choose will also be the very same for all related sub classes, including even the parent class:

```
class Alien
  @@count = 13

  def get_count
    @@count
  end

end

class Robot < Alien
  @@count = 8
end

class Human < Alien
  @@count = 3
end

a = Alien.new
p a.get_count

b = Robot.new
p b.get_count

c = Human.new
p c.get_count
```

Terminal says...

```
3
3
3
```

As you can see from above, the value of `@@count` was converted to 3: which was set from the last `@@count` alteration in class `Human` onto all the other family classes.

**Class Methods**

Something to note about *class variables* is that they do have a specific gap in regards to visibility. That is, when it comes to a class and its instances, a *class variable* is private to that class alone. So if you want to make them accessible to the outside world, you can continue using *instance methods* like we already have been doing: or you can use what's called a *class method*:
 
```
class Alien
  @@count = 13

  def self.get_count
    @@count
  end

  def get_count_instance
    @@count
  end
	
end
```
 
 Above, *self.get_count* is a *class method* – that is, it belongs to the *Alien* class rather than to an instance of the *Alien* class. Let's continue on the above sample to further explain this:

```
p Alien.get_count
p Alien.get_count_instance
```

What do you think the terminal will print out?

```
13
(eval):14: undefined method `get_count_instance' for Alien:Class (NoMethodError)
```

Hmm it looks like *get_count_instance* wasn't able to print out the value of *@@count* like *self.get_count* did. In order to do so we have to do this:

```
a = Alien.new
p a.get_count_instance
```
 
Which is what we had been doing earlier in order to obtain the *class variable* *@@count*.

That explains how we can invoke the *class method* from `Alien` itself rather than having to invoke it from a new `Alien` object.
 
If we wanted to have an* instance method* that was called like a *class method* (i.e. not from an instantiated object but from the class itself) we'd have to tweak it like so:
 
```
class Alien
  @@count = 13
  @share = 9

  def self.get_count
    @@count
  end

  class << self
    def get_share
      @share
    end
  end

end
```

This class called `Alien` contains the *class variable* `@@count` which is set to the default value of `13`. Right under it is an *instance variable* `@share` with the default of `9`.

The *class method* `self.get_count` is used to retrieve the value of the *class variable* `@@count`.

Here's the change:

`class << self` opens up [self's](https://www.jimmycuadra.com/posts/self-in-ruby/) *singleton class*, so that methods can be redefined for the current self object, this is used in order to define and call the method `get_share` with the class `Alien` itself.


```
p Alien.get_count
p Alien.get_share
```

Okay terminal time...

```
13
9
```
 
 Awesome sauce! It gave us the value of the instance in the same calling format as our *class method*. But there's a catch:
 
```
class Robot < Alien
end

p Robot.get_count
p Robot.get_share
```

Terminal says:

```
13
nil
```

This result brings us back to the original nature of an *instance variable*(nonlinear inheritance). So at first `get_share` worked with `Alien`, and was equivalent to calling like a *class method*. But the way it does it is a little more subtle. 

The secret is that `self`, in this context (`class << self`) actually refers to the object `Alien`(remember that classes are also objects). But this `Alien` that it refers to is a unique, anonymous subclass of the original class `Alien`. This subclass is the *singleton class*. So here `get_share` creates a new method called into `Alien`'s *singleton class*, which becomes accessible by the normal method call `Alien.get_share`. But as soon as you make a child class of `Alien`, in this case `Robot`, it will not be able to recognize the inheritance of that `get_share` method: simply because it is a method of `Alien`'s *singleton class*, not its primary class `Alien`.

Phew! I know it can be confusing at first...
<iframe src="//giphy.com/embed/eCLe22tOkYfTi?html5=true" width="480" height="220" frameBorder="0" class="giphy-embed" allowFullScreen></iframe><p><a href="http://giphy.com/gifs/her-would-eCLe22tOkYfTi"></a></p>

(If you need a little more run through on this subject, you can check this great [article](http://yehudakatz.com/2009/11/15/metaprogramming-in-ruby-its-all-about-the-self/) out for more examples...)

Now to sum things up with all this *class method* business... a *class method* is defined directly on the class object: in that *singleton-method* style. A [*singleton method*](https://codequizzes.wordpress.com/2014/05/06/ways-to-define-singleton-methods-in-ruby/) defined on a class object is commonly referred to as a *class method* of the class that it was defined in. The idea of a *class method* is that you send a message to the object that’s the class rather than to one of the class’s instances. So... the message of a *class method* goes to the class, not to a particular instance of that class.

**Attribute Accessors**

I want to segue our way back to a topic that was covered in my last blog: which is *accessor methods*. These methods help us obtain the variables of a class object, as well as assign new values to pre-existing variables. Below is the code snippet that was used in [Diving deeper into Ruby's Class pool](http://juangongora.github.io/2016/07/17/diving_deeper_into_rubys_class_pool/):

```
class Sheriff
  def initialize(dog)
    @dog = dog
  end

  def get_dog
    @dog
  end
  
  def set_dog=(dog)
    @dog = dog
  end
	
end
```

Above we've got an object initializer for the instance variable `@dog` as well as a *getter*(`get_dog`) and *setter*(`set_dog`) method for the variable `@dog`.

There’s something we can do to trim these though. Ruby provides a unique way to let us write *getter* and *setter* methods without having to stick a `'set'` or `'get'` in front of a word like `'dog'`. Let's revise the code below:

```
class Sheriff
  attr_reader :dog
  attr_writer :dog
	
  def initialize(dog)
    @dog = dog
  end
	
end
``` 

Here we introduce the famous *attribute methods*. our `get_dog` method was converted to `attr_reader`(attribute reader) and our `set_dog=(dog)` method changed to  `attr_writer`(attribute writer). With those single lines, we shortened our methods and kept their operations the same!

You probably also noticed how the *attribute method* calls without an explicit receiver: so there’s no left-hand
object and no dot before `attr` written here. Thats because when there isn't an explicit receiver, the messages instead go to *self*, which is the default object. So the object receiving the `attr_reader` message is the actual class object `Sheriff`.

The elements that start with colons(`:dog`) are symbols. [Symbols](http://rubylearning.com/satishtalim/ruby_symbols.html) are the names of *strings*, *instance variables*, *methods*, *classes*, etc. A *symbol* is basically used to just represent some kind of state. So if there is an *instance variable* called `@dog`, then there automatically will be a symbol called `:dog`.

That's what we have going on for both our *attribute methods*, they are linking themselves to work with the initialized *instance variable* `@dog`.

Let's watch them at work:

```
m = Sheriff.new("monk")
p m.dog
m.dog=("fish")
p m.dog
```

Terminal:

```
"monk"
"fish"
```

Cool beans, it works just like our old *accessor methods*. But there's one more thing we can do to shorten our code even more. Ruby has a single method, `attr_accessor`(attribute accessor), which is the combination of `attr_reader` plus `attr_writer`: all wrapped up into one! Let's use this method to shorten our code below:

```
class Sheriff
  attr_accessor :dog
	
  def initialize(dog)
    @dog = dog
  end
	
end
``` 

And it works just the same! You can define *attribute accessors* in order to get directly at the variables within the instance.

**The super of Superclasses**

As we push through the canopy of the Ruby Class jungle, we've discovered a couple of different ways class inheritance shares its family methods and/or variables. But as I'm sure you've noticed, some of the operations we've used for sharing class elements have had restrictions when making value or method alterations . 

Ruby graciously offers a unique keyword called *super*, which relates itself to the superclass(or parent class) in the inheritance chain.

This beauty allows us to trigger methods from parent classes right onto child classes for functionality sharing. As well as being capable of making child classes further expand their inherited methods. Let's work on this below to sample what I mean:

```
class Sheriff
  attr_accessor :dog

  def initialize(dog)
    @dog = dog
  end

  def bounty
    puts "Sheriff #{@dog} is on a hunt for your bounty!"
  end

end
```

This is where we are starting. It should look familiar to you from what we have already been working on. The only new addition is the method `bounty`.

```
class Deputy < Sheriff
  attr_accessor :cat
  def initialize(dog, cat)
  super(dog)
    @cat = cat
  end
end
```

Alright, now we have a child of `Sheriff` to fiddle around with. First thing's first, we have included the `super` keyword under the initializer of `Deputy`'s *instance method*. This method has two elements: `dog` and `cat`. The argument `dog` is a link to the `@dog` *instance variable*, which is being called by `super(dog)`. This calling from super, will send the argument `dog` for initialization in the parent(super) class `Sheriff`. 

Thanks to that ability, we are able to connect the initialization method in `Sheriff` right into `Deputy` without impurity
of the *parent's* method state. We have then added our own extra initialized *instance variable* into the mix: `@cat`. This shows us how we were able to create additional features on top of `Sheriff`'s `@dog` initializer, without having to break any of the parent's original method code.

Let's add another `super` that works with `Sheriff`'s `bounty` class to see how it works on a non initialized method:

```
class Deputy < Sheriff
  attr_accessor :cat
  def initialize(dog, cat)
  super(dog)
    @cat = cat
  end

  def bounty
    puts "I'm starting from the bounty method in class Deputy."
    super
    puts "I'm back from the super call to class Sheriff's bounty method."
    puts "Deputy #{cat} is not amused by our example..."
  end

end
```


When you call super with no arguments, Ruby sends a message to the current object's parent(`Sheriff`), asking it to invoke a method of the same name as the current method(`bounty`). It then passes to `super` whatever parameters were executed in the parent, right back to the current method. Let's test it out:

```
a = Deputy.new("Hal", "Squid")
p a.bounty
```

Terminal:

```
I'm starting from the bounty method in class Deputy.
Sheriff Hal is on a hunt for your bounty!
I'm back from the super call to class Sheriff's bounty method.
Deputy Squid is not amused by our example...
nil
```

We can see from above that the method begins implementing its code from its own class (`Deputy`) until it reaches `super`. Once it got there, `super` instantly begins jumping up through the class hierarchy: that is until it finds another method called `bounty`. `bounty` is then found in the class `Sheriff`, so the method executes the code inside the parent class, and then when completed, jumps back to the method `bounty` from class `Deputy` to finish executing the rest of the remaining code.


**Looking for the ancestor in charge of the Ziggurat**

We've gone a long way in search of our inheritance. Finding various forms that clue us in on the inner mysteries of Ruby's Class hierarchy. We're now at the heart of the jungle, where we see a massive ziggurat spike itself up and up to the highest clouds where even the birds can't reach.

As we walk towards the structure we start to make out what looks like a sealed tomb entrance. There's an inscrition on the wall... It says: 

> *"Ye who wish to enter must re-cap what was taught: otherwise, the passage to the halls of Module will forever remain sealed."*

I guess we better listen to it...

* Variables which begin with two @@ characters are called *class variables*. They are private to a class and its instances, but when accessed through *accessor methods* you have the convenience of not having to write `self.class` from an instance object. You also get automatic sharing throughout the class hierarchy.
* *Class methods* differ from *instance methods* by their method definition: which places the class name and a period in front of the method's name. *Class methods* are for things that don't operate on the individual instance of an object, or for cases where you don't have the instance available to you. It's primary use is for updating all users of the class to a specific condition.
* From the sample class `Alien` written earlier above, remember that at the outer level of a class definition, and inside the *class methods*, `self` is the class object `Alien` whereas in the *instance methods*, `self` is the instance of `Alien` that’s calling the method.
* With *attribute accessors*, Ruby provides us with an easy way to access an object’s variables. An*attribute accessor* is the property of an object whose value can be read and/or written through the object itself.
* Ruby's an [interpreted](https://en.wikipedia.org/wiki/Interpreted_language) language, so it keeps its [Symbol Table](http://blog.khd.me/ruby/ruby-symbols/) handy at all times. You can find out what's on it at any given moment by calling `Symbol.all_symbols`.

Whooa!! 

A massive grinding sound begins to echo all around us, scaring all the wild birds to swarm out of the tree thickets and onto the skies. As the rumble begins to slow down we see clouds of dust start to flow from the cracks of the tomb entrance...

Bang!! The granite wall blocking the entrance falls straight forward! Good thing we weren't standing that close to it. We can't see anything inside though, it's too dark... 

Let's camp out at the entrance for the night, before starting into the ziggurat. We need to rest our feet before going into the first hall of this ancient structure... *Modules* I believe it was called?
