---
layout: post
title:      "OOP Crash Course for PHP"
date:       2018-05-11 16:06:06 -0400
permalink:  oop_crash_course_for_php
---


For the last few months, I've been learning about PHP, in order to understand, and work on a framework that relied on this language. Now PHP is not a full object oriented language like Ruby, it has a lot of procedural, and functional programming built into it. Which is interesting because I came from learning Ruby, which is hard core OOP, due thanks to the awesome teaching from Flatiron School.

PHP will give you however, a lot of **AHA!** moments when you are reading and comparing it to Ruby, but some things are definetly a little funky in definition when it comes to orienting something to a particular writing methodology. This is because as I mentioned, PHP taps into other formats of writing aside from OOP. This can at the same time be good, but also confusing if you don't know how to associate the differences in the syntax.

That is exactly why I have written this mini crash course into the object oriented rendition of PHP.

To start things off, PHP assigns actionable operations with functions. But to convert the methodology into OOP, a function is replaced by a method. And a variable that is then shared between methods, and that can also belong within a class, are then called a property. 

`var $options = array();`

The overall machine, in terms of everything that would relate to one another, is the Class, and so those related methods and variables, would then be contained within that class. 

`class Crud {}`

Every Class has the potential to contain whats called a constructor.

`function __construct($options) {}`

This constructor has the job of implementing rules that are used to make what's called an instance. 

An instance is simply an extended reference to that class. 

`$crud = new Crud($options);` 

It's a variable that inherits whatever methods it's allowed to use from the class that made it. Take note that this instance is not within the internal scope of the class. It is its own outright individual, once it has been created.

When you have a variable that is going to reference itself, in order to call a **Class method**, you create a pointer to it: 

`$content = $crud->display_page();`

The `->` is called an object operator.

Here the `$content` variable is assigned the `$crud` instance, which is calling the class method `display_page()`. 

Inside the` class Crud {}` it is shown like this:

`function display_page() {}`


> Note: In PHP, although it is still titled with the word function, the standard way to describe it when it's inside of a class, is as a method. They're just functions that belong inside of a class or an object, which perform actions on the various objects within their methods.

> Note: You may come across static functions in classes (`static function example() {};`), which are able to call the method of a class without actually having an instance. Without this keyword, we would have to call `function example() {}` from its own class. So, we would do something like create an instance variable, say it equals a new class, and then we could call the method on to it.  But with static, in order to call the methods without an instance (AKA onto other classes and such), we simply have the name of the class, two colons, and then the name of the method: `Crud::example()`. Instead of the much longer:
> 
>
> ```
> $page = new Crud($value);
> $page->example();
> ```

On the flip side, this does not offer the ability of its outcome to become a property of the class that its called upon, it's more like a reference. This brings us to a private variable: Any variable that has the potential to be passed to other functions (methods) inside of a class is called a private variable:

```
function __construct($options) {
  $this->options = $options;
  foreach ($options as $key => $val) {
    $this->$key = $val;
  }
  $this->path = $_GET['path'];
}
```

