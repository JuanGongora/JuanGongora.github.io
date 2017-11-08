---
layout: post
title:  "Diving deeper into Ruby's Class pool"
date:   2016-07-17 02:16:07 -0400
---

Hello and welcome to yet another guide on Ruby Classes!

On my previous blog post ["Getting to know Classes in Ruby"](http://juangongora.github.io/2016/06/28/getting_to_know_classes_in_ruby/) I talked about what objects in Ruby are and where it is they come from.

In case you didn't read it (sad face), I had left off by saying that once the instance of a class is created, we call that instance an object; and that newly formed object is *instantiation*.

But how would we get there if we are making a class.... that Ruby doesn't know of yet? By using *constructors* of course!

```
class Sheriff
  def initialize(dog)
    @dog = dog
  end
end

example = Sheriff.new("bulldog")
```

Take a look at the `Sheriff` class I just made, you'll see that the variable `example` at the very bottom was assigned `Sheriff.new("bulldog")`. 

That `.new` method is a.... *constructor*! Which is used to 'construct', and then return to you a new instance of the class you assigned it to.

So... there are three things that you should know Sheriff *constructor* is in charge of:
<iframe src="//giphy.com/embed/Ob1moknUuETAc?html5=true" width="480" height="480" frameBorder="0" class="giphy-embed" allowFullScreen></iframe><p><a href="http://giphy.com/gifs/town-sheriff-lunchbreaks-Ob1moknUuETAc"></a></p>

1) allocating space for the instantiated object  (with the merciful assistance of Ruby's [GC](http://patshaughnessy.net/2013/10/24/visualizing-garbage-collection-in-ruby-and-python))

2) assigning the values of instance variables  (in this example it's `"bulldog"`)

3) returning the instance of that class (which was activated by calling the `initialize` method)


Cool beans, now we know how to call an instance of a custom class to an object!

Okay let's rewind a bit now and look back at the class `Sheriff`. For starters, you first define a class with the keyword '*class*', which would then be followed by the *constant* of that '*class*' (which is `Sheriff` in this case). Constants will always start with a capital letter, and they are capable of storing permanent, un-altered information (if you so choose to keep it that way).

Right under `class Sheriff` we have `def initialize(dog)`. What is *initialize* you ask? When a class contains the special method named *initialize*, it automatically calls itself on the object that was created using the `.new` method.

Also notice how *initialize* is calling on the argument `dog`? That argument is what connects itself to the *instance variable* that becomes `"bulldog"`. By assiging the `@dog` field to the argument `dog`, the *instance variable* is then `initialized` when it passes the argument from `.new`.

I should probably mention that it's usually considered good practice to use *initialize* for setting the values of *instance variables*. This is because you can set values to however many arguments you'd want with only a single initialize method, in contrast to making a bunch of separate call methods for our instance variables (which also wouldn't automatically run like *initialize* does: we'd have to [hard code](http://whatis.techtarget.com/definition/hardcode) that feature).

You should start to see now that *instance variables* are what's keeping track of the states of objects. Like in my `example` variable; the object identified as `example` is the string called `"bulldog"`. This object state is what's recorded in the *instance variable* named `@dog`. This property of *instance variables,* and their survival across method calls are what makes them so resilient in containing object states throughout a program.

An important thing to recognize however is that *Instance variables* are only accessible from *instance methods* when coming from a local scope, but those *instance methods* can be declared anywhere within the program.

So when you create methods that are stored inside of a class, they are completely capable of being shared with any and all *instantiated* objects of the class. That's what an *instance method* is, and its quite a powerful design. So let's make an extra *instance method* inside of our class `Sheriff` to get a better feel for it:

```
class Sheriff
  def initialize(dog)
    @dog = dog
  end

  def bounty
    puts "Sheriff #{@dog} is on a hunt for your bounty!"
  end

end

example = Sheriff.new("bulldog")
p example.bounty
```

By adding the *instance method* `bounty` we are capable of calling it to the new instance of that object class:

`p example.bounty`

With the terminal saying:

```
Sheriff bulldog is on a hunt for your bounty!
nil
```

We can re-use this *instance method* to as many new *instantiated* `Sheriff` objects as we'd like:

```
example_two = Sheriff.new("dalmatian")
p example_two.bounty

example_three = Sheriff.new("sheepdog")
p example_three.bounty

example_four = Sheriff.new("greyhound")
p example_four.bounty
```

Terminal:

```
Sheriff dalmatian is on a hunt for your bounty!
nil
Sheriff sheepdog is on a hunt for your bounty!
nil
Sheriff greyhound is on a hunt for your bounty!
nil
```

So again, all objects of the same class have the same behaviors, even if they contain different states.

You might be wondering though, how else can we gain access to or even change the variables of our *instantiated* objects? That is in a more thorough way than [string interpolation](https://rubymonk.com/learning/books/1-ruby-primer/chapters/5-strings/lessons/31-string-basics): which is what I did in the *instance method* `bounty`, to get the name of the *instance variable* `"bulldog"` and the like to print out. 

That's where *accessor methods* come in! Their purpose and use is actually pretty straight forward. First off we have to create a method that returns the value of the instance `@dog` when we call it on an object.

```
def get_dog
  @dog
end
```

Now how about if we wanted to change the name state of our *instance variable* to something else? Here's the syntax for it:

```
def set_dog=(dog)
  @dog = dog
end
```

All together now:

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

  def bounty
    puts "Sheriff #{@dog} is on a hunt for your bounty!"
  end

end
```

Let's test the two *accessor methods*, and see what the terminal will spit out:

```
example = Sheriff.new("bulldog")
p example.get_dog
example.set_dog=("chihuahua")
p example.get_dog
```

Terminal:

```
"bulldog"
"chihuahua"
```

As you can see by implementing the `get_dog` method to `example`, we print out the *instance variable* assigned to it. While `set_dog` converts the *instance variable* to another name. This is proven by calling the `get_dog` method yet again: with the returned value no longer being`"bulldog"`, it's now become `"chihuahua"`.

Now to quickly recap what has been covered thus far:

* Ruby is about objects, and objects are instances of classes
* to make a new class you start with the keyword *'class*' (all lower case) and follow it up with the name you'd like to call it, which has to start with an uppercase letter
* `.new` is a *constructor* and is a member of the *class method*
* *initialize* is used to assign *instance variables* and is an *instance method* itself
* variables that have the @ character are *instance variables* which belong to object instances of that class
* when an *instance variable* is made inside a method's class, it can be used by anything within the parameters of that class
* *instance methods* are associated with the instance of a class, so are capable of being called on any instantiated objects of the same class 
* *accessor methods* can help us obtain the variables of a class object, as well as assign new values to pre-existing variables

Phew!!

I hope that what you've gathered from this guide has helped you (and myself!) get a better grasp into class construction. There's still a couple more bells and whistles to be told about classes, but that discussion is for another day. One thing that I continue to recognize is how similar in likeness Ruby is to [Russian dolls](https://en.wikipedia.org/wiki/Matryoshka_doll):

<iframe src="//giphy.com/embed/Os4rZlR0VNxE4?html5=true" width="480" height="480" frameBorder="0" class="giphy-embed" allowFullScreen></iframe><p><a href="http://giphy.com/gifs/matryoshka-dolls-Os4rZlR0VNxE4"></a></p>

The more you dig into it, the more you'll recoginze that there is always something inside of something. Including the fact that the all powerful *class* is actually a child of the parent superclass: *module*! 

So until next time, happy coding!

* Juan
