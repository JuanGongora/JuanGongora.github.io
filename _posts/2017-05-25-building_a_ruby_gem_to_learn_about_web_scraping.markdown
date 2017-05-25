---
layout: post
title:  Building a Ruby gem to learn about web scraping
date:   2017-05-25 16:02:41 +0000
---

One of the most interesting things to discover while learning a programming language is how you can implement that knowledge into an idea, and then transform it into a reality.

In this case, that is what I'm going to present here in this blog with my work with [Ruby](https://en.wikipedia.org/wiki/Ruby_(programming_language). I will start out with the initial concept that I had, and then continue building it up from there.

The goal in mind is to acquire data from a website, and then use that data to manipulate how a [Ruby gem](http://guides.rubygems.org/what-is-a-gem/) works for the end user.

For my particular gem, I will associate it to one of my pastime hobbies: [Magic the Gathering](https://en.wikipedia.org/wiki/Magic:_The_Gathering).

What I'd like to do is implement a gem that gathers the prices for individual cards, and then displays them to the user so that they can make smart purchases. This will require a CLI to be integrated into the gem so that the user can make these choices happen.

* Magic the Gathering
* Searches online for the prices of individual cards
* Displays the prices of these cards
* Allows the user to interact with these options


**Finding the website**

First thing to do is find a website that will help me gather the most up to date prices on these cards. After some searching, and making sure that there wouldn't be any non-permissible restrictions to accessing the built in content (aside from notifying the recognition of their usage), I found [MTG$](http://www.mtgprice.com/) to be an exellent source of information.

To begin building the gem I first downloaded a couple of the web pages that I believed would be useful for my concept. This way I could start my testing locally, and not worry about dragging the site down with numerous repetitive calls.

**First Test**

I first need some development gems that will ease the process of accessing the web content. To start out I have:

* [Nokogiri](https://github.com/sparklemotion/nokogiri)
* [Open-uri (Standard Library)](https://github.com/rubysl/rubysl-open-uri)

```
class Parser

  def self.scrape_cards
    doc = Nokogiri::HTML(open("./lib/test.html"))
    doc.css(".card a")[0].text
  end
end
```

Calling this method would return to me a simple string detailing the name of the card: `"Morkrut Necropod"` for example.
Since this was working, I knew that now I could begin to build up this initial scrape method to gather the rest of what I needed.

In order to make a card be a complete unit of information, I need to identify what sort of subjects should be entitled to it. To start off I should get the *name* of the card (which I already have), as well as the *set* that it's from. A *set* in this card game is basically the equivalent of an expansion pack that adds to the core of the gameplay. To top it off, having an *image* of a card will probably be a good thing to offer as well.

Now I also want to gather information related to the trader side of things, as that is one of the main drivers for the concept of this gem. So a verified *market price* for the card is a good identifier to have. The next part to add in would be a variable that can show how much the price may be *fluctuating* for the day.

* Card Name
* Set
* Market Price
* Price Fluctuate
* Image

Now that I have named these attributes for a card, it makes sense to build a class that can gather all this content for itself:

```
class MTG
  attr_accessor :card, :sets, :market_price, :price_fluctuate, :image
end
```

This class `MTG` will be the starting storage point of card information, and to make my life easier, those attributes should ideally be gathered during instantiation. In this case, the best place to auto-assign the values of those attributes is during the scraping process:

```
class Parser

  def self.scrape_cards
    doc = Nokogiri::HTML(open("./lib/test.html"))

    doc.css("#top50Standard tr").each do |row|
      row = MTG.new(
          {
              card: row.css(".card a")[0].text,
              set: row.css(".set a")[0].text,
              market_price: row.css(".value")[0].text.split[0].gsub!("$", "").to_f,
              price_fluctuate: row.css("td:last-child").text.split[0].gsub!("+", "").to_f,
              image: Nokogiri::HTML(open(row.css(".shop button").attribute("onclick").value.split(" ")[2].gsub!(/('|;)/, ""))).css(".detailImage img").attribute("src").value
          }
      )
    end
    
  end

end
```

The best way that I could pan it was to define them as a [hash](https://ruby-doc.org/core-2.2.0/Hash.html), that way the attribute for the `MTG` class could be the key, and the css selectors would be the values to those attributes/keys.

What I would need to do now was make an initialize method in class `MTG` that would allow me to have these values stored from a hash:

```
class MTG
  attr_accessor :card, :sets, :market_price, :price_fluctuate, :image
  @@all_cards = []
	
  def initialize(attributes)
    attributes.each {|key, value| self.send("#{key}=", value)}
    @@all_cards << self
  end
end
```

To bring back reference to how I had started the code in `Parser.scrape_cards`, I had assigned a new instance of the `MTG` class to take in an argument, namely a hash. As a result I should have the initialize method figure out a way to iterate through the multiple key/values and associate them as the class attributes.

With `attributes.each {|key, value| self.send("#{key}=", value)}` I am making sure that for each attribute, its key is the name of the setter method, and the value for that method is the result of the information gathered from the css selectors inside `Parser.scrape_cards`. With that information being *sent* to the instance *itself* I am automatically declaring what all the method's values for that instance of `MTG` will be.

Finally, to store the collective of all these scraped cards (so that they don't disappear from access as soon as they arrive) I have the class variable `@@all_cards` be my handy storage for all of those scraped cards from `Parser.scrape_cards`.

**Displaying the Cards**

Now that I have a method that gathers all card content for me, I need a way to display it for the user. My `MTG` class has been storing all of its card instances with their attribute values inside of the class variable `@@all_cards`. If I were to look and see what was contained inside this would be the result:

```
class MTG
  #....
  def self.all_cards
    p @@all_cards
  end
end

MTG.all_cards
```

Terminal:

```
[#<MTG:0x00000003069ef8 @card="Geier Reach Bandit", @set="Shadows over Innistrad", @market_price=1.12, @price_fluctuate=1.12>, #<MTG:0x0000
0003068080 @card="Wastes (1)", @set="Oath of the Gatewatch", @market_price=1.0, @price_fluctuate=1.0>, #<MTG:0x0000000308a680 @card="Wastes
 (4)", @set="Oath of the Gatewatch", @market_price=1.0, @price_fluctuate=1.0>, #<MTG:0x00000003088808 @card="AEther Tradewinds", @set="Kala
desh", @market_price=0.74, @price_fluctuate=0.74>, #<MTG:0x000000030cac30 @card="Lightning Axe", @set="Shadows over Innistrad", @market_pri
ce=1.35, @price_fluctuate=0.54> # so on and so forth...
```

Although it's good to see that things are being stored where I want them to be, I should make a cleaner display layout for them:

```
class MTG
  #...
  #....
	
  ATTRIBUTES = [
      "Card:",
      "Set:",
      "Market Value:",
      "Rise/Fall amount:",
      "Image URL:"
      ]

  def self.all
    @@all_cards.each do |card|
      puts "-------------------------------------------------"
      card.instance_variables.each_with_index do |value, index|
        puts "#{ATTRIBUTES[index]} #{card.instance_variable_get(value)}"
      end
      puts "-------------------------------------------------"
    end
  end

end
```

Two things have been added to my `MTG` class, the first is a constant variable that has the definitions for my attributes as strings, all encapsulated within an array. I will be using this constant for the class method `MTG.all`. Now the purpose of this method will be to help orient the way the instances within `@@all_cards` are shown.

I first start `MTG.all` by iterating through `@@all_cards` which is a massive array that contains sub-arrays for each of its indexes. Then, for each index within `@@all_cards` (which contains an instance variable of `MTG`) I iterate through that to gather the instance variable's methods.

I do this by implementing the [instance_variables](http://ruby-doc.org/core-2.4.1/Object.html#method-i-instance_variables) method to get the name of an instance method, then by using the index of the instance, I chronologically title each method by the order name of the constant `ATTRIBUTES` in the `puts` method. Finally I finish that string off by interpolating the `card` with [.instance_variable_get()](https://ruby-doc.org/core-2.4.1/Object.html#method-i-instance_variable_get) so that it will return to me the value for that method.

The resulting output is as follows:

```
-------------------------------------------------
Card: Geier Reach Bandit
Set: Shadows over Innistrad
Market Value: 1.12
Rise/Fall amount: 1.12
Image URL: http://s.mtgprice.com/sets/Shadows_over_Innistrad/img/Geier Reach Bandit.full.jpg
-------------------------------------------------
-------------------------------------------------
Card: Wastes (1)
Set: Oath of the Gatewatch
Market Value: 1.0
Rise/Fall amount: 1.0
Image URL: http://s.mtgprice.com/sets/Oath_of_the_Gatewatch/img/Wastes 1.full.jpg
-------------------------------------------------
-------------------------------------------------
Card: AEther Tradewinds
Set: Kaladesh
Market Value: 0.74
Rise/Fall amount: 0.74
Image URL: http://s.mtgprice.com/sets/Kaladesh/img/AEther Tradewinds.full.jpg
-------------------------------------------------
-------------------------------------------------
```

So far so good. Next thing I'd like to have is a way to show just how many cards are initially being loaded so that the user has an idea of the range that is in the top price bracket. This type of method should most likely be included in the `Parser` class as it is still content collected from the website.

```
class Parser
  #...
  #....

  @@overall_card_rows = nil

  def self.scrape_cards
    doc = Nokogiri::HTML(open("./lib/test.html"))
    self.card_counter("./lib/test.html")
    #...
    #....
  end

  def self.card_counter(set_url)
    rows = Nokogiri::HTML(open(set_url)).css("#top50Standard tr")[0..-1]
    @@overall_card_rows = "#{rows.length}".to_i
    puts "loading the top #{@@overall_card_rows} gainers on the market for today..."
    print "Please be patient"; print "."; sleep(1); print "."; sleep(1); print "."; sleep(1); print "."; sleep(1);
    puts ""
  end

end
```

With my `Parser.card_counter(set_url)` method I can show the user how many cards are going to be loaded from within the `Parser.scrape_cards` method.

```
loading the top 50 gainers on the market for today...
Please be patient....
```

I'm now starting to get a feel of how I can make this work together for the user's end. I just need a few more methods here and there before I can have an interactive CLI. 

**Getting Ready for the CLI**

When I was using the `Parser.card_counter(set_url)` method, the only option that was being loaded were the top rising [standard](http://magic.wizards.com/en/content/standard-formats-magic-gathering) cards (which is a format used for tournament games). I want to offer the user the option to search for more than just this option. To do this I need to create a method that will allow me to change the css selectors depending on what the user chooses to search for:

```
def Parser.select_format(option)

  case option
    when 1
      "#top50Standard tr"
    when 2
      "#top50Modern tr"
    when 3
      "#bottom50Standard tr"
    when 4
      "#bottom50Modern tr"
    else
      "You're just making that up!"
  end
end
```

This is a good start, but I want to make it a little more dynamic so that it can change the wording in `Parser.card_counter(set_url)` to also match the user's choice:

```
class Parser
  #...
  #....

  @@overall_format_options = nil
  
  def self.select_format
    @@overall_format_options = nil
    input = gets.strip.to_i
    case input
      when 1
        @@overall_format_options = ["#top50Standard tr", "top", "Standard", "gainers"]
      when 2
        @@overall_format_options = ["#top50Modern tr", "top", "Modern", "gainers"]
      when 3
        @@overall_format_options = ["#bottom50Standard tr", "bottom", "Standard", "crashers"]
      when 4
        @@overall_format_options = ["#bottom50Modern tr", "bottom", "Modern", "crashers"]
      else
        "You're just making that up!"
    end
  end
end
```

With `Parser.select_format` now converted into a case statement that constructs an array relative to the user's choice, I can now build additional options that will be related to a chosen format. This method will definitely come in handy down the road as I continue to build up towards the CLI.

Another good thing to have added before the CLI is built is a date display. This will help the user know how old/new the information that is related to the chosen cards is:

```
def Parser.update_date
  time = Nokogiri::HTML(open("./lib/test.html"))
  time.css(".span6 h3")[0].text.split.join(" ").gsub!("Updated:", "")
end
```

After testing the returned string from `Parser.update_date` I was satisfied to move ahead onto the CLI now:

```
Sat Mar 11 02:29:25 UTC 2017
```

Before I move ahead let me show you the current state of the `Parser` class with all the methods combined together:

<div class="noborder" style="overflow: auto; width:960px; height: 797px;">
    <div class="noborder" style="width: 1485px;">
        <img src="http://i.imgur.com/XiUVFl5.png" style="float: left; width: 1479px; height: 780px; margin: 0 5px;" alt="class Parser">
    </div>
</div>

**Building the CLI**

Now that I have enough pieces built together from the `Parser` class, I can make a `CLI` class that will let me use those methods in a more interactive way:

```
require 'nokogiri'
require 'open-uri'

require_relative "./mtg"
require_relative "./parser"

class CLI

  def self.start
    puts "Please select your price trend Format:"
    puts "-------------------------------------------------"
    puts "|Last Update|#{Parser.update_date}"
    puts "-------------------------------------------------"
    puts "[1] Standard: rising cards today"
    puts "[2] Modern: rising cards today"
    puts "[3] Standard: crashing cards today"
    puts "[4] Modern: crashing cards today"
    puts "-------------------------------------------------"
    self.check_input
    Parser.scrape_cards
    MTG.all
  end

  def self.check_input
    sleep(1)
    puts "Please type out the number of the format you would like to see from above..."
    Parser.select_format
  end

end
```

The new `CLI` class has a simple, but effective display setting to work alongside the user's choice. By combining the different class methods from `MTG` and `Parser` the `CLI.start` method can cleanly show what the users prompted for with the assistance of the case statement that's in `Parser.select_format`, and has been triggered from within the `CLI.check_input` method.

If I now run the `CLI.start` method, this is what plays out:

```
Please select your price trend Format:
-------------------------------------------------
|Last Update| Sat Mar 11 02:29:25 UTC 2017
-------------------------------------------------
[1] Standard: rising cards today
[2] Modern: rising cards today
[3] Standard: crashing cards today
[4] Modern: crashing cards today
-------------------------------------------------
Please type out the number of the format you would like to see from above...
2
loading the top 50 Modern gainers on the market for today...
Please be patient....
-------------------------------------------------
Card: Tarmogoyf
Set: Future Sight
Market Value: 140.49
Rise/Fall amount: 5.48
Image URL: http://s.mtgprice.com/sets/Future_Sight/img/Tarmogoyf.full.jpg
-------------------------------------------------
-------------------------------------------------
Card: Fulminator Mage
Set: Shadowmoor
Market Value: 34.99
Rise/Fall amount: 4.99
Image URL: http://s.mtgprice.com/sets/Modern_Masters_2015/img/Fulminator Mage.full.jpg
-------------------------------------------------
-------------------------------------------------
```

Something I'd like to add to the card display however is the card number for the listing. That way I can clearly show which is #1 in the listing and which is the last one. It might also come in handy later when I want the user to select one of these specific cards for something:

```
class MTG
  attr_accessor :card, :set, :market_price, :price_fluctuate, :image
  @@all_cards = []
  ATTRIBUTES = [
      "Card:",
      "Set:",
      "Market Value:",
      "Rise/Fall amount:"
      "Image URL:"
      ]

  def initialize(attributes)
    attributes.each {|key, value| self.send("#{key}=", value)}
    @@all_cards << self
  end

  def self.all
    @@all_cards.each_with_index do |card, number|
      puts "-------------------------------------------------"
      puts "|- #{number + 1} -|"
      puts ""
      card.instance_variables.each_with_index do |value, index|
        puts "#{ATTRIBUTES[index]} #{card.instance_variable_get(value)}"
      end
      puts "-------------------------------------------------"
    end
  end

end
```

Here I changed `MTG.all` to show the index number of the array `@@all_cards`, this way I am able to see what card it is going to be parsing, and also so that it can be shown to the user as well. 

```
-------------------------------------------------
|- 1 -|

Card: Kalitas, Traitor of Ghet
Set: Oath of the Gatewatch
Market Value: 22.63
Rise/Fall amount: -.71
Image URL: http://s.mtgprice.com/sets/Oath_of_the_Gatewatch/img/Kalitas, Traitor of Ghet.full.jpg
-------------------------------------------------
-------------------------------------------------
|- 2 -|

Card: Inspiring Statuary
Set: Aether Revolt
Market Value: 2.0
Rise/Fall amount: -.55
Image URL: http://s.mtgprice.com/sets/Aether_Revolt/img/Inspiring Statuary.full.jpg
-------------------------------------------------
-------------------------------------------------
```


This is looking good. I have noticed though that the list gets a bit bland with the content all being the same color. To resolve this I browsed around and found a gem called [tco](https://github.com/pazdera/tco) that would allow me to manipulate how my content looks in the terminal. 

**Adding color to the CLI**

Using the below gem:

* [Tco](https://github.com/pazdera/tco)

```
require "tco"

conf = Tco.config
conf.names["purple"] = "#622e90"
conf.names["dark-blue"] = "#2d3091"
conf.names["blue"] = "#42cbff"
conf.names["green"] = "#59ff00"
conf.names["yellow"] = "#fdea22"
conf.names["orange"] = "#f37f5a"
conf.names["red"] = "#ff476c"
conf.names["light_purp"] = "#4d5a75"
Tco.reconfigure conf

COLORS = ["purple", "dark-blue", "blue", "green", "yellow", "orange", "red", "light_purp"]

mtg = <<-EOS
          BB    BB           BBBBBBBBB       BBBBBBBBB
         BBBB  BBBB             BBB        BBBB     BBB
       BBBBBBBBBBBBBB           BBB        BBB
     BBBB    BB    BBBB         BBB        BBB      BBBBBB
    BBB              BBB        BBB        BBBB       BBB
  BBBBBB            BBBBBB      BBB         BBBBBBBBBBB
EOS

card = <<-EOS

    BBBBBBB        BBBB        BBBBBBB      BBBBBBB
   BBB            BB  BB       BB   BBB     BB    BBB
  BBB            BBB  BBB      BB   BBB     BB     BBB
  BBB           BBBBBBBBBB     BBBBBB       BB     BBB
   BBB         BBB     BBBB    BB   BBB     BB    BBB
    BBBBBB    BBB       BBBB   BB    BBB    BBBBBBB
EOS

finder = <<-EOS

   BBBBBBBBBB  BB  BBB      BB  BBBBBBB     BBBBBBB  BBBBBBB
   BB          BB  BB BB    BB  BB    BBB   BB       BB  BBB
   BBBBBBBBB   BB  BB  BB   BB  BB     BBB  BBBBB    BBBBBB
   BB          BB  BB   BB  BB  BB     BBB  BB       BB   BB
   BB          BB  BB    BB BB  BB    BBB   BB       BB    BB
   BB          BB  BB     BBBB  BBBBBBBB    BBBBBBB  BB     BB
EOS

puts ""
print mtg.fg "red"; sleep(1);
print card.fg "orange"; sleep(1);
print finder.fg "yellow"; sleep(1);
puts ""
```

Here I have configured a set of default colors that my program can choose from the array constant `COLORS`.
By accessing `COLORS` with the gem's built in methods (`.fg` for foreground and `.bg` for background) I can then begin to include these colors onto my different classes, so that they may display themselves nicely for the user:

```
class MTG
  #...
  #....
  
  def self.all
    puts "-------------------------------------------------"
    print "                                                 ".bg COLORS[7]
    @@all_cards.each_with_index do |card, number|
      puts ""
      puts "-------------------------------------------------"
      puts "|- #{number + 1} -|".fg COLORS[4]
      puts ""
      card.instance_variables.each_with_index do |value, index|
        puts "#{ATTRIBUTES[index].fg COLORS[2]} #{card.instance_variable_get(value)}"
      end
      puts ""
      puts "-------------------------------------------------"
      print "                                                 ".bg COLORS[7]
    end
  end
	
end

	
class CLI

  def self.start
    puts "Please select your price trend Format:"
    puts "-------------------------------------------------"
    puts "#{"|Last Update|".fg COLORS[6]}#{Parser.update_date}"
    puts "-------------------------------------------------"
    puts "#{"[1]".fg COLORS[3]} Standard: #{"rising".fg COLORS[4]} cards today"
    puts "#{"[2]".fg COLORS[3]} Modern: #{"rising".fg COLORS[4]} cards today"
    puts "#{"[3]".fg COLORS[3]} Standard: #{"crashing".fg COLORS[6]} cards today"
    puts "#{"[4]".fg COLORS[3]} Modern: #{"crashing".fg COLORS[6]} cards today"
    puts "-------------------------------------------------"
    self.check_input
    Parser.scrape_cards
    MTG.all
  end

  def self.check_input
    sleep(1)
    puts "Please type out the #{"number".fg COLORS[3]} of the format you would like to see from above..."
    Parser.select_format
  end

end
```

Terminal:

<img src="http://i.imgur.com/U8N1m24.png" title="terminal with tco gem">

The application is coming along nicely. But one thing that has been bothering me is how I can work to allocate the content I'm scraping from the site in a more organized, and accessible manner. Having it all stored in this one class variable `@@all_cards` seems messy and dangerous. If I could create a database that also gathers this content, I would be able to have functions that can parse already downloaded content from the database instead of the website. This would reduce long calls to the site as well as loading times for re-typed user prompts from within the CLI. Not to mention that it would allow me to make organized layouts for the information within the database; which I could later use to say, print out the information.

**Creating a Database**

In order to make this happen I will need to bind a database engine onto my application. With the help of the gem [Sqlite3](https://github.com/sparklemotion/sqlite3-ruby), I can now begin building the structure that will store the gathered data.


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

<div class="noborder" style="overflow: auto; width:960px; height: 1431px;">
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

So to shorten this part `SET card=(?), sets=(?), market_price=(?), price_fluctuate=(?), image=(?)`, I'll have gather the *names* of my attributes and concatenate them with the associated question marks as a string:

```
def self.sql_columns_to_update
  columns = ATTRS.keys[1..-1]
  columns.collect {|attr| "#{attr}=(?)"}.join(", ")
end
```

Here I am returning the number of keys in the `ATTRS` hash minus one for the `id`(which is why I start the array iterator at `1`). Then I convert them into an *attribute=(?)* array that is then turned into comma separated *string*.

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

<div class="noborder" style="overflow: auto; width:960px; height: 797px;">
    <div class="noborder" style="width: 1485px;">
        <img src="http://i.imgur.com/XiUVFl5.png" style="float: left; width: 1479px; height: 780px; margin: 0 5px;" alt="class Parser">
    </div>
</div>

I can use this to my advantage instantly. All I have to do is make the method for the module `Persistable`, that will simoutaneously put that scraped card into my database:

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

Another thing that would make sense to have is a way to allow the user of my gem to have an option that can show them where to purchase one of the queried cards. I found from personal experience that [eBay](http://www.ebay.com/) seems to have the most competitive prices for Magic the Gathering trading cards. So for my case, I will build a method that will display to the user a url to one of the listed cards within eBay's market place:

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

**Finishing Up Class Parser**

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