So here the variable `$this` is capable of being referenced to the other methods in the class. `$this` is the private variable (which references the particular instance of the class that's currently being worked on, or rather, being instantiated by the constructor; think of 'self'). 

And here, `options` is just a variable that is put at that current state, but it then becomes a **property** of the class when we establish it here to the private variable. So for this instance of the class (referred to as 'self' or `$this`), we're going to pass it some `options` and then we're going to set those parameters as a property within the class which we can then reference anywhere else.  

Notice that when you establish the **property** you don't use a dollar sign like you would for a traditional variable: `options`.

> Note: options  can then become a public variable itself, `public $options;` which allows you to use it within other methods as a reference, if it's declared as such in the scope of the class. But it would have to be called with the help of an **object operator**. Once it's declared as a public variable, it can also be called by instances of the class, not just methods.

In the next couple of lines, we're then looping through the `$options` array, which is what was passed in as the argument to the constructor, and as a result, we're adding some additional properties to the class.

This will in turn make it a little bit easier to reference them later on, so we don't always have to refer to `options` directly.

At the end of the `__construct` method, we're creating a new **property** for the class called `path`, but we're establishing it the same way as `options`. Which could also have the potential to become a public variable: `public $path;`.

To further iterate, `$this` is using the **object operator**(`->`) to call other functions (methods) that are already present in the class, while being inside of the functions/methods. And in the case above, they are instantiated methods to the constructor.

To summarize, `class Crud` has an added property here of a `var $options = array();` which is the same as a variable, and it exists within a class that has methods, which are the same as functions, including a constructor method in this case:

`function __construct($options) {}`

And as mentioned previously, there are also static functions, and property related functions through which private variables define the current state of a method. You can see them as a comparison to a *class method*, and an *instance method* like in Ruby for example.

Another good thing to know about are **class extensions**. These work in the same way as Ruby does for class inheritance. But instead of using a less than symbol, you use the keyword `extends`:

```
class Page {

    public $settings;
    public $title;
    public $output;

    function __construct($settings, $title) {
        $this->settings = $settings;
        $this->title = $title;
    }
    /**
     * Renders the page content based on a simple template.
     */
    function theme() {
        return '
      <html>
        <head>
          <title>' . $this->title . '</title>
        </head>
        <body>
          ' . $this->output . '
        </body>
      </html>';
    }
}

class PrintedPage extends Page {

    function theme() {
        return '
      <html>
        <head>
          <title>FOR PRINT: ' . $this->title . '</title>
        </head>
        <body>
          <div style="width:800px;border:5px solid black;margin-left:auto;margin-right:auto;padding:20px;">' . $this->output . '</div>
        </body>
      </html>';
    }
}
```

Here the class `PrintedPage {}` is extending the usage of the method `function theme() {}` from the original class `Page {}`.

The next line up of object oriented mechanics is the concept of an interface:

```
interface Page {
    function build();
    function theme();
    //function iDoNotExist();
}
```

So, an [interface](http://phpenthusiast.com/object-oriented-php-tutorials/interfaces) is like a scaffolding for a class. It doesn't include any logic. It just specifies what methods need to exist in the classes that inherit from it. Every encapsulated function that resides within the interface, must be inherited by the class.

Interfaces resemble abstract classes in that they include abstract methods that the programmer must define in the classes that inherit from the interface. In this way, interfaces contribute to code organization because they commit the child classes into abstract methods that they can implement.

Now, in order to associate those methods to a class you have to use the keyword **Implement**.

```
class PrintedPage implements Page {
//some code here
}
```

By implementing `Page` to the `class PrintedPage` it now requires the usage of those methods. So it needs to have `build`, as well as `theme`. If either of those methods aren't implemented, then it would throw an error:

`Fatal error: Class PrintedPage contains 1 abstract method and must therefore be declared abstract or implement the remaining methods (Page::iDoNotExist) in /app/index.php on line 105 Call Stack: 0.0001 365016 1. {main}() /app/index.php:0 `

Now for abstract classes:

`abstract class Page {}`

An abstract simply means that a class cannot be used outside of inheritance, so we couldn't call the `class Page` from above alone without causing some errors. 

Now, within the class, we can implement functions just like we could in a non-abstract class. But in an abstract class, we can also define abstract methods, and these work in the same way that an interface does:

`abstract function theme();`

It specifies that any class inheriting from its class needs to implement its function:

```
class DefaultPage extends Page {

    function theme() {
        return '
      <html>
        <head>
          <title>' . $this->title . '</title>
        </head>
        <body>
          ' . $this->output . '
        </body>
      </html>';
    }
}
```

So, as you see here above, there's the `class DefaultPage` and it's extending the `abstract class Page {}`. As well as including the `theme() {}` method, which is required by `abstract class Page {}` when used as an extension.

So, the advantage of using this abstract class over an Interface is that we can define methods that are common for anything that inherits from it.

So, whereas with an interface, we had to duplicate the `build`, as well as `theme` methods, with an abstract class, we can define those in the **base class**, and so they don't have to be redefined by the classes that extend from it.

But we also have the advantage of telling the classes that will inherit from it specific things that they do need to do in order to behave in the way that we expect.

<center>**Public/Private/Protected**</center>

Going back to the public variable that was discussed earlier, a class is also capable of storing private variables:
`private $settings; `

These have the restriction of not being able to be called by instances of the class, as well as be accessed by any classes that inherit from it. Basically, it's something that is only active within the class that it resides in and nowhere else.

There are also *Protected* variables, which can't be accessed by instances that are created by the class. Which does make it less strict than a private variable:
`protected $settings;`

Take note that public, private, and protected can also be used on methods. It is not reserved for just variables. They function in the same terms as were described above for variables. To give an example, if a method was private: `private function submit() {}`

It would not be called by an instance, and would not be inherited by a class that was extending it. It would basically be a method that is only called internally within the class, by either a method that was referencing it, or by a class variable that was assigned to reference it. Otherwise, the user is not capable of calling this private method independently.

<center>**Object Oriented Guidelines**</center>

For the sake of organization, it's common practice to have classes that contain methods which are relevant to their operations. If this is not the case, then it's prudent to separate those non equivalent methods into their own classes.

This can be furthered even more by having those now separated classes actually be contained in alternate files. The advantage of this is visual clarity, and ease of refactoring. If everything is not bundled up into one file, it makes it easier for the coder to parse through its content and get a faster understanding of its components.

But in order for those separated files to still communicate with one another we would have to use the *require* keyword:

`require_once __DIR__ . '/lib/Builder.php';`

Above, we would have this single line of code at the very top of the file, using the keyword `require` to point to a path in the directory that would lead to another file, which contains the class that we also need to work with. Here, the term `require_once` is implemented so that the file only fetches that content one time, and does not bring it to play anymore than that.

Also if you look at the string, the file that it's requiring is titled `Builder.php`. This means that the file must contain a class called `Builder`. This is also common practice. A file name should be titled by the name of the class that it's supposed to contain.

Now, on to another version of including code from another place: *namespacing*.  So what is it exactly? A namespace is kind of like a virtual folder. It allows you to have a file for example, that could be anywhere in the directory, BUT have it still belong to a special directory: 
 
`namespace PHP\OOPExampleSite;`

This file though, isn't actually in that special directory at all. This is all *virtual*, right? And it's not like we are using the file as a `require`. But, in order to use a class that includes a namespace, we have to specify that it belongs to this namespace.

So say that `Builder.php` has the following line at the top of its file: `namespace PHP\OOPExampleSite;`

The `class Builder` is now a namespace of an `PHP\OOPExampleSite` directory. 

It can be used to explicitly request an element from that current namespace or a sub-namespace. You could say that it's the equivalent of the *self* operator for classes. 

If it wasn't a namespace, you would instead have to use the entire path in a method in order to call it on another file: 

```
public function build() {
  $builder = new PHP\OOPExampleSite\Builder();
  $this->output = $builder->render($this->settings);
}
```

But by simply having the snippet` namespace PHP\OOPExampleSite;`, it's already assuming that `Builder` is related to that namespace, so it can be called without having to include the entire path.

Where namespacing really shines, is when there is a duplicate name for something, and you want to be clear about which particular rendition you are referring to.

By having the `use` keyword, along with the virtual path (that leads to the file containing the specific redundant word) you are now capable of setting that specific version to work on your file:

```
// this file is called PrintedPage.php

namespace PHP\OOPExampleSite\Page;

use PHP\OOPExampleSite\Page;

require_once __DIR__ . '/Page.php';

class PrintedPage extends Page {

  public function theme() {
    return '
      <html>
        <head>
          <title>FOR PRINT: ' . $this->title . '</title>
        </head>
        <body>
          <div>' . $this->output . '</div>
        </body>
      </html>';
  }
```

The first line: `namespace PHP\OOPExampleSite\Page;` is a sub-directory that contains the current class `PrintedPage`. The second line `use PHP\OOPExampleSite\Page;` is actually a reference to the parent `class Page`, which is being extended by `PrintedPage`. So if we were to go to the file where `class Page` resides, we would simply see this at the top: 
`namespace PHP\OOPExampleSite;`

The reason why we are using:

```
namespace PHP\OOPExampleSite\Page;

use PHP\OOPExampleSite\Page;
```

On the file above, is because if we didn't, we would get an error thrown back at us:

`Fatal error: Class 'PHP\OOPExampleSite\Page\Page' not found in /app/lib/PrintedPage.php`

It would believe that it needs to find a file `Page` inside a directory called `Page`. Instead we use the file `Page` that contains the extended class at path `PHP\OOPExampleSite`. While at the same time we have **CREATED** a virtual folder called `Page`, which contains the file above (called `PrintedPage.php`). Take note that it also in a sense makes the class itself like a directory too. Because if it's referenced simply **by name**, like it is in `PrintedPage.php`, then it's associating the `Page` class as a directory to its methods.

There's also one more neat way to show you how to handle same word conflicts:

```
use ThirdParty\Utilities\Validator as OtherValidator;
use PHP\OOPExampleSite\Validator;

//some code....

case 'not_empty':
        if (!Validator::notEmpty($value)) {
            if (!OtherValidator::notEmpty($value)) {
                return false;
            }
        }         
break;
}
```

Let's say, as shown above, that there are two classes that share the same name, but have different functions. You want to use both inside this file however.

What you can do is create a *pseudonym* for one of those classes, which in turn makes it capable for you to operate on both classes but with different references.

So by using the `as` keyword for `use ThirdParty\Utilities\Validator as OtherValidator;`, you can then call the pseudonym class along with the other same word class in order to use both of them. And here we can use `OtherValidator` in order to use the third-party validator without conflict, and then a regular `Validator` that comes from the basic path: 

`use PHP\OOPExampleSite\Validator;`

The best part is that we don't have to edit our third-party files at all in order to be able to use this other name. This as you can imagine is handy when you need to use an outside library, that has a possible name conflict to code you already have created in your application.

There is also a good reason to use namespaces aside from what was shown above. And that's from leveraging something called *autoloading*.

Autoloading allows you to automatically include our class files whenever we instantiate a class or use it on a file. 

We'd then be able to remove the `require_once`  and just use the `use` statements. 

For example, we could instantiate a `$page = new Page($value);` object, which would trigger a call to the autoloader so it can locate the `Page` file, `include` it, and then not `include` it again (because it knows that it's already included the file). That simplifies our code a bit. and it allows us to use namespaces, but the big benefit to it is something called **lazy loading**, which is the idea that we are not going to include this `Page` file until we actually use the class that's inside of it; and that's pretty powerful.

To introduce it, we will make this:

```
<?php

function my_autoloader($namespace)
{
    $namespace_array = explode("\\", $namespace);
    $class = end($namespace_array);
    $file_location = __DIR__ . '/lib/' . $class . '.php';
    include $file_location;
}

// Autoloads the function described above.
spl_autoload_register('my_autoloader');

use PHP\OOPExampleSite\Builder;
use PHP\OOPExampleSite\ContactUsController;


// Instantiate a Builder object to use below.
$builder = new Builder();

$footer = $builder->render($page_elements);

print ContactUsController::ContactUsPage($page_elements);

?>
```

So, we are using this function called `spl_autoload_register()`. SPL is short for **S**tandard **P**HP **L**ibrary, and the parameter this takes (`'my_autoloader'`) is the name of the function that gets called whenever a class gets instantiated; you can actually register multiple functions this way.

So what this means for the example above, is that once it hits the `spl_autoload_register('my_autoloader');` line to register the autoloader, it then skips over to the first line of executable code; which for this example is the instantiation of the Builder class:

`$builder = new Builder();`

As a result it recognizes that `Builder` is a name which is being `use`(d). So it goes ahead and takes a look at `function my_autoloader($namespace)` which was autoloaded, and replaces the `$namespace` variable with: `PHP\OOPExampleSite\Builder`.

Using the `explode()` function, it separates the string paths into array values, and then with the `end()` function, it grabs the last value of that array (which is the name of the class) in order to dynamically set the included path of the class into that file.

> Note: Once you implement third-party libraries, it's best to create real path directories in reference to your `use`(d) files. Because even though namespacing is capable of creating virtual path directories, it might end up overlapping with an actual third party path that really exists, and it could also use a similar path name to that of your virtual path.

That about sums it up for a quick and handy overview of OOP in PHP. I have been working on other PHP related learning, specifically the Symfony framework, which is built on top of the [Drupal 8 CMS](https://www.drupal.org/). I will be covering a short overview of what exactly that is, and how it builds PHP applications through its set of packages and networked functions.

Until then, happy coding!

~Juan

