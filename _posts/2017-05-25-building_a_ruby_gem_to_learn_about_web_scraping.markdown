---
layout: post
title:  Building a Ruby gem to learn about web scraping (Part 1)
date:   2017-05-25 12:02:41 -0400
---

One of the most interesting things to discover while learning a programming language is how you can implement that knowledge into an idea, and then transform it into a reality.

In this case, that is what I'm going to present here in this blog with my work with [Ruby](https://en.wikipedia.org/wiki/Ruby_(programming_language)). I will start out with the initial concept that I had, and then continue building it up from there.

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

<div class="noborder" style="overflow: auto; width:760px; height: 797px;">
    <div class="noborder" style="width: 1479px;">
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

The application is coming along nicely. But one thing that has been bothering me is how I can work to allocate the content I'm scraping from the site in a more organized, and accessible manner. Having it all stored in this one class variable `@@all_cards` seems messy and dangerous.

If I could create a database that also gathers this content, I would be able to have functions that can parse already downloaded content from the database instead of the website. This would reduce long calls to the site as well as loading times for re-typed user prompts from within the CLI.

Not to mention that it would allow me to make organized layouts for the information within the database, which I could later use to say, print out the information!

On [part 2](http://imjuan.com/2017/05/29/building_a_ruby_gem_to_learn_about_web_scraping_part_2/) of this gem build, I will show how I built a database for my downloaded content.





