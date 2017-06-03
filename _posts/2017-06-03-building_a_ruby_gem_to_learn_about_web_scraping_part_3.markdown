---
layout: post
title:  Building a Ruby gem to learn about web scraping (Part 3)
date:   2017-06-03 16:11:18 -0400
---

In the previous part, I showed how I built a *sqlite3* integration into my *Ruby* methods, so that I could build a database to store my scraped content. In this section, I'm going to build up the differentiation between the classes that store information, that is based on user choice. If you'd like to check out *Part 2* before continuing, please click [here](http://imjuan.com/2017/05/29/building_a_ruby_gem_to_learn_about_web_scraping_part_2/).

**Working Up the MTG Class**

It's been awhile since I've revised my `MTG` class:

<div class="noborder" style="overflow: auto; width:730px; height: 563px;">
    <div class="noborder" style="width: 724px;">
        <img src="http://i.imgur.com/cxG3PuI.png" style="float: left; width: 724px; height: 546px; margin: 0 5px;" alt="class MTG">
    </div>
</div>

If you remember, I had hinted at making some new methods for `MTG` by referencing method calls in the `Parser` class array `@@overall_format_options`. The premise for making these is to have `MTG` store the data that is collected from the *table* classes into instances that can be saved and displayed in the terminal, that is depending on which one the user prompted to have displayed.

As it stands, `MTG` has a generalized way to store and display card information. I'm going to build up the current code concept of this class, and make methods that are particular to a *table* class.

First concept to work on is replace the `@@all_cards` class variable with one that is related to a *table* class. I'll start with `@@modern_up` for now, which represents the class that has the rising price cards for the [*modern format*](http://magic.wizards.com/en/game-info/gameplay/formats/modern). With this class variable, I'm going to do the same thing that I was working on before, which is store instances of cards related to that class inside of this class variable.

```
#new instance will be created with already assigned values to MTG attrs
def initialize(attributes)
    attributes.each {|key, value| self.send("#{key}=", value)}
end

def save_modern_up
    @@modern_up << self
end

def MTG.create_modern_up(attributes)
    #allows cards instance to auto return thanks to tap implementation
    cards = MTG.new(attributes).tap {|card| card.save_modern_up}
end
```

Here I have split the default initialize method and the storing of instances from the class variable into two separate components. The reason behind this is so that I can create separate instances that are only relatable to their appropriate *table* class.

I then put both `initialize(attributes)` and `save_modern_up` into a custom constructor, `MTG.create_modern_up(attributes)`, and am therefore able to call, store, and return the instances that I want for my *table* class *within* my `MTG` class! I can now repeat this same pattern for the rest of the *table* classes. 

Something that I need to revise however is my `MTG.all` method, now that I have separated my *table* classes into their own constructors within `MTG`.

```
def MTG.all(format)
    #iterate through each instance that was appended into class variable during initialization
    format.each_with_index do |card, number|
        puts ""
        puts "|- #{number + 1} -|".fg COLORS[4]
        puts ""
        #line below helps resolve glitch that allows 'ghost/invalid' cards to be selected from Parser.purchase
        if number < Parser.table_length
            #iterate through each instance method that was defined for the stored instance variable
            card.instance_variables.each_with_index do |value, index|
                #returns the value of the instance method applied to the instance
                #with an index value of the first/last, key/value pairs ordered in Parser.scrape_cards
                #associates a named definition of the values by titling it from constant ATTRIBUTES
                if index < 4
                    puts "#{ATTRIBUTES[index].fg COLORS[2]} #{card.instance_variable_get(value)}"
                end
            end
        end
        puts ""
        print "                                                 ".bg COLORS[7]
    end
end
```

I've changed a few things here from my original `MTG.all` method. To start it off I now have it accept an argument, which will be one of the class variables related to a *table* class. This way I can again variate which instances I want to have displayed. 

The next change is the if statement `if number < Parser.table_length`. I have created a method inside of `Parser` that will help my iteration know for how long it should continue looping:

```
def Parser.table_length
    @@overall_card_rows
end
```

Remember that `@@overall_card_rows` tells us how many cards there are in a current format by scraping the site's rows with the method `Parser.card_counter` storing the value into that class variable.

The reason that I am counting the index of the `format` argument above to the row length in `Parser.table_length`, is to resolve a glitch that would allow *ghost/invalid* cards to be selected from `Parser.purchase`; due to the possibility of scraping empty rows from the site.

The next change is including another if statement inside of the `card` iterator: `if index < 4`. This one is pretty straight forward. I am declaring the puts method `puts "#{ATTRIBUTES[index].fg COLORS[2]} #{card.instance_variable_get(value)}"` to only occur while the index is less than 4. Once it hits 4 I have displayed all the *getter methods* for that instance, with the assigned names from my `ATTRIBUTES` array. This is done so that I don't have an error created from *ghost/invalid* cards that may not have been picked up from my first if statement: `if number < Parser.table_length`.

You may be wondering now how it is that I get the *table* related class variable to be assigned as the argument for `MTG.all(format)`. Here's how I envisioned it:

```
def MTG.search_modern_up
  self.all(@@modern_up)
end
```

I simply have the *table* related class be called as its own method within `MTG`, which then automatically stores the argument for my `MTG.all(format)` as the class variable of that *table* class.

There are just two more method types that I want to include before I can finish off my newly revised `MTG` class. One of them is an error catching method that works to implement what `MTG.search_modern_up` does above(as well as its other subsequent *tables* class methods):

```
def MTG.store_temp_array(array)
    @@temp_array = array
    self.all(@@temp_array)
    @@temp_array.clear
end
```

This method was worked up from some testing I was doing, where I was having my `MTG.all(format)` display various repetitive calls that I prompted to my different formats. I found that if I kept calling the same option non-stop I would end up getting duplicate displays of the same content, even though my *sql* table wasn't storing duplicate cards, and my class variable array(`@@modern_up` for example) was also not storing duplicate instances.

I found that the best way to resolve this problem without forcing my `Parser` class to re-scrape the content yet again(which is something I wanted to avoid if possible, as that would put unnecessary load time) was by temporarily assigning the values of one of the *table* class variables into the `@@temp_array`. This temporary class variable would then have the exact same content as one of the *table* class variables, and would then be run as the argument for `MTG.all(format)`. After it completed this operation, it then cleans itself out(`@@temp_array.clear`), so that the next time that the user has requested input for an already scraped format, the method can be re-used for that particular user choice.

You may be asking yourself, how do you then declare the right *array* argument for the `MTG.store_temp_array(array)` method? This one's a simple solution:

```
def MTG.modern_up
    @@modern_up
end
```

I simply have a method that is returning that particular class variable, for which I will then put this method inside of `MTG.store_temp_array(array)` as its literal argument. Now that I have this done I can show you the `MTG` class altogether, and will now be able to fully implement these features into the `Parser` class for you to see:

<div class="noborder" style="overflow: auto; width:730px; height: 1880px;">
    <div class="noborder" style="width: 864px;">
        <img src="http://i.imgur.com/PZbEqKc.png" style="float: left; width: 864px; height: 1863px; margin: 0 5px;" alt="class MTG revised">
    </div>
</div>

**Upgrading Class Parser**

 Now that I have freshened up my `MTG` class, you most likely have a better grasp of what's going on in my `Parser.select_format` method:
 
 <div class="noborder" style="overflow: auto; width:730px; height: 300px;">
    <div class="noborder" style="width: 2376px;">
        <img src="http://i.imgur.com/MpNSmXb.png" style="float: left; width: 2376px; height: 283px; margin: 0 5px;" alt="Parser.select_format">
    </div>
</div>
 
Those stored methods at the end of the arrays will help me to make my `Parser.scrape_cards` method more adaptable to what the user chooses. So let's get to it and revise that method with the new features I have built in `MTG`.

<div class="noborder" style="overflow: auto; width:730px; height: 446px;">
    <div class="noborder" style="width: 1134px;">
        <img src="http://i.imgur.com/GV1iYim.png" style="float: left; width: 1134px; height: 429px; margin: 0 5px;" alt="class Parser.scrape_cards">
    </div>
</div>

To start things off, I have my `Parser.scrape_cards` method run the `Parser.card_counter` method so that I can let the user know just how many cards are going to be loaded for the option they chose.

It then goes into an *if* statement that is putting to use the implementation of the `Parser.select_format` method to gather the correct array, relative to the *table* class that the user chose. For this particular statement, it is using the last index of the array. So, if for example the user had chosen the input to be `1`, then the resulting method call would be `MTG.method(:standard_up)`.

You can think of it like just calling `MTG.standard_up.empty?`. I am first calling the method to have it return to me whatever the value for `@@standard_up` is, then I am checking to see if that class variable has stored any information with the [`.empty?`](https://apidock.com/ruby/Array/empty%3F) method. If it is empy then it will return `true`, and if not then `false`.

For the *false* result I am using the hack method `MTG.store_temp_array(array)`, which uses the temporary class variable(`@@temp_array`) to copy the already parsed content(i.e. the input selected *table* class) and then have it run as the argument for `MTG.all(format)` internally. This way I am not re-scraping the site, I am simply showing what was already stored in the class variable since it returned to me a `false` statement for the `.empty?` method.

If however, I get a `true` return for `.empty?` I then go to my *else* block. I first start it off by making a `sql` table that is related to that *table* class, by calling the stored method in index `5` of the `@@overall_format_options` array(so it would be `StandardRise.method(:create_table)` for example).

The next step is just having the local variable `doc` search for the related cards to the chosen class. I do this by allocating the initial `css` selector stored in `@@overall_format_options[0]` as the argument for the `.css` method(which could be the string `"#top50Standard tr"` for example).

From that point on I begin to iterate through each row of that `css` id. There's a new custom method that I implement at this point however, and I assign it to the local variable `row`. Let me quickly show you what it is:

<div class="noborder" style="overflow: auto; width:730px; height: 227px;">
    <div class="noborder" style="width: 820px;">
        <img src="http://i.imgur.com/7KMuahB.png" style="float: left; width: 820px; height: 210px; margin: 0 5px;" alt="class Parser.parser_format">
    </div>
</div>

What I'm doing here is comparing the class name to the string options in my *if/else* statement with this mini method:

```
def Parser.format_name
  "#{@@overall_format_options[6]}"
end
```

Where the value for index `6` of the class variable array is simply the name of the *table* class. So because the `@@overall_format_options` array is already constructed to work with the features related to a chosen *table* class, it will already know its own class name.

Therefore, when it has returned a true statement for one of the comparisons, the related custom constructor from within the `MTG` class is run for that appropriate *table* class. This then takes in the argument as an initialized *hash* from `MTG`'s initialize method, which is why the hash with the key and css selector values inside of `Parser.scrape_cards` works. 

Visual reminder of class `MTG`'s constructors:

```
#new instance will be created with already assigned values to MTG attrs
def initialize(attributes)
  attributes.each {|key, value| self.send("#{key}=", value)}
end

def MTG.create_standard_up(attributes)
  cards = MTG.new(attributes).tap {|card| card.save_standard_up}
end

def save_standard_up
  @@standard_up << self
end
```

Finally, the last step for this `Parser.scrape_cards` method is `@@overall_format_options[6].create(hash)` at the end of the `doc` iterator(after the `row` variable).

To continue my example for the user input of `1`, at `Parser.select_format`, this index of `6` for `@@overall_format_options` would then become `StandardRise`. That's right, simply the class name, which becomes the reciever of the method `.create(hash)`.

`.create(hash)` by the way, is one of the constructor class methods that was included from the `Persistable` module. This method will dynamically create a new instance with the assigned attributes for that *table* class, as well as the set values by doing mass assignment of the hash's *key/value* pairs. It then concludes by saving that new instance with all its related information into the database.

```
#=> from Persistable::ClassMethods

def create(attributes_hash)
  self.new.tap do |card|
    attributes_hash.each do |key, value|
      #sending the new instance the key name as a setter with the value
      card.send("#{key}=", value)
    end
    card.save  #storing it into the database
  end
end
```

Phew! That concludes my explanation on how `Parser.scrape_cards` works, for now...

**Finishing Up Class CLI**

I've done quite a few changes since I last touched class `CLI`. With the introduction of the database integration from the module `Persistable`, and the upgrades to the `Parser` class. It's time that I mold all of these operations into one control point for the end user to work with.

<div class="noborder" style="overflow: auto; width:730px; height: 407px;">
    <div class="noborder" style="width: 840px;">
        <img src="http://i.imgur.com/mqYN1dk.png" style="float: left; width: 840px; height: 390px; margin: 0 5px;" alt="class CLI">
    </div>
</div>

What I currently have works to a certain degree, but there's a lot more versatility that I can add to it now. First I'm going to be splitting up some of the concepts that I want for the CLI into their own methods.

```
def CLI.start
    puts "Powered by MTG$ (mtgprice.com)"; sleep(0.5);
    puts "-------------------------------------------------"
    puts "Please select your price trend Format:"
    puts "-------------------------------------------------"
    puts "#{"|Last Update|".fg COLORS[6]}#{Parser.update_date}"
    puts "-------------------------------------------------"
    self.set_choosing
end
```

This is going to stay as the first method that is run by my gem. I took a couple of strings out from the original and replaced it with the `CLI.set_choosing` method, which I will describe below very soon. First I want to show the other split methods that will work to build it.

```
def CLI.set_text
    puts "#{"[1]".fg COLORS[3]} Standard: #{"rising".fg COLORS[4]} cards today"
    puts "#{"[2]".fg COLORS[3]} Modern: #{"rising".fg COLORS[4]} cards today"
    puts "#{"[3]".fg COLORS[3]} Standard: #{"crashing".fg COLORS[6]} cards today"
    puts "#{"[4]".fg COLORS[3]} Modern: #{"crashing".fg COLORS[6]} cards today"
    puts "-------------------------------------------------"
end
```

`CLI.set_text` is pretty straight forward, it will show us what options are available to choose from in terms of card formats.

```
def CLI.options_text
    puts "Would you like to?"
    puts "#{"[1]".fg COLORS[3]} search for a different format's market?"
    puts "#{"[2]".fg COLORS[3]} save the current card search listing into a CSV file?"
    puts "#{"[3]".fg COLORS[3]} purchase one of the queried cards in the open market?"
    puts "#{"[4]".fg COLORS[3]} exit the program?"
    puts "-------------------------------------------------"
end
```

This method will display to the user the various available sub-options, after they have already initialized a format choice for the first time. Notice that `CLI.options_text` is showing the user *written* options of the methods I just built from class `Parser` and the *included* `Persistable` module?

```
def CLI.set_input
    sleep(1)
    puts "Please type out the #{"number".fg COLORS[3]} of the format you would like to see from above..."
    Parser.select_format
end
```

I left this method the same as its predecessor `CLI.check_input`. The only real change is the name, as well as the fact that `Parser.select_format` is a much more in depth method than it used to be.

```
def CLI.set_choosing
    self.set_text
    self.set_input
    Parser.scrape_cards
    Parser.display_cards
    puts ""
    puts "-------------------------------------------------"
    puts ""
    self.options_text
    self.options_input
end 
```

And here it is! `CLI.set_choosing` combines all those methods into one container, which will be able to do various operations, yet the method itself is not a complex design. Thankfully, the method names I chose were clear enough that just by looking at the body of `CLI.set_choosing` we can figure out what's going on without too much head scratching. 

The only part that is still unfamiliar is the last method, `CLI.options_input`. But this method, is just the follow up reference to whatever the user chose for the displayed options in `CLI.options_text`.

```
def CLI.options_input
    input = gets.strip.to_i
    if input == 1
        puts "Please select your price trend Format:"
        self.set_choosing
    elsif input == 2
        Parser.csv
        sleep(2)
        self.options_text
        self.options_input
    elsif input == 3
        puts "Please type out the #{"number".fg COLORS[4]} from one of the above searched cards:"
        Parser.purchase
        sleep(2.5)
        self.options_text
        self.options_input
    elsif input == 4
        puts ""
        puts ""
        puts "Thank you for using #{"MTG".fg COLORS[6]} #{"CARD".fg COLORS[5]} #{"FINDER".fg COLORS[4]}"
        puts "-----------------------------------"
        exit
    else
        puts "That is not a valid option"
        self.options_input
    end
end
```

I collect the user choice in the local variable `input`, and then vary the result with an *if/else* statement. If you look at the options from `CLI.options_text` again you'll see that the follow up results match.

I create some recursion in this method for each of the statements, so that the result is fluid enough that it can continue operating for as long as the user wishes it to.

Probably the last thing that I want to do for class `CLI` is have there be a way that my database is cleared out of old content, for the next time that this gem is run. Since it has content that is regularly updated, I don't want the user to get the wrong prices for cards. 

For this case, since it is something that is clearing out my old scraping data, it should probably be contained within the `Parser` class. 

<div class="noborder" style="overflow: auto; width:750px; height: 111px;">
    <div class="noborder" style="width: 1176px;">
        <img src="http://i.imgur.com/gD6tChp.jpg" style="float: left; width: 1176px; height: 94px; margin: 0 5px;" alt="Parser.reset_query_info method">
    </div>
</div>

The `@@time_review` class variable is an array that holds the method [container trick](https://stackoverflow.com/questions/13948910/ruby-methods-as-array-elements-how-do-they-work) for each *table* class. With the method responding to clear out the existing `sql` tables:

```
#=> from Persistable::ClassMethods

def remove_table
  sql = <<-SQL
          DROP TABLE IF EXISTS #{self.table_name}
  SQL

  DB[:conn].execute(sql)
end
```

I then iterate through `@@time_review`, declaring the index during its iteration so that the contained method can be called for each one.

Now that I have this method completed, I will put it on the first line of `CLI.start`. This way, right when my gem is re-run, it can gather the new information, and get rid of the old.

Here is the newly revised class `CLI` altogether:

<div class="noborder" style="overflow: auto; width:750px; height: 1236px;">
    <div class="noborder" style="width: 824px;">
        <img src="http://i.imgur.com/EQLjWMr.jpg" style="float: left; width: 824px; height: 1219px; margin: 0 5px;" alt="Class CLI Revised">
    </div>
</div>


**Revisiting Class Parser**

I know, I've been doing a lot revisits to this class. But there is just one final thing that I want to do before I can say that the application is fully operational.

What I'm going to refactor works as it is, but I want to add in some error catching methods for my main method `Parser.scrape_cards`. Since this method is in charge of creating the overall functionality of my application, it wouldn't hurt to be cautious.

Here is my `Parser.scrape_cards` method as it stands:

<div class="noborder" style="overflow: auto; width:730px; height: 446px;">
    <div class="noborder" style="width: 1134px;">
        <img src="http://i.imgur.com/GV1iYim.png" style="float: left; width: 1134px; height: 429px; margin: 0 5px;" alt="class Parser.scrape_cards">
    </div>
</div>

The first thing I want to do is simple, I want to add an extra safety buffer for the last contained line inside of the `doc` iterator: `@@overall_format_options[6].create(hash)`.

As you might remember, this code adds in all of the methods and values for an instance as its own row of data into the `sql` table. And it will continue to do this for however many card instances there are for that particular format option.

The problem is, that sometimes there could be a chance that there is a duplicate re-run of the same content, or there are empty rows with no actual content from the website itself. I found after some trial and error, that the best way to figure out how much data should be pushed into the database, is by first comparing the row count from the `css` code, to the number of created instances for each card.

What this means is that I will then be sure that I am never inserting more information than what was initially recognized as a viable *card* row, into the database. To make this happen I first took the already stored result of `@@overall_card_rows` from my `Parser.card_counter` method as its own separate entity, so that I can call on it:

```
def Parser.table_length
  @@overall_card_rows
end
```

Then I made a method in the `Persistable` module that can compare itself to what `Parser.table_length` is during runtime. Which will simply view the amount of card data currently stored in the `sql` table, to the sum amount of scraped cards from the website.

```
#=> from Persistable::ClassMethods

def table_rows
  sql = <<-SQL
      SELECT COUNT(*) FROM #{self.table_name}
  SQL

  table = DB[:conn].execute(sql)
  rows = table.flatten.join.to_i
  rows
end
```

I am doing this to cover my tracks, to make sure that I am no shape or form putting in more data than I need to on my end, or on the website's. What this surmounts to is the following revision:

```
if @@overall_format_options[6].table_rows < self.table_length
  @@overall_format_options[6].create(hash)
end
```

To make it visually cleaner I'll turn it into a ternary:

```
@@overall_format_options[6].create(hash) if @@overall_format_options[6].table_rows < self.table_length
```

Next up is adding in an exception handling case for the `Parser.scrape_cards` method. The main purpose for this is so that it can pick up if there is an error in scraping the content from the website. And when it does, it can re-attempt a connection, if for example there is too much traffic going on in the site, or if the website is down altogether.

<div class="noborder" style="overflow: auto; width:750px; height: 723px;">
    <div class="noborder" style="width: 1290px;">
        <img src="http://i.imgur.com/FsJcHXv.png" style="float: left; width: 1290px; height: 706px; margin: 0 5px;" alt="Parser.scrape_cards exception handling">
    </div>
</div>

The exception block starts at the `begin` case, where I first access the site location into a local variable. If there's an error in attempting this, then it will go to the `rescue` case, where it first `puts` the error for the user to see, and then retries the connection once more. That is until the `retries` variable equals zero, in which case it will then stop retrying the connection and just `puts` the string `"Unable to resolve #{e}"`.

If it doesn't come across an error, then it will continue the card scraping as planned, with just one extra change: the `ensure` method. This method makes the operation have to include what is contained within it, no matter the case. I put a `sleep` time in there to give a little lapse in scraping between the cards, so that it doesn't put as much pressure on the reading and writing of the site to the database.

**Concluding Class Parser**

My `Parser` class has come a long way, and I have made the scraping for it be as understandable as I can explain it. This is the final thing that I want to refactor for my primary method `Parser.scrape_cards`. I promise... 

As I was testing this app, I found that there could be another possible error in gathering my content from the site. This error would be in regards to the site not recognizing my program, and thus not enabling it to scrape the card information.

I found that the quickest resolution for this was implementing a neat little gem, that is similar to *Nokogiri* but had slightly more versatility when it came to accessing a website:


* [Mechanize](https://github.com/sparklemotion/mechanize)

The layout for the `Parser.scrape_cards` method will not be changing, as it works just fine as it is. I will simply be replacing the *Nokogiri* scraping methods with *Mechanize* for its initial access point:

<div class="noborder" style="overflow: auto; width:750px; height: 911px;">
    <div class="noborder" style="width: 1286px;">
        <img src="http://i.imgur.com/NeIKIxD.png" style="float: left; width: 1286px; height: 894px; margin: 0 5px;" alt="Parser.scrape_cards exception handling final">
    </div>
</div>

As you can see I have put the *Mechanize* method within the `begin` case statement. First assigning it to a local variable `agent`. The method that's below `agent` was put together with information that I gathered from a HTTP headers [plugin](https://chrome.google.com/webstore/detail/http-headers/nioieekamcpjfleokdcdifpmclkohddp).

The reason I had to do this was so that I could offer a list of hooks to call before retrieving a response from the website. If I don't offer the [`user_agent`](https://en.wikipedia.org/wiki/User_agent) then there's a chance that the site will not allow the content to be scraped.

The next option that I also had to implement was the [`Referer`](https://en.wikipedia.org/wiki/HTTP_referer). This one is used to let the site know where it is that I originally came from in order to access that specific web page.

If I can replicate these options in a more natural way, then I won't have hiccups trying to scrape the information that I need. Hence, why I'm using the [`.pre_connect_hooks`](http://www.rubydoc.info/gems/mechanize/Mechanize:pre_connect_hooks) method with my `lambda` block arguments: `user_agent`, and `Referer`.

**Organizing My File Tree For Gem Implementation **

I have now officially completed the app. All of my classes work in unison with each other, and are able to offer the user the options that I originally imagined for it. All I need to do now is revise my directory layout for a gem implementation.

Here is a visual of how I changed my file tree so that it would be a standard gem layout:

```
$ tree mtg-card-finder

  mtg-card-finder

  ├── .gitignore

  ├── Gemfile

  ├── Gemfile.lock

  ├── LICENSE.txt

  ├── README.md

  ├── Rakefile

  ├── mtg-card-finder.gemspec

  ├── spec.md

  ├── bin

      └── console

      └── mtg-card-finder

      └── setup

  ├── config

      └── environment.rb

  ├── db

      └── cards.db

  ├── lib

      └── mtg_card_finder.rb

      └── mtg_card_finder

          └── concerns

              └── persistable.rb

          └── tables

              └── modern_fall.rb

              └── modern_rise.rb

              └── standard_fall.rb

              └── modern_rise.rb

          └── cli.rb

          └── color.rb

          └── mtg.rb

          └── parser.rb

          └── version.rb
```

A good majority of the layout here was already automated for me with the `bundle gem mtg-card-finder` command. The only alterations that I made were inserting my already created classes/module into their right file directory: `lib`.

Now to explain the minor changes to the layout.

First off you probably noticed how my `lib` folder contains a standalone file, `mtg_card_finder.rb`, and then a folder with the same name(minus the extension).

Here is what is written inside of `mtg_card_finder.rb`:

```
module MTGCardFinder #needs to be defined first so that environment loads correctly
end

require_relative '../config/environment'
```

The concept here is that this module, `MTGCardFinder`, is in charge of all the operations that make up my app. As a result, it should have network relations with the classes that make my application run how it's supposed to. This is a pretty standard methodology for gem structuring.

Now for the folder with the same name:  `mtg_card_finder`. This contains all of the classes and modules we already built and know of. It is simply a container for easier dependency requests. One thing to note though is that I have now changed my `CLI` class to be an internal class of the module `MTGCardFinder`.

```
class MTGCardFinder::CLI
  #...
  #....
end
```

I decided however, to make this be the sole class that was contained to the module `MTGCardFinder`. Since `CLI` was already being operated on as the relational class to the other external methods, there was no technical difference that I could see that would need that transition for the rest of the classes.

You may have noticed though, that there is one extra file in the `mtg_card_finder` folder with a new name: `version.rb`. This file contains nothing more than the version number encapsulated in the gem's base module. As updates are released, it's necessary to update the version number here to reflect the latest edition.

```
module MTGCardFinder
  VERSION = "0.1.3"
end
```

Now going back out into our main directory there is the `environment.rb` file that I want to talk to you about. This file is stored wihtin the `config` folder, and is in charge of storing all relational gems or files that are necessarry for the app to run how it's supposed to.

You may have noticed that there was a line inside of the `mtg_card_finder.rb` file which actually made a reference to it: `require_relative '../config/environment'`. This again is done for the sole reason of having one single file, that is in charge of storing all the required dependencies to an application.

This way, I don't have to worry about stranded requirements because I put them all in different locations. It is simply a way to force the location of all these essential components, into one place for the sake of organization.

Here is what's contained inside of `environment.rb`:

```
require 'open-uri'
require 'sqlite3'
require "tco"
require "mechanize"
require "nokogiri"
require 'fileutils' # for creating the database directory

DIR = "db"
FileUtils.makedirs(DIR)

DB = {:conn => SQLite3::Database.new("db/cards.db")} #this gives me validation to reach the database that module Persistable interacts with

require_relative '../lib/mtg_card_finder/cli'
require_relative '../lib/mtg_card_finder/color'
require_relative '../lib/mtg_card_finder/mtg'
require_relative '../lib/mtg_card_finder/parser'
require_relative '../lib/mtg_card_finder/concerns/persistable'
require_relative '../lib/mtg_card_finder/tables/modern_fall'
require_relative '../lib/mtg_card_finder/tables/modern_rise'
require_relative '../lib/mtg_card_finder/tables/standard_fall'
require_relative '../lib/mtg_card_finder/tables/standard_rise'
```

Next up is my `bin` folder. This one was automatically made for me when I ran `bundle gem mtg-card-finder`. I just needed to change two things inside to make it work they way I wanted it to.

In case you may be wondering, the `bin` folder is in charge of loading up the gem for the user. First I had to do a minor change in the included `console` file:

```
#!/usr/bin/env ruby

require "bundler/setup"
require_relative "../lib/mtg_card_finder"

# You can add fixtures and/or initialization code here to make experimenting
# with your gem easier. You can also use a different console, if you like.

# (If you use this, don't forget to add pry to your Gemfile!)
# require "pry"
# Pry.start

require "irb"
IRB.start(__FILE__
```

I simply had to add in the following code: `require_relative "../lib/mtg_card_finder"`. This was so that it would be capable of reaching the methods that make up the functionality of my app.

By the way, if you're curious as to how it is that this file is able to operate on *Ruby* code without the `.rb` extension, it's thanks to this line: [`#!/usr/bin/env ruby`](https://unix.stackexchange.com/questions/29608/why-is-it-better-to-use-usr-bin-env-name-instead-of-path-to-name-as-my). It simply lets your system know what sort of language environment it's supposed to work with.

The next tweak I had to do in `bin` was inside the `mtg-card-finder` file:

```
#!/usr/bin/env ruby

require_relative '../lib/mtg_card_finder'

MTGCardFinder::CLI.start
```

Again, I had to note the location of the methods that make up my app: `require_relative '../lib/mtg_card_finder'`. Then I called the `MTGCardFinder` module's `CLI` class, to run the method `start`. If you remember, `CLI.start` is what makes the whole program begin.

The final piece that I want to share is the `mtg-card-finder.gemspec` file: 

```
# coding: utf-8
lib = File.expand_path('../lib', __FILE__)
$LOAD_PATH.unshift(lib) unless $LOAD_PATH.include?(lib)
require 'mtg_card_finder/version.rb'

Gem::Specification.new do |spec|
  spec.name          = "mtg-card-finder"
  spec.version       = MTGCardFinder::VERSION
  spec.authors       = ["Juan Gongora"]
  spec.email         = ["gongora.animations@gmail.com"]

  spec.summary       = %q{Daily market analyzer for MTG cards}
  spec.description   = %q{Find the highest rising/falling card prices on the MTG open market}
  spec.homepage      = "https://github.com/JuanGongora/mtg-card-finder"
  spec.license       = "MIT"

  spec.files         = `git ls-files`.split($\)
  spec.executables   << "mtg-card-finder"
  spec.require_paths = ["lib", "db"]

  spec.add_development_dependency "bundler", "~> 1.14"
  spec.add_development_dependency "rake", "~> 12.0"
  spec.add_development_dependency "pry", "~> 0.10.4"
  spec.add_dependency "rubysl-fileutils", "~> 2.0.3"
  spec.add_dependency "rubysl-open-uri", "~> 2.0"
  spec.add_dependency "nokogiri", "~> 1.7.1"
  spec.add_dependency "tco", "~> 0.1.8"
  spec.add_dependency "sqlite3", "~> 1.3.13"
  spec.add_dependency "mechanize", "~> 2.7.5"
end
```

This file lets my gem know what sort of file paths are necessary, what sort of additional gems are required for it to work, as well as some adhoc material for describing what the gem is about.

All that's left for me now is to publish the gem!

First I tested the gem locally in order to make sure it was working by running `rake build`, then `gem install pkg/mtg-card-finder-0.1.3.gem`. Once I was satisfied, I commited my work for logging, and then ran `rake release`.

**MTG Card Finder is Complete**

It's all finished! It was a long and educational journey, and I picked up a couple of different tricks along the way. I hope that this walkthrough has helped you in some way as well. Either as a refresher, or as an introduction to gem building!

If you are interested to learn more about the gem releasing portion of this walkthrough, I recommend these three different articles:

* [rubygems.org](http://guides.rubygems.org/make-your-own-gem/#introduction)

* [bundler.io](https://bundler.io/v1.13/guides/creating_gem)

* [cognizant.com](https://quickleft.com/blog/engineering-lunch-series-step-by-step-guide-to-building-your-first-ruby-gem/)

Below is a video sample of how the finished gem looks like:

<a href="https://www.youtube.com/watch?v=5Md_Chj_HQU"><img src="http://i.imgur.com/TuOGZijl.jpg" title="Link To YouTube Video Here" /></a>

If you’d like to see the complete source code for this gem, here is the link:

* [github.com](https://github.com/JuanGongora/mtg-card-finder)

**Thank you for reading!**

<a href="https://github.com/JuanGongora/mtg-card-finder"><img src="http://i.imgur.com/99v5Yxlh.png" alt="MTG Card Finder" title="Link To GitHub Repo Here"/></a>

