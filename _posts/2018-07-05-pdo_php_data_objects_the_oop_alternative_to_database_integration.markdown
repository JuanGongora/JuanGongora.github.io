---
layout: post
title:      "PDO (PHP Data Objects) the OOP alternative to database integration"
date:       2018-07-05 18:35:15 +0000
permalink:  pdo_php_data_objects_the_oop_alternative_to_database_integration
---

I recently completed the build of a pure [PHP CMS](https://github.com/JuanGongora/PHP-CMS-Example/tree/master) (well a little bit of Javascript in there too just for some client side assistance). As I continued to construct the logic for its server side data management, I came to really appreciate the usage of PDO over [MySQLi](http://php.net/manual/en/book.mysqli.php) (which is what I was using before).

As the PHP docs put it:

> The PDO extension defines a lightweight, consistent interface for accessing databases in PHP. Each database driver that implements the PDO interface can expose database-specific features as regular extension functions. Note that you cannot perform any database functions using the PDO extension by itself; you must use a database-specific PDO driver to access a database server.

You will see however, that PDO is compatible with various database management systems ([check out the drivers](http://php.net/manual/en/pdo.drivers.php)), and they all share the same code type.

Also, working with prepared statements is much easier as you can have named placeholders (`:calories`) instead of just question marks (`?`).

```
<?php
/* Execute a prepared statement by binding PHP variables */
$calories = 150;
$color = 'red';
$sth = $dbh->prepare('SELECT name, color, calories
    FROM fruit
    WHERE calories < :calories AND color = :color');
$sth->bindValue(':calories', $calories, PDO::PARAM_INT);
$sth->bindValue(':color', $color, PDO::PARAM_STR);
$sth->execute();
?>
```

To learn the full stack check the glossary for [PDO](http://php.net/manual/en/book.pdo.php).

We will however begin with a simple sample. First we need to assign a DSN (Data Source Name), which will contain all the info required to connect to the database:

```
<?php

class Database {

    public function getConn() {
        $db_host = "localhost:3306";
        $db_name = "cms";
        $db_user = "cms_www";
        $db_pass = "pass";

        $dsn = "mysql:host=" .$db_host . ";dbname=" . $db_name . ";charset=utf8";
    }

}
```

We then create a PDO object that is passed the `$dsn` property, along with the other variables to then return its final value:

`return $link = new PDO($dsn, $db_user, $db_pass);`

After we have done this we can begin the first stage to manipulate the database:

```
$db = new Database();
$link = $db->getConn();
```

These properties will now be used to query the database using a sql statement in this case:

```
$sql = "SELECT * FROM article ORDER BY published_at";

$result = $link->query($sql);
```

Here we made a `$result` property that uses the `$link` variable (which contains the DBO class) to access its built in method `query`. This executes an SQL statement, that then returns a resulting set as a PDO statement object.

After you have done an attempted connection, it's good practice to test whether or not it was successful. If not, then you should output what the error was to find out how to resolve it:

```
if ($result === FALSE) {
   echo $link->errorInfo();
}
```

The class method `errorInfo` will fetch extended error information associated with the database handle.

When the connection works however, we should fetch its content with the PDO class method `fetchAll`:

```
else {
    $articles = $result->fetchAll(PDO::FETCH_ASSOC);
}
```

This method returns an array containing all the result set rows for the previous `$sql` argument. Take note however that if you want the returned array to be associative (the keys for the values will actually be the names of the columns, not just the default integers of a converted PHP array) then you need to assign the `PDO::FETCH_ASSOC` argument along with it.

Speaking of the `$sql` variable, as was previously mentioned at the very beginning, PDO can use 
*named placeholders* instead of questions marks.

Lets make a new property using a name placeholder:

```
$sql = "SELECT $columns FROM article WHERE id = :id";

$stmt = $link->prepare($sql);

//the prepared statement
$stmt->bindValue(":id", $id, PDO::PARAM_INT);
```

`:id` is now inserted to be replaced by the active value of the argument. We then create a statement that uses the PDO object method `prepare` in order to... that's right, *prepare a (SQL) statement* for execution and return that statement object.

Following that generated statement object within `$stmt`, we then use the PDO object method `bindValue` to bind the `":id"` string into a value that will come from the passed in `$id` variable. At the same time we also make sure that whatever is currently assigned to `$id`, is an integer parameter (checked by the data type constant `PDO::PARAM_INT`).

Now that we have bound the values we can check to see if the `$stmt` variable is executable, meaning that it's able to run, with the PDO object method `execute` (note that we can use execute on its own to process a SQL statement to the database, but here we are just looking for a true or false, since we want to return fetched content, not insert content).

```
if ($stmt->execute()) {

    return $stmt->fetch(PDO::FETCH_ASSOC);
}
```

If it returns true, then we use the PDO method `fetch` on `$stmt` to deliver us an array of the requested parameters from the `$sql` string (note that this time we are asking for just one specific argument, so we don't need to receive it all, like we did with `fetchAll` earlier).

Here is the full listing altogether now:

```
<?php

class Database {

    public function getConn() {
        $db_host = "localhost:3306";
        $db_name = "cms";
        $db_user = "cms_www";
        $db_pass = "pass";

        $dsn = "mysql:host=" .$db_host . ";dbname=" . $db_name . ";charset=utf8";

        return $conn = new PDO($dsn, $db_user, $db_pass);
    }

}

$db = new Database();
$link = $db->getConn();

$sql_one = "SELECT * FROM article ORDER BY published_at";

$result = $link->query($sql_one);

if ($result === FALSE) {
    echo $link->errorInfo();
} else {
    $articles = $result->fetchAll(PDO::FETCH_ASSOC);
}

$sql_two = "SELECT $columns FROM article WHERE id = :id";

$stmt = $link->prepare($sql_two);

//the prepared statement
$stmt->bindValue(":id", $id, PDO::PARAM_INT);

if ($stmt->execute()) {

    return $stmt->fetch(PDO::FETCH_ASSOC);
}
```

This is just touching the tip of the iceberg, there are various other ways to access content from the database depending on the type of data you are trying to assert it as. You can even assign and fetch data as converted objects using PDO methods like `setFetchMode`:

`$stmt->setFetchMode(PDO::FETCH_CLASS, "Article");`

I highly recommend having a good overview at its [glossary](http://php.net/manual/en/book.pdo.php), so you can pick the use-cases that make the most sense for what your application will be doing. But hopefully, this has gotten your feet wet enough to recognize the usefulness of PDO, compared to the much more generalized MySQLi driver.

Happy coding!

~Juan
