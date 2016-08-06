---
layout: post
title:  "Getting to know Classes in Ruby"
date:   2016-06-28 01:10:25 -0400
---


As my dive into Ruby continues, I am starting to comprehend the reasoning behind it's calling of an *object oriented language*.

The basic premise here is that almost everything in Ruby is supposed to be an object. But what does that mean exactly?
Well, an object is really anything from a string to an integer. And each object has built in functions or *methods* which can be used to do a lot of different things.

So why is it called a method? Well that's because it provides a *method*, or way for an object to respond to its contained messages, and then do something about that message in return.

```
name = "Juan"

age = 26
```

So here I made a name and age variable which contain two different assigned values: "Juan" and 26.

First let's ask Ruby if these two variables are indeed objects:

```
puts name.is_a?(Object)

puts age.is_a?(Object)
```

The terminal should then return:

```
true
true
```

Great! It looks like they are indeed objects. But what about their two assigned values `"Juan"` and `26`?

```
puts "Juan".is_a?(Object)

puts 26.is_a?(Object)
```

Let's see what the terminal says:

```
true
true
```

Well this is dandy and all, but you might be wondering (like I did) where do objects come from? As I mentioned earlier an object contains methods (which are objects too) that allow it to operate in some specifc, preconstructed way; and all these objects are initially stored, and defined, in a place called a `Class`.

The best way to think of a `Class` is like a blueprint to a house. The blueprint will show you all the details of the rooms, and how they should be initially built. That way when construction begins, the builders already know what layout they have to follow. And if need be, improvise it a bit to adjust an initial room for something that might not have been considered in the blueprint: but is necesarry to change during its actual construction (like when we'd have to build our very own `Class`!).

So if we follow the example above, the `Class` is the house, and the rooms are the `Object`. In fact, we can test this out with the two variables `name` and `age`. Even though these were newly created variables, they both contain methods that were already defined by Ruby to work in a specific way; which relates to their `Class`.

```
name = "Juan"

age = 26

puts name.class
puts age.class
```

What say you terminal?

```
String
Fixnum
```

Aha! We've discovered that the variables defined by the two methods are related to the `String` and `Fixnum` Classes!

<iframe src="//giphy.com/embed/HulXtVXpYe81O?html5=true&hideSocial=true" width="480" height="269" frameborder="0" class="giphy-embed" allowfullscreen=""></iframe>
**Ruby Champ tip:**


If you want to have a handy way of finding out all the methods that are related to a class you can use the Pry shell which is "a powerful alternative to the standard IRB shell for Ruby". You can find out more about `Pry` [here.](http://pryrepl.org/)

First type into your terminal:

```
gem install pry
gem install pry-doc
```
 
Then turn on the ignition by typing `pry` into the terminal and boom! You should see this: `[1] pry(main)>`
  
Okay, let's find out what's under the hood for the first Class `String` in our variable `name`.

Simply type `ls String` into the `pry` shell. You should see this come up:

```
[1] pry(main)> ls String                                                        
String.methods: try_convert                                                     
String#methods:  
  %            chop            freeze     reverse      succ                     
  *            chop!           getbyte    reverse!     succ!                    
  +            chr             gsub       rindex       sum                      
  +@           clear           gsub!      rjust        swapcase                 
  -@           codepoints      hash       rpartition   swapcase!                
  <<           concat          hex        rstrip       to_c                     
  <=>          count           include?   rstrip!      to_f                     
  ==           crypt           index      scan         to_i                     
  ===          delete          insert     scrub        to_r                     
  =~           delete!         inspect    scrub!       to_s                     
  []           downcase        intern     setbyte      to_str                   
  []=          downcase!       length     shellescape  to_sym                   
  ascii_only?  dump            lines      shellsplit   tr                       
  b            each_byte       ljust      size         tr!                      
  bytes        each_char       lstrip     slice        tr_s                     
  bytesize     each_codepoint  lstrip!    slice!       tr_s!                    
  byteslice    each_line       match      split        unicode_normalize        
  capitalize   empty?          next       squeeze      unicode_normalize!       
  capitalize!  encode          next!      squeeze!     unicode_normalized?      
  casecmp      encode!         oct        start_with?  unpack                   
  center       encoding        ord        strip        upcase                   
  chars        end_with?       partition  strip!       upcase!                  
  chomp        eql?            prepend    sub          upto                     
  chomp!       force_encoding  replace    sub!         valid_encoding?  
```

Yikes! Information overload right? Well we could always ease things up, by learning about them one at a time. To get to know what they each do just choose your method to investigate and then type into `pry`:

`show-doc Class#method`

Above, where `Class` goes is your choice `Class`. In this case it's `String`, and where `method` goes is whichever `method` you want to learn more of. For this example we'll use the `length` method of `String`:

`show-doc String#length`

This is what comes out:

```
[2] pry(main)> show-doc String#length

From: string.c (C Method):
Owner: String
Visibility: public
Signature: length()
Number of lines: 1

Returns the character length of str.
```

Pretty cool right?

Now getting back to our discussion on Classes, when we make a new object, we are in fact calling on whichever `Class` is related to its appropriate method. This is called **instantiation**.

So for `name = "Juan"`, the `name` is the specific version (instance) of the abstract idea of a `String` method.

So to wrap those final thoughts up, just remember that once the instance of a `Class` is created, we call that instance an object; and that newly formed object is instantiation.

Hopefully this has given you a first look into what it means to be an object oriented language, and how these objects all point to `Class` methods. Next time we'll get into how we can build our very own `Classes`!

Until then, happy coding!

* Juan
