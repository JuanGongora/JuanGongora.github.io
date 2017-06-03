---
layout: post
title:  Building a Ruby gem to learn about web scraping (Part 2)
date:   2017-05-29 22:30:15 -0400
---

Last I left off, I had already built a system that would allow me to get the content I needed from the site, and display it to the user. The next step that I have to do is make a database that will store my parsed content in a well accessed, and organized fashion. If you want to return back to *Part 1* please click [here](http://imjuan.com/2017/05/25/building_a_ruby_gem_to_learn_about_web_scraping/).

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

Next up are some manicure methods that will help me to differentiate my card listings in the *table* classes. 

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

The exception block starts at the `begin` case with first accessing the site location to a local variable. If there's an error in attempting this, then it will go to the `rescue` case, where it first `puts` the error for the user to see, and then retries the connection once more. That is until the `retries` variable equals zero, in which case it will then stop retrying the connection and just `puts` the string `"Unable to resolve #{e}"`.

If it doesn't come across an error, then it will continue the card scraping as planned, with just one extra change: the `ensure` method. This method makes the operation have to include what is contained within it, no matter the case. I put a `sleep` time in there to give a little lapse in scraping between the cards, so that it doesn't put as much pressure on the reading and writing of the site to the database.

**Concluding Class Parser**

My `Parser` class has come a long way, and I have made the scraping for it be as understandable as I can explain it. This is the final thing that I want to refactor for my primary method `Parser.scrape_cards`. As I was testing this app, I found that there could be another possible error in gathering my content from the site. This error would be in regards to the site not recognizing my program, and thus not enabling it to scrape the card information.

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

By the way, if you're wondering how it is that this file is able to operate on *Ruby* code without the `.rb` extension, it's thanks to this line: [`#!/usr/bin/env ruby`](https://unix.stackexchange.com/questions/29608/why-is-it-better-to-use-usr-bin-env-name-instead-of-path-to-name-as-my). It simply lets your system know what sort of language environment it's supposed to work with.

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

* [rubygems.org](http://guides.rubygems.org/make-your-own-gem/#adding-an-executable)

* [bundler.io](https://bundler.io/v1.13/guides/creating_gem)

* [cognizant.com](https://quickleft.com/blog/engineering-lunch-series-step-by-step-guide-to-building-your-first-ruby-gem/)

If you’d like to see the complete source code for this gem, it can be found here:

* [github.com](https://github.com/JuanGongora/mtg-card-finder)





