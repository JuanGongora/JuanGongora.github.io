---
layout: post
title:  Building a Ruby gem to learn about web scraping (Part 2)
date:   2017-05-30 02:30:14 +0000
---

Last I left off, I had already built a system that would allow me to get the content I needed from the site, and display it to the user. The next step that I have to do is make a database that will store my parsed content in a well accessed, and organized fashion. If you want to return back to *Part 1* please click [here](http://).

**Creating a Database**

In order to create this system, I will need to bind a database engine onto my application. With the help of the gem [Sqlite3](https://github.com/sparklemotion/sqlite3-ruby), I can now begin building the structure that will store the gathered data.


* [Sqlite3](https://github.com/sparklemotion/sqlite3-ruby)

Before I start writing out code for handling the database, I first want to organize the layout of my application's tree. To start things off, I want to have a configuration folder that will load all of the different classes that I have written. Right now they are all spread out, inside of a `lib` folder:

```
require 'open-uri'
require 'sqlite3'
require "tco"
require "nokogiri"

DB = {:conn => SQLite3::Database.new("db/cards.db")}

require_relative '../lib/cli'
require_relative '../lib/color'
require_relative '../lib/mtg'
require_relative '../lib/parser'
```

This will be my *environment* file, which will load all of the files that I need for my app to work appropriately. It will also be where the database is created and accessed so that I can implement methods that interact with the constant `DB`. My current directory tree now looks as follows:

```
$ tree mtg-card-finder

  mtg-card-finder

  ├── .gitignore

  ├── Gemfile

  ├── LICENSE.txt

  ├── README.md

  ├── Rakefile

  ├── config
	
      └──  environment.rb
      
  ├── db
	
      └──  cards.db
      
  ├── lib
	
      └──  cli.rb
			
      └──  color.rb
			
      └──  mtg.rb
			
      └──  parser.rb
```

Now that I have set my *hierarchy* in a more organized fashion, I feel comfortable writing a new class that will take care of binding *Sqlite3* into my *Ruby* methods. This class will be called `CardTable` for now, and will be stored inside of my `lib` folder.

```
class CardTable

  attr_accessor :card, :sets, :market_price, :price_fluctuate, :image

  def self.table_name
    "#{self.to_s.downcase}s"
  end

  def self.create_table
    sql = <<-SQL
          CREATE TABLE IF NOT EXISTS #{self.table_name} (
            id INTEGER PRIMARY KEY,
            card TEXT,
            sets TEXT,
            market_price INTEGER,
            price_fluctuate TEXT,
            image TEXT
          )
        SQL

    DB[:conn].exectute(sql)
  end

end
```

Here I am adding the first stages for the database by implementing attributes that are of the same name as those of the class `MTG`. This way I can link those same values that I parse right into my created table, which is then sent over to the constant `DB` that holds the entry way to my `cards.db` file.

But in order for that information to be correctly stored I have to *save* what is scraped as my methods continue to run:

```
def insert
  sql = <<-SQL
        INSERT INTO #{self.class.table_name} (card, sets, market_price, price_fluctuate, image) VALUES (?,?,?,?,?)
           SQL

  DB[:conn].execute(sql, self.card, self.sets, self.market_price, self.price_fluctuate, self.image)
end
```

Notice that I have made the above method an *instance method*, as it will be working to gather the information of each `MTG` instance as it is created.

The next thing that would be handy to have is a method that would let me find a specific card if I needed to access its information for some reason:

```
def CardTable.find(id)
  sql = <<-SQL
      SELECT * FROM #{self.table_name} WHERE id=(?)
  SQL

  row = DB[:conn].execute(sql, id)
end
```

Although this method lets me find one of the stored cards from the *Sqlite3* database, I don't have a way to create a *Ruby* *instance* of that newly gathered information, which could be useful if I need to keep working with it:

```
CardTable.create_table

first = CardTable.new

first.card = "Falkenrath"

first.sets = "Innistrad"

first.market_price = 23

first.price_fluctuate = "+26"

first.image = "ugly looking fella"

first.insert

p first

p CardTable.find(1)
```

Terminal:

```
#<CardTable:0x00000004d8bc20 @card="Falkenrath", @sets="Innistrad", @market_price=23, @price_fluctuate="+26", @image="ugly looking fella">
[[1, "Falkenrath", "Innistrad", 23, "+26", "ugly looking fella"]]
```

What I have returning to me is an array within an array instead, and that's not what I want...

I have to create something that assists the *find* method in order to make a returned instance:

```
#opposite of abstraction is reification i.e. I'm getting the raw data of these variables

def CardTable.reify_from_row(row)
  self.new.tap do |card|
    card.id = row[0]
    card.card = row[1]
    card.sets = row[2]
    card.market_price = row[3]
    card.price_fluctuate = row[4]
    card.image = row[5]
  end
end
```

With `CardTable.reify_from_row(row)` I will now be able to create an instance that holds all the values of the array from the *Sqlite3* return. Also, thanks to the [tap](http://ruby-doc.org/core-2.4.1/Object.html#method-i-tap) method, I get the instance that I just created automatically returned to me, while also implementing the setter methods on my behalf.

Now I just need to add it to the `CardTable.find(id)` method and test it out:

```
def CardTable.find(id)
  sql = <<-SQL
        SELECT * FROM #{self.table_name} WHERE id=(?)
  SQL

  row = DB[:conn].execute(sql, id)
  self.reify_from_row(row.first)
	
  #using .first array method to return only the first nested array
  #that is taken from CardTable.reify_from_row(row) which is the resulting id of the query
end


#tesing below:


CardTable.create_table

first = CardTable.new

first.card = "Falkenrath"

first.sets = "Innistrad"

first.market_price = 23

first.price_fluctuate = "+26"

first.image = "ugly looking fella"

first.insert

p first

p CardTable.find(1)
```

Terminal:

```
#<CardTable:0x00000004dd5780 @card="Falkenrath", @sets="Innistrad", @market_price=23, @price_fluctuate="+26", @image="ugly looking fella">
#<CardTable:0x00000004dd4498 @card="Falkenrath", @sets="Innistrad", @market_price=23, @price_fluctuate="+26", @image="ugly looking fella",
@id=1>
```

As you can see, this time the *find* method returned an instance, which also had a declaration for the *id*. 

Now going back to the `insert` method. What if the card that I'm trying to add into the database already exists? But I need to update some information that is related to it? I don't want to insert a duplicate that just has revised information. That would make the original invalid, and if we keep doing this behavior we will end up cluttering the database with error-driven information.

To resolve this I need to make a method, or methods rather, that will assist me with making sure this process of revision is done in a clean manner:

```
def update #=> updates by the unique identifier of 'id'
  sql = <<-SQL
       UPDATE #{self.class.table_name} SET card=(?), sets=(?), market_price=(?), price_fluctuate=(?), image=(?) WHERE id=(?)
  SQL

  DB[:conn].execute(sql, self.card, self.sets, self.market_price, self.price_fluctuate, self.image, self.id)
end

def persisted?
  !!self.id  #=> the '!!' double bang converts an object into a truthy value statement
end

def save
  persisted? ? update : insert  #=> if the card has already been saved, then call update method, if not call insert method instead
end
```

First I have `update` that revises a card in the context of what the `id` value is for that instance. Then I have `persisted?` which categorizes the `id` of the instance as an automatic *true* statement. Finally I have `save` which has a [ternary](http://www.w3resource.com/ruby/ruby-ternary-operator.php) *if/else statement*, where I check if an `id` exists first, and if so then I `update` the instance; if it doesn't then I `insert` the new instance into the database.

**Furthering Revisions to Database Methods**

What I currently have works fine, but the longterm goal is to have this class `CardTable` be dynamic enough that I can seamlessly integrate it with foreign classes. This way I can associate the parsed content into different tables from different classes, that are all then stored onto the same database.

To start this optimization I will need to do some metaprogramming:

```
#metaprogramming the hash to convert keys to attr_accessor's and also for inserting the values to the sql strings
ATTRS = {
    :id => "INTEGER PRIMARY KEY",
    :card => "TEXT",
    :sets => "TEXT",
    :market_price => "INTEGER",
    :price_fluctuate => "TEXT",
    :image => "TEXT"
}

ATTRS.keys.each do |key|
  attr_accessor key
end

def CardTable.reify_from_row(row)
  self.new.tap do |card|
    ATTRS.keys.each.with_index do |key, index|
      #sending the new instance the key name as a setter with the value located at the 'row' index
      card.send("#{key}=", row[index])
      #string interpolation is used as the method doesn't know the key name yet
      #but an = sign is implemented into the string in order to associate it as a setter
    end
  end
end
```

I have done a couple of things here, first I have made a constant `ATTRS` that helps declare my *SQLite3* schema into a *Ruby* hash. This is then implemented onto the block:

```
ATTRS.keys.each do |key|
  attr_accessor key
end
```

Which does some introspection for what the class attributes should be by iterating the keys and declaring them as `attr_accessor`'s.

Then I updated `CardTable.reify_from_row(row)` to utilize the constant `ATTRS`, and have it automatically set the method and value instead of hard coding it like I was before.

Speaking of hard coding, it seems like there are still a few other places that could use some refactoring. For starters there's the `CardTable.create_table` method:

```
def CardTable.create_table
    sql = <<-SQL
          CREATE TABLE IF NOT EXISTS #{self.table_name} (
            id INTEGER PRIMARY KEY,
            card TEXT,
            sets TEXT,
            market_price INTEGER,
            price_fluctuate TEXT,
            image TEXT
          )
        SQL

    DB[:conn].exectute(sql)
end
```

If I can implement the constant `ATTRS` into the above method then I can remove its redundancy; since my constant is basically the equivalent of this sql string.

```
def CardTable.create_sql
  ATTRS.collect {|key, value| "#{key} #{value}"}.join(", ")
end
```

By using this method, I can apply the column names (`key`) and their schemas (`value`) into sql strings without having to hard code them. This is first done with the help of the [collect](https://apidock.com/ruby/Array/collect) method, which returns a revised array. I then concatenate the array with [join](https://apidock.com/ruby/Array/join) to make it into a string, and finally, I separate the arguments from the block with commas. The result of the constant `ATTRS` then turns into this:

```
"id INTEGER PRIMARY KEY, card TEXT, sets TEXT, market_price INTEGER, price_fluctuate TEXT, image TEXT"
```

As a result, I am then able to replace the rest of the string from `CardTable.create_table` with my new method:

```
def CardTable.create_table
  sql = <<-SQL
        CREATE TABLE IF NOT EXISTS #{self.table_name} ( #{self.create_sql} )
  SQL

  DB[:conn].execute(sql)
end
```

While I'm at it how about I do the same thing for my CardTable's instant, `insert`? Here is where it's at as of right now:

```
def insert
  sql = <<-SQL
        INSERT INTO #{self.class.table_name} (card, sets, market_price, price_fluctuate, image) VALUES (?,?,?,?,?)
           SQL

  DB[:conn].execute(sql, self.card, self.sets, self.market_price, self.price_fluctuate, self.image)
end
```

I can implement the same concept as `CardTable.create_sql` to replace the filler that is `(card, sets, market_price, price_fluctuate, image)`. Only this time I'll only be returning the *keys* for my sql insertions:

```
def CardTable.attributes_names_insert_sql
  ATTRS.keys[1..-1].join(", ")
end
```

Take notice that I am starting my `keys`' iterating at index `1` so that I am not declaring the `id` into the mix. I want *Sqlite3* to set that for me on my behalf, as it's the one that's keeping account of where its values are internally for that primary key. 

Next on the `insert` lineup is doing something about those question marks at the end of the string:

```
def CardTable.question_marks_insert_sql
  questions = ATTRS.keys.size-1 
  questions.times.collect {"?"}.join(", ") 
end
```

What this here does is it returns the number of key-value pairs in the `ATTRS` hash minus one for the `id`(for the reason that I spoke of earlier). Then I convert the numbered result into a '?' array(using the [collect](https://apidock.com/ruby/Array/collect) method again) and have it then turned into a comma separated string:

```
"card, sets, market_price, price_fluctuate, image"
```

Lastly, I can do something about all the methods that have a sql insertion into my constant `DB`. As it stands, whenever I want to assign the resulting getter of a method from the instance(`self`) into a sql string I have to hard code it:

```
DB[:conn].execute(sql, self.card, self.sets, self.market_price, self.price_fluctuate, self.image)
```

I can probably simplify the insertion of all those getter methods:

```
def attribute_values_for_sql_check
  ATTRS.keys[1..-1].collect {|attr_names| self.send(attr_names)}
end
```

What I'm doing in this instance method above is that I first go through the `key` names(minus `id`), and then I return an array that contains their values for the recieving instance(by using [send](https://apidock.com/ruby/Object/send) to call on those methods of `self`). It's basically like getting an array of getter methods for that instance.

I can now combine `CardTable.question_marks_insert_sql`, `CardTable.attributes_names_insert_sql`, and `attribute_values_for_sql_check` into my instance method `insert`:

```
def insert
  sql = <<-SQL
          INSERT INTO #{self.class.table_name} (#{self.class.attributes_names_insert_sql}) VALUES (#{self.class.question_marks_insert_sql})
  SQL

  
  DB[:conn].execute(sql, *attribute_values_for_sql_check)
  
  self.id = DB[:conn].execute("SELECT last_insert_rowid() FROM #{self.class.table_name}")[0][0]
  #returns first array with the first value of the array (i.e. index 0)
end
```

To further help in clarifying the revised `insert` method, I use the splat(`*`) operator to signify that there may be more than one argument in terms of [attr_readers](http://ruby-doc.org/core-2.0.0/Module.html#method-i-attr_reader):

```
 DB[:conn].execute(sql, *attribute_values_for_sql_check)
```

Then, after inserting the card to the database(`DB`), I want to get the *primary key* that is auto assigned by *Sqlite3* to be returned and assigned to the instance method(called `id` for the current instance variable, `self`). I make this happen by declaring to my database to collect for me the last inserted content from my chosen table, which is gathered as an array, but limit it to only the *first* value of the *first* index(i.e. the `id`):

```
 self.id = DB[:conn].execute("SELECT last_insert_rowid() FROM #{self.class.table_name}")[0][0]
```

I now have a fully operational way to insert a clean card, into whatever dynamic table I want!

I've done a couple of revisions to the `CardTable` class, so let's display what I currently have so we don't get lost:

<div class="noborder" style="overflow: auto; width:750px; height: 1431px;">
    <div class="noborder" style="width: 1207px;">
        <img src="http://i.imgur.com/5GQVYuX.png" style="float: left; width: 1207px; height: 1414px; margin: 0 5px;" alt="class CardTable">
    </div>
</div>

Looking at what I currently have, it would make sense that if I have refactored the way I insert information like with `CardTable.attributes_names_insert_sql`, I can certainly do the same for the *sql* column names I want to update information on. Such as in the `update` instance method:

```
def update
  sql = <<-SQL
       UPDATE #{self.class.table_name} SET card=(?), sets=(?), market_price=(?), price_fluctuate=(?), image=(?) WHERE id=(?)
  SQL

  DB[:conn].execute(sql, *attribute_values_for_sql_check) #using splat operator to signify that there may be more than one argument in terms of attr_readers
end
```

So to shorten this part `SET card=(?), sets=(?), market_price=(?), price_fluctuate=(?), image=(?)`, I'll have to gather the *names* of my attributes and concatenate them with the associated question marks as a string:

```
def self.sql_columns_to_update
  columns = ATTRS.keys[1..-1]
  columns.collect {|attr| "#{attr}=(?)"}.join(", ")
end
```

Here I am returning the number of keys in the `ATTRS` hash minus one for the `id`(which is why I start the array iterator at `1`). Then I convert them into an *attribute=(?)* array that is then turned into a comma separated *string*.

I've constructed a good layout for my *Sqlite3* integration with the `CardTable` class. But in order to make my class more dynamic, I should convert `CardTable` into a module instead of a class: this way I can easily include all of these methods into various other classes.

**Transforming my Sqlite3 Class into a Module**

The methods that are within the current `CardTable` class have been written in an implicit enough manner that I won't need to worry about doing too much editing. One thing that I should make sure to do however, is define which methods should be considered *class methods*, and which should be *instance methods* once they have been included into a new class:

```
#a dynamic module that can contain any data

module Persistable
  module ClassMethods
  end

  module InstanceMethods
  end
end
```

Now I can start inserting my methods from class `CardTable` into their appropriate slots in the module:

<div class="noborder" style="overflow: auto; width:730px; height: 1703px;">
    <div class="noborder" style="width: 1368px;">
        <img src="http://i.imgur.com/FU4b6rr.png" style="float: left; width: 1368px; height: 1686px; margin: 0 5px;" alt="Module Persistable">
    </div>
</div>

Take notice that I left out the constant `ATTRS` as well as the block that iterated through it to make the `attr-accessor`. I want those to be part of the class that will be implementing the module `Persistable`, since only that class will know what sort of keys and values it should relate itself to in terms of constructing its *Sqlite3* table.

As a result I have left the file containing the `CardTable` class alive, this will be my blueprint sample to how I integrate the custom classes to the database:

<div class="noborder" style="overflow: auto; width:730px; height: 401px;">
    <div class="noborder" style="width: 944px;">
        <img src="http://i.imgur.com/aJRnnWR.png" style="float: left; width: 944px; height: 384px; margin: 0 5px;" alt="class CardTable">
    </div>
</div>

I have slightly revised the methods above however, to make them more dynamic in their association to the module `Persistable`. Whereas I used to have methods in the module that directly hardcoded themselves to the name `ATTRS`, I have made it more implicit with the method `self.attributes`. All I have to do now is go into the module `Persistable` and edit the methods that had `ATTRS` written so I can replace it with `self.attributes` now.

There's only a few more things that I need to work on for my `Persistable` module to work the way I want it to. For one I forgot to add a method that gets rid of a table, which is something that I may want to use when I want to get rid of outdated information:

```
def remove_table
  sql = <<-SQL
          DROP TABLE IF EXISTS #{self.table_name}
  SQL

  DB[:conn].execute(sql)
end
```

Now, in order for me to have all of these methods that I've created be valid with the information that I get from my `Parser` class(which if you remember, is how I get the content of my cards in the first place) I need to figure out a way to cleanly integrate it. As it stands, my `Parser.scrape_cards` method creates an instance of the `MTG` class, pairing the instance methods with *key/value* pairs:

<div class="noborder" style="overflow: auto; width:750px; height: 797px;">
    <div class="noborder" style="width: 1485px;">
        <img src="http://i.imgur.com/XiUVFl5.png" style="float: left; width: 1479px; height: 780px; margin: 0 5px;" alt="class Parser">
    </div>
</div>

I can use this to my advantage instantly. All I have to do is make the method for the module `Persistable`, that will simultaneously put that scraped card into my database:

```
def create(attributes_hash)

  self.new.tap do |card|
    attributes_hash.each do |key, value|

      card.send("#{key}=", value)
    end
    card.save
  end
end
```

This method will dynamically create a new instance with the assigned `attrs` and `values` by doing mass assignment of the hash's *key/value* pairs.
By using the `tap` method, I'm allowing preconfigured methods and values to be associated with the instance during *instantiation*: while also automatically returning the object after its creation is concluded. Then, within the `tap` block, I'm sending the new instance the key name as a *setter* with the *value* that I got from the css selectors. 

Take note that string interpolation is used as the method doesn't know the *key* name yet, but an `=` sign is implemented into the string in order to asssociate it as a *setter*. Finally, I use the `Persistable` instance method called `save` so that I can add it into the database. Now I just need to add it into the `Parser.scape_cards` method to have it collect my information:

```
def Parser.scrape_cards
  CardTable.create_table
  doc = Nokogiri::HTML(open("./lib/test.html"))
  self.card_counter
  doc.css(@@overall_format_options[0]).each do |row|
    #parsing is now initialized into MTG class, with key/value pairs for its scraped attributes
    row = MTG.new(hash = {
        card: row.css(".card a")[0].text,
        sets: row.css(".set a")[0].text,
        market_price: row.css(".value")[0].text.split[0].gsub!("$", "").to_f,
        price_fluctuate: row.css("td:last-child").text,
        image: Nokogiri::HTML(open("http://www.mtgprice.com#{row.css(".card a").attribute("href").value}")).css(".card-img img").attribute("src").value
    })
    CardTable.create(hash) #=> now my card information is put into the newly created table at the beginning of this method
  end
end
```

It's all coming along nicely. I have a solid formation of methods that are following through with my vision for this gem. Since I have made a full database possible, with all of the content that my methods scrape, I might as well create a method that allows me to export all of that content into a more widespread executable file. For my case, I chose to make it a `.CSV` file:

```
def make_csv_file
  rows = DB[:conn].execute("SELECT * FROM #{self.table_name}")
  date = "#{Time.now}"[0..9].gsub!("-", "_")
  fname = "#{self}_#{date}.csv"
  col_names = "#{self.attributes.keys.join(", ")} \n"
  unless File.exists? fname
    File.open(fname, 'w') do |ofile|
      ofile << col_names
      rows.each_with_index do |value, index|
        value.each { |find| find.gsub!(", ", "_") if find.is_a?(String) }
        ofile << "#{rows[index].compact.join(", ")} \n"
      end
      sleep(1 + rand)
    end
  end
end
```

This method will be inserted into `Persistable::ClassMethods`, so that it relates itself to the content that is gathered for a class as whole, instead of an instance which would only know of itself. First I make the local variable `rows` collect everything from the *sql* table. Then in `fname` I name the csv file with the name of the class that is implementing this method, along with today's `date` which removed for me additional content I did not want in the string. This is done by writing out until the 9th character is met in the local variable `date`. 

I then collect the table's column names by getting the defined keys from the dynamic method `self.attributes` all into a string which is separated into a newline. Then at `File.open(fname, 'w')` I'm opening the csv file to write the *sql* data into, and start if off by making the first row be the `col_names`. Afterwards, I iterate through all the rows and their values to replace any commas so that I can avoid line breaking errors on my csv file. Finally, I push each array within the local variable `rows` as a *newline* into my csv file, while also removing nil values with the method `compact`.

Another thing that would make sense to have is a way to allow the user of my gem to have an option, which can show them where to purchase one of the queried cards.

I found from personal experience that [eBay](http://www.ebay.com/) seems to have the most competitive prices for Magic the Gathering trading cards. So for my case, I will build a method that will display to the user a url to one of the listed cards within eBay's market place:

```
def buy_link(id)
  name = self.find(id)
  begin
    #collect the instant's values as a string
    word = name.card + " " + name.sets
  rescue
    #instead of getting an undefined method error in .card & .sets for nil:NilClass
    #just re-run method until user sets it to a true value
    Parser.purchase #=> I will need to build this method, but it'll be a simple implementation of recursion
  else
    #replace whitespace chars
    word.gsub!(/\s+/m, '%20')
    #create url for purchasing the chosen id card
    buy = "http://www.ebay.com/sch/?_nkw=#{word}&_sacat=0".fg COLORS[3]
    puts ""
    puts "Please highlight, right click and copy the #{"url".fg COLORS[3]} below and paste it to your preferred browser:"
    puts "--------------------------------------------------------------------------------------------"
    puts ""
    puts buy
    puts ""
  end
end
```

This method will also be included in `Persistable::ClassMethods`. It takes in an argument which is the `id` that is assigned to a card instance, and then I search for that number with the `find(id)` method(which also comes from `Persistable::ClassMethods`). Now that I have found the id and made it into an instance I can make the local variable `word` be a string that defines the values of the methods `.card` and `.sets`. 

The next step is to then replace any gathered whitespace characters from the `word` variable with the *html* code counterpart: `%20`. Afterwards, I create a `buy` variable that interpolates my `word` variable into an *html* string for the chosen card. Now I only have to `puts` my results onto the terminal, so the user can now see the returned option.

Take note that I added in a [`begin`/`rescue`](http://blog.honeybadger.io/a-beginner-s-guide-to-exceptions-in-ruby/) sequence in order to pick up any errors that might trickle down. To quickly run through how it works, first I start the *exception* block by assigning the `word` variable with the values I want to collect. Then I offer two alternate paths. The first of which begins with the `rescue`, and it is activated when something does not get picked up from my database(that was supposed to assign values to the string variable `word`).

What ends up happening is that a placeholder method will be run to attempt to collect the values I originally sought for. This method will be called `Parser.purchase` for now(I chose the `Parser` class as that is where I am initially gathering all my online data from), and it's job, when written, will be to attempt to re-access my card data from the site again.

If the `rescue` is not required however, then it will go to the other path which is in the `else` statement; which will end up running my method the way that I initially wanted it to.

**Revising the File Tree**

I've already done a number of alterations to my current classes, as well as added a `Sqlite3` driven module(that will be flexible enough to work on various classes without any hinderance of method relationships to one another). As a result, I want to revise my file tree's hierarchy:

```
$ tree mtg-card-finder

  mtg-card-finder

  ├── .gitignore

  ├── Gemfile

  ├── LICENSE.txt

  ├── README.md

  ├── Rakefile

  ├── config

      └── environment.rb

  ├── db

      └── cards.db

  ├── lib

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
```

The most noticeable changes here are the inclusion of two new directories: `concerns` and `tables`, inside of my `lib` folder. `concerns` contains the file `persistable.rb` which is where the `Sqlite3` driven module presides. I will be *including* this file on various occasions, as I will be implementing my database structure along the way. The second directory, `tables`, will be one of the first areas where I will be using my `Persistable` module.

Inside of `tables` I have four `.rb` files, each of which pertains to the [*card formats*](http://magic.wizards.com/en/game-info/gameplay/rules-and-formats/formats) I spoke of in the beginning of this gem's walkthrough. I chose the two most popular branches, *modern* and *standard*, and have set it so that there is a separate table for both a *profit* and *loss* comparison to a game *format*.

Although these four `.rb` files each contain different information, the innards of each of them will surprisingly be the same; thanks to the fact that I made my module be dynamic in its implicit declarations to methods. The only real difference between these files will be just their class names, in order to identify what type of table they are relating themselves to:

<div class="noborder" style="overflow: auto; width:730px; height: 415px;">
    <div class="noborder" style="width: 948px;">
        <img src="http://i.imgur.com/Yh5tN0I.png" style="float: left; width: 948px; height: 398px; margin: 0 5px;" alt="all classes inside tables folder layout">
    </div>
</div>

**Updating the Parser class**

I want to begin implementing the methods that I worked on in the `persistable` module. For example, I want to make the `Parser.purchase` method that I hinted at. But before I get it working, there are a few things that I'll need to revise before I'm capable of doing this. The first thing that comes to mind is my `Parser.select_format` method. I can certainly blend a few more options to this that will later help to differentiate my *table* classes(which contain the code from the snippet shown above):

<div class="noborder" style="overflow: auto; width:730px; height: 300px;">
    <div class="noborder" style="width: 2376px;">
        <img src="http://i.imgur.com/MpNSmXb.png" style="float: left; width: 2376px; height: 283px; margin: 0 5px;" alt="Parser.select_format">
    </div>
</div>

As you can see I have made this method work in such a way that when a user has chosen a format, I will be able to manipulate the table from that class in whatever necessary way I'll need for that time. I'm also using a particular [function](http://stackoverflow.com/questions/13948910/ruby-methods-as-array-elements-how-do-they-work) that allows me to store methods within an array. 

If you are keen to this snippet, you may also notice that I have added some new methods within the arrays that are going to be contained in the class `MTG`. But we will get back to those in a bit, first I'll finish off the `Parser.purchase` method now that there's a way to dynamically access a card from one of the *table* classes.

```
def Parser.purchase
  input = gets.strip.to_i
  @@overall_format_options[6].buy_link(input)
end
```

For my class method here, I am doing a bit of a hack. At first I wanted to make the method `buy_link(id)` from `Persistable` be called from within the class array `@@overall_format_options`: just as I had designed it for the other stored methods that are declared in `Parser.select_format`.  Unfortunately, the nature of this method does not allow it to work.

This is because a reference to a method that's stored inside an array can't have a locally passed argument, which would have been the user input in this case. So in order to still have the class that the user chose be the one that is *linked* to the method `buy_list(id)`, I compromised by just having the class name passed from an index within the `@@overall_format_options` instead.

Now, since I am still making compatible methods from `Persistable` to `Parser`, I should also add a method that lets me take the compiled data from one of the *table* classes: once it's been scraped by `Parser.scrape_cards`.

```
def Parser.csv
    @@overall_format_options[7].call
    puts ""
    puts "The #{"CSV".fg COLORS[3]} file has been saved to your hard disk"
    puts "---------------------------------------------"
    puts ""
end
```

This method is pretty self explanatory. It first grabs one of the chosen *table* classes that has been declared in `@@overall_format_options`, and then goes to index `7` which is the method `.make_csv_file` assigned to the class. Finally, it uses the [`call`](https://ruby-doc.org/core-2.1.4/Method.html#method-i-call) method to trigger its operation to that class, which then ends up making a .csv file for us to work with in whatever way we'd like.

Next up are some manicure methods that will help me to differentiate my card listings in the *table* classes. I will show you how I go about this, in part 3 of this gem build.


