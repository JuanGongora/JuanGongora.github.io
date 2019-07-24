---
layout: post
title:      "QuickStart your Nginx Learning"
date:       2019-07-24 11:43:15 -0400
permalink:  quickstart_your_nginx_learning
---

<img src="https://i.imgur.com/7fMzHJQl.jpg" title="Nginx variables at work" />

So... I'm sure that you've most likely read or heard that Nginx is faster than Apache. After all, one of Nginx's core development focuses was on improved performance. but it's really important to define what's meant by fast. Nginx can't magically deliver content to the client any faster than the internet connection will allow. But it can serve static resources much faster than Apache, and it can handle a much larger number of concurrent requests. Nginx can serve static resources without the need to involve any server side languages. And this gives quite an advantage over Apache (especially if you work with a [SPA](https://en.wikipedia.org/wiki/Single-page_application) framework). And as for handling concurrent requests, Nginx can potentially receive thousands of requests on a single processing thread, and respond to them as fast as it can without turning down any of those requests. Apache on the other hand will accept requests only up to the pre-configured number, and then simply reject the rest.

So if we define performance or being fast in terms of how many clients can be served under high load, assuming the usual mix of static and dynamic resources; then yes, Nginx is definitely faster than Apache. Nginx configuration also takes a very different approach to Apache's, in that requests are interpreted as URI locations first, where as Apache defaults to file system locations. This preference for file system locations can also be seen in the use of `.htaccess` files for overriding specific directory configurations. Nginx doesn't offer any similar functionality; but seeing as Apache's `.htaccess` overrides can also carry a significant performance penalty, they shouldn't really be considered an advantage. Also, because Nginx is designed to interpret requests as URI locations, it can easily function not only as a web server, but can also be anything from a load balancer, to a mail server!

At this point the question comes around, *why am I even talking about Nginx*?
 
Well good reader, I'm currently working with a full-stack JavaScript application that is using Nginx! And I had mainly been a user of Apache in the past, so I figured it would behoove me to create a go-back guide to this server technology. This way I can retain the important parts for a clean setup, and implement production ready configurations in the future. And I hope, that this may also help you, dear reader!

**Building Nginx from Source**

To start things off I'm going to install Nginx on a remote server, but without using *package managers*, as those are really only used for quick and simple set ups. Nginx, as you'll soon see has the power of custom modules, which can provide useful solutions to various edge cases. But, these are only bundled together when you build from source. Well enough of that! First let's get the appropriate download link which can be found [here](http://nginx.org/en/download.html).

Once you have gone to that site, copy the url link of the *Mainline version* for your appropriate machine. For my instance, I'm using Ubuntu 16.

On the terminal of your server:

`wget http://nginx.org/download/nginx-1.15.10.tar.gz`

extract the newly downloaded file and cd into it:

```
tar -zxvf nginx-1.15.10.tar.gz
cd nginx-1.15.10
```

Now before we can configure Nginx, we need a compiler, and for this Ubuntu server, I don't have one installed, so I'll have to get one with this:

`apt-get install build-essential`

After the command has finished installation, I can run the executable file inside the Nginx directory:

`./configure`

Depending on your operating system, some errors may occur during configuration. But worry not! Simply download the requested libraries which will be outputted by the error handling, and you may then continue on!

For my case, this is what was additionally needed in Ubuntu:

`apt-get install libpcre3 libpcre3-dev zlib1g zlib1g-dev libssl-dev`

And then I was able to re-run:

`./configure`

No errors were outputted this time, and I was presented with the finished text below:

```
Configuration summary
  + using system PCRE library
  + OpenSSL library is not used
  + using system zlib library

  nginx path prefix: "/usr/local/nginx"
  nginx binary file: "/usr/local/nginx/sbin/nginx"
  nginx modules path: "/usr/local/nginx/modules"
  nginx configuration prefix: "/usr/local/nginx/conf"
  nginx configuration file: "/usr/local/nginx/conf/nginx.conf"
  nginx pid file: "/usr/local/nginx/logs/nginx.pid"
  nginx error log file: "/usr/local/nginx/logs/error.log"
  nginx http access log file: "/usr/local/nginx/logs/access.log"
  nginx http client request body temporary files: "client_body_temp"
  nginx http proxy temporary files: "proxy_temp"
  nginx http fastcgi temporary files: "fastcgi_temp"
  nginx http uwsgi temporary files: "uwsgi_temp"
  nginx http scgi temporary files: "scgi_temp"

root@vultr:~/nginx-1.15.10# 
```

So that was a very simple teaser of installing Nginx from source. Not as scary as you thought it would be, right?

*But wait there's more!!*

Now that you've gotten a taste of it, there are ways to install all the related resources you may need with Nginx, all within a single patterned line!

Here's a [helpful link](http://nginx.org/en/docs/configure.html) to these configure commands.

With those linked commands we can then do:

`./configure --sbin-path=/usr/bin/nginx --conf-path=/etc/nginx/nginx.conf --error-log-path=/var/log/nginx/error.log --http-log-path=/var/log/nginx/access.log --with-pcre --pid-path=/var/run/nginx.pid`

(The location of Nginx is executable, with path of configuration files, with error log path set, with http access logs path set, using pcre library for regex, and process id path, for enabling system services)

This, when completed then outputs:

```
------------------------------------------
Configuration summary
  + using system PCRE library
  + OpenSSL library is not used
  + using system zlib library

  nginx path prefix: "/usr/local/nginx"
  nginx binary file: "/usr/bin/nginx"
  nginx modules path: "/usr/local/nginx/modules"
  nginx configuration prefix: "/etc/nginx"
  nginx configuration file: "/etc/nginx/nginx.conf"
  nginx pid file: "/var/run/nginx.pid"
  nginx error log file: "/var/log/nginx/error.log"
  nginx http access log file: "/var/log/nginx/access.log"
  nginx http client request body temporary files: "client_body_temp"
  nginx http proxy temporary files: "proxy_temp"
  nginx http fastcgi temporary files: "fastcgi_temp"
  nginx http uwsgi temporary files: "uwsgi_temp"
  nginx http scgi temporary files: "scgi_temp"
-----------------------------------------------------------------
```

As you can see, some of the paths logged there are the ones that I set flags for in the configuration string! The advantage of building from source is what enables you to assert custom modules during its creation, in order to extend the standard functionality of Nginx.

Next we can compile this configuration source by running:

`make`

Then install the now compiled source with:

`make install`

You can now check that the configuration files exist in the locations that we set:

`ls -l /etc/nginx/`

They're all there so we should now have the Nginx executable available, which means you can start Nginx by simply typing:

`nginx`

You can also get its full configuration details by typing:

`nginx -V`

Finally, check that the process is indeed running with:

`ps aux | grep nginx`

> ------extra tip
> 
> configure flags tell you what you customized in terms of settings for Nginx. If you want to apply modules to your configuration, you can see what's available with `./configure --help`. Take note that if you flag in the configuration where your .conf files will be located (`--conf-path=/etc/nginx/nginx.conf`) then you should also set where the added module paths need to be as well, since the default path would no longer be valid (set it to` --modules-path=/etc/nginx/modules`).
> 
> 
> To then apply custom modules, you will need to have them be loaded within your .conf file with the string `load_module /etc/nginx/modules/name-of-module.so`. Also take note about reading what sort of parameters a custom module can set under the Modules reference listing [here](http://nginx.org/en/docs/).
> 
> ------extra tip

**Using the Systemd Service**

Next up I'm going to introduce you to the systemd service. Systemd is a suite of basic building blocks for a Linux system. Which can allow us the ability to start and stop different sorts of services with one line commands.

First, let's send a signal to stop Nginx:

`nginx -s stop`

Now to enable `systemd` we'll have to add a small script, which will be the same across all operating systems. You can find the template systemd service file example [here](https://www.nginx.com/resources/wiki/start/topics/examples/systemd/).

You'll need to be inside the Nginx folder to create the file in the described location in the link, to then paste the coded template:

```
cd nginx-1.15.10
touch /lib/systemd/system/nginx.service
vi /lib/systemd/system/nginx.service
```

After pasting the service file script, take note that you'll have to change to the PID file to be inclusive to the `var` folder, as was done in the custom configurations, and the preset paths with `sbin` should be replaced to `bin`:

```
[Unit]
Description=The NGINX HTTP and reverse proxy server
After=syslog.target network.target remote-fs.target nss-lookup.target

[Service]
Type=forking
PIDFile=/var/run/nginx.pid
ExecStartPre=/usr/bin/nginx -t
ExecStart=/usr/bin/nginx
ExecReload=/usr/bin/nginx -s reload
ExecStop=/bin/kill -s QUIT $MAINPID
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

After you have saved the file, on the terminal type the following to turn on Nginx:

```
systemctl daemon-reload
systemctl start nginx
```

With our systemd services activated, we can now also check nginx status using systemd instead of the process command:

```
systemctl status nginx
```

You can now easily have nginx start up on a server boot as well:

`systemctl enable nginx`

**Configuration Terms**

Before we start fully configuring our web server, it's important to recognize the terminology that Nginx uses for its configuration files.

There are two main configuration terms; *Context* and *Directive*.

* Directive: Specific configuration options that get set in the configuration files and consist of a name and a value.

* Context: Sections within the configuration where directives can be set for that given context. Essentially context is the same as scope, and like scope context are also nested and inherit from their parents with the topmost context simply being the configuration file itself.

<img src="https://i.imgur.com/8f6riC6l.jpg" title="The main context, being the entire file itself" />

The other important contexts are `http {}` for anything http related, `server {}` which is where we define the virtual host (similar to an Apache host), and `location {}` for matching URI locations on incoming requests to the parent server context.

**Creating a Virtual Host**

It's time to make a simple virtual host, and see how we can serve static files from a directory on our server.

First, make the directory in your root:

`mkdir -p /sites/demo`

Then download from your local machine the site you want to be on your server, within the new folder you made:

`scp demo/* root@149.28.58.225:/sites/demo`

The main configuration file that we are going to edit for this is:

`/etc/nginx/nginx.conf`

Which is still serving the default page. We're going to start from scratch so remove all the existing content of this file:

`vi /etc/nginx/nginx.conf`

And replace with the following (with the server name obviously being your current IP):

```
events {}

http {

  include mime.types;

  server {

    listen 80;
    server_name 149.28.58.225;

    root /sites/demo;
  }
}
```

If you're wondering what the `include mime.types` is, it allows you to have Nginx load different `content-type`s (css/html) to your site, in the correct format extension. `mime.types` is actually a file provided by Nginx, which has a culmination of different file type extensions that you would perhaps use for your site. You may have noticed that I also kept the *events* context even though it's empty. This needs to be there for the configuration file to still be valid.

then type:

```
nginx -t
systemctl reload nginx
```

`nginx -t` checks that the configuration syntax I set is okay, and if not it will warn me to fix it. I then use the reload command to prevent any downtime (like if I had instead chosen to restart). 

**Location Blocks**

Next up is location context blocks, which defines and configures the behaviors of specific URIs or requests on your site. It's the most used context on Nginx configurations, so let's update our `nginx.conf` to also have it: 

```
events {}

http {

  include mime.types;

  server {

    listen 80;
    server_name 149.28.58.225;

    root /sites/demo;

    # prefix match
    location /greet {
      return 200 'Hello from url path greet!';
    }
  }
}
```

The above example is what's called a prefix match. It matches a request URI starting with `/greet`. So in other words, `/greeting` would also match. Or even another path (`/greet/me`), so literally anything starting with `/greet`.

To change this behavior, you would instead do a `=` sign to make it be an exact match

```
    # exact match
    location = /greet {
      return 200 'Hello from url path greet!';
    }
```
You can go even further and have it match regular expression paths, which is one of the main reasons that we installed the PCRE library earlier.

Using a `~` character as the match modifier:

```
    # regex match
    location ~ /greet[0-9] {
      return 200 'Hello from url path greet!';
    }
```

In this case, it will match a URI path that has the greet string followed by a number ranging from 0 to 9 (e.g. `/greet4`). Take note that this modifier is case sensitive. To make it NOT case sensitive add an `*` after the `~` (`location ~* /greet[0-9] { }`).

Nginx assigns a priority to these location match modifiers. With a regular expression being more important than a prefix match. The final modifier is what's called a preferential prefix:

```
    # preferential prefix match
    location ^~ /greet {
      return 200 'Hello from url path greet!';
    }
```

This is essentially the same as the basic prefix modifier, but is more important than a regular expression match in terms of priority.

**Nginx Variables**

Nginx syntax does resemble that of a high level language, implementing in some ways the concept of scope, includes, variables and conditionals. 

Variables exist in two forms for Nginx. The ones we set ourselves and those that Nginx has built in. You can find [those variables here](http://nginx.org/en/docs/varindex.html).

Variables that come from core and log are already built in to Nginx, so those don't require you to have installed Nginx with those modules defined in the configuration execution I sampled at the very beginning.

Here's an example set up, with variables prefixed by a `$` sign:

```
events {}

http {

  include mime.types;

  server {

    listen 80;
    server_name 149.28.58.225;

    root /sites/demo;

    location /inspect {
      return 200 '$host\n$uri\n$args';
    }
  }
}
```

This produces the following when setting the URI like so:  `http://149.28.58.225/inspect?name=juan`

Output on page:

```
149.28.58.225
/inspect
name=juan
```

You can also set conditionals within the context:

```
events {}

http {

  include mime.types;

  server {

    listen 80;
    server_name 149.28.58.225;

    root /sites/demo;

    # check static API key
    if ( $arg_apikey != 1234 ) {
      return 401 'Incorrect API Key';
    }

    location /inspect {
      return 200 'Name: $arg_name';
    }
  }
}
```

When you reload Nginx (`systemctl reload nginx`) with the newly set configurations, you will see the API error message. But if you change the URI to include it:

`http://149.28.58.225/?apikey=1234`

You will see that it loads up your site as expected.

To set your own variables, which can be strings, integers, or booleans, do the following:

```
events {}

http {

  include mime.types;

  server {

    listen 80;
    server_name 149.28.58.225;

    root /sites/demo;

    set $weekend 'No';

    # REGEX check matching day with Nginx built ISO date variable, to the string of days with a pipe (which refers to 'or')
    if ( $date_local ~ 'Saturday|Sunday' ) {
      set $weekend 'Yes';
    }

    location /is_weekend {
      return 200 'Value: $weekend';
    }
  }
}
```

I set the variable `$weekend` to default to `'No'`. But with the conditional check, it can also set it to equal `'Yes'` if it's true. Traditionally however, you should be wary of using if statements in Nginx configurations. Here's a [useful resource that goes into detail](https://www.nginx.com/resources/wiki/start/topics/depth/ifisevil/) about this.

**Rewrites & Redirects**

Now that we have an understanding of Nginx variables, we can move on to rewrites (pattern URI). For status returns, we can also use redirects (status URI), like for example obtaining an image path with an alias url, instead of an explicit one:

```
    # 307 does a temporary redirect
    location /logo {
      return 307 /thumb.png;
    }
```

Take note however, that since it's a temporary path, the URI converts to `149.28.58.225/thumb.png` after `149.28.58.225/logo` has been processed.

If we wanted to have a URI become mutable, then we'd use a rewrite instead of a redirect:

```
events {}

http {

  include mime.types;

  server {

    listen 80;
    server_name 149.28.58.225;

    root /sites/demo;
    
    rewrite ^/user/(\w+) /greet/$1 last;
    rewrite ^/greet/admin /thumb.png;

    location /greet {

      return 200 "Hello non admin user $1";
    }

    location = /greet/admin {
      return 200 "Hello admin user";
    }
  }
}
```

So there's a couple of things happening here. When a URI is rewritten, it also gets re-evaluated by Nginx as a completely new request. Meaning it will expend more system resources than a return would. But it doesn't convert the actual URI in the browser, since this change is done on the server, before it ever gets processed to the client.

There are two rewrites here. The first one stated that a path immediately followed by `user`, and then anything that has more than a one word character, will get encapsulated and transitioned into a new URI that starts with `greet`, and then outputs the first captured group `(\w+)` into the `$1` variable. This then becomes `149.28.58.225/greet/Juan`, and will go to the location path (`/greet`) outputting my name to the browser.

The `last` flag declares that the URI should not be rewritten anymore. So even though there's another rewrite below the first one, declaring to get to `/thumb.png`, it will ignore this and instead go to the exact match argmuent (`location = /greet/admin`).

**Try Files and Named Locations**

Another option that can be used are `try_files`. These can be inserted within the server context, or the location context. `try_files` allow Nginx to check for resources that it can respond to within any number of locations, relative to the root directory.

This means that when the URI for the root directory is requested, the try file will actually attempt to load the URI's listed instead. Parsing through one after the other if for some reason the prior URI on the list was not reachable. If it reaches its last argument however, it treats it as an internal rewrite (meaning it gets re-evaluated by Nginx as discussed earlier with rewrites).

Traditionally, `try_files` are paired with Nginx variables. For example, to first check that the initial URI exists, you can start the list with the Nginx `$uri` variable:

`try_files $uri /thumb.png /greet;`

If the `$uri` doesn't exist, and neither do any of the following resources, then the final argument on the list gets chosen (`/greet`). One more thing to mention that can also get paired with `try_files` are named locations.

A named location is simply a location you can define with the `@` character instead of matching it to a request. Meaning, that you can then re-use this name location on `try_files` and other directives.

It's simply a convenience method for not having to define the same location contexts multiple times. Here's a full visual of what has been discussed so far:

```
events {}

http {

  include mime.types;

  server {

    listen 80;
    server_name 149.28.58.225;

    root /sites/demo;

    # since root is /sites/demo, /greet will not output the location we set below, as this one is not relative to root directory
    # the final result will instead be the @error location
    try_files $uri /cat.png /greet @error;

    location @error {
      return 404 "Sorry, that path does not exist";
    }

    location /greet {
      return 200 "Hello User";
    }

  }
}
```

**Log Types**

Something to become aware of when cataloguing routed information, is making good use of error and access logs. Aside from setting their locations, as we did earlier when running the `./configure` command, you can also create access logs for specific routes:

```
events {}

http {

  include mime.types;

  server {

    listen 80;
    server_name 149.28.58.225;

    root /sites/demo;

    location /admin {

      # Add context specific log
      access_log /var/log/nginx/admin.access.log;

      # Disable logs for context
      #access_log off;

      return 200 "Welcome to secure area.";
    }

  }
}
```

The example above makes it so that when a user gets into the `/admin` URI route, it will log the connection to the `admin.access.log` file, which if not previously existing, will be created on the fly when routed. There is also the disabling of general access logs right below it, which is commented out, but can help to reduce saved data traffic to just the chosen log right above it; thus allowing you to prevent exceeded repetition of logged entries.

You can of course format even more complex logging configurations than the sample above, but for the sake of brevity, I'll [supply you with a learning resource](https://docs.nginx.com/nginx/admin-guide/monitoring/logging/) that goes more into this.

**Inheritance & Directive Types**

As you've most likely noticed by now, scope in terms of a typical programming language also works in the same way with Nginx. Where the context scope inherits configurations from its parent contexts. There is however some slight variations to inheritance with Nginx depending on the directive that is being used. These are *Standard Directive*, *Array Directive*, and *Action Directive*.

```
######################
# (1) Array Directive
######################
# Can be specified multiple times without overriding a previous setting
# Gets inherited by all child contexts
# Child context can override inheritance by re-declaring the directive

######################
# (2) Standard Directive
######################
# Can only be declared once. A second declaration overrides the first
# Gets inherited by all child contexts
# Child context can override the inheritance by re-declaring the directive

#######################
# (3) Action Directive
#######################
# Invokes an action such as a rewrite or redirect
# Inheritance does not apply as the request is either stopped (redirect/response) or re-evaluated (rewrite)

events {}

# (1) Array Directive example start
access_log /var/log/nginx/access.log;
access_log /var/log/nginx/custom.log.gz custom_format;
# (1) Array Directive example end

http {

  # Include statement - non directive
  include mime.types;

  server {
    listen 80;
    server_name site1.com;

    # Inherits access_log from parent context (1)
  }

  server {
    listen 80;
    server_name site2.com;

    # (2) Standard Directive start
    root /sites/site2;
    # (2) Standard Directive end

    # Completely overrides inheritance from (1)
    access_log off;

    location /images {

      # Uses root directive inherited from (2)
      try_files $uri /stock.png;
    }

    location /secret {
      # (3) Action Directive start
      return 403 "You do not have permission to view this.";
      # (3) Action Directive end
    }
  }
}
```

**Worker Processes**

When you enter `systemctl status nginx`, you see that there are within the `CGroup` key, some processes being run. The Nginx service, or software instance, is the `master process`. The `worker processes` that follow are spawned by the `master process`, which listens for and responds to client requests. The default amount of `worker processes` for nginx is set to one. We can change this with the following directive:

`worker_processes: 2;`

> ------Debugging tips (Ubuntu)
> 
> `ifconfig`
> 
> ^ checks ip addresses for your server
> 
> `tail -n 1 /var/log/nginx/error.log`
> 
> ^ will output the last line in the above mentioned file, good for debugging
> 
> `ps aux | grep nginx`
> 
> ^ Check which user the Nginx process is being used on, to see if it's permission errors, like a worker process not being assigned to anyone
> 
> You can resolve permissions by having the user set in the main context of the .conf file:
> 
> `user www-data;`
> 
> ^ this declares the user accessing the Nginx configuration paths as the above mentioned one
> 
> ------Debugging tips (Ubuntu)

`worker_processes` is set outside of any context blocks within your .conf file. Take note that spawning more workers doesn't necesarrily mean that it will convert to better performance. Since the processors are asynchronous, they already operate to the most that the hardware they are running on can do. What you want to do instead, is separate the worker logic to alternate cores, if the server you are running it on has more than one.

This command will tell you how many core processors your server has:

`nproc`

You can also run a more detailed command as well:

`lscpu`

A quick way to resolve this without having to check the number of processors on your machine is setting the worker generation to auto:

`worker_processes auto;`

This will result in spawning one worker for each CPU core. The next worker directive will actually be inside of a context block. Specifically the events context:

```
events {
  worker_connections 1024;
}
```

This sets the amount of connections that each worker process can accept. This again is something that we can't forcefully increase if the server's hardware can only handle so many open files at once. You can check what your server's limit is with the following command:

`ulimit -n`

A good little diagram to let you know how many connections your server is capable of handling at one time is:

`worker_processes X worker_connections = max amount of connections`

The last thing that you can change in relation to processes is the process id (`pid`) location. Within the actual .conf file, you can set it to another location from what you initially had configured on installation, without the need to rebuild nginx. Here's a full example of the currently discussed dependencies:

```
user www-data;

worker_processes auto;

events {
  worker_connections 1024;
}

http {

  include mime.types;

  server {

    listen 80;
    server_name 149.28.58.225;

    root /sites/demo;

    index index.html;

    location / {
      try_files $uri $uri/ =404;
    }

  }
}
```

**Buffers & Timeouts**

Moving along to another essential step for configuration is buffers and timeouts. whilst the configuring processes was fairly easy and measurable, as was shown in the section above, getting the right buffer sizes and time out settings is actually the complete opposite. Mainly because they aren't solely dependent on the server, but rather the requests to the server through the client.

A buffer, or process in this case, reads data into memory (RAM). If the RAM or buffer is too small, then it writes the rest to hard disk. When a site is being requested then through the [TCP](https://www.webopedia.com/TERM/T/TCP.html), the return will be a site page that is read from disk, and transferred into memory (buffering) which when completed, sends that back to the client from memory.

Timeouts, are pretty self explanatory, they represent a cut off time for a given request. If the process is not completed within the given timeframe, then it considers there to be some sort of issue present. Timeout will then suspend the client request from continuing with an endless stream of data to the server.

Below is an example of the various different settings that you can apply to both in your .conf file:

```
user www-data;

worker_processes auto;

events {
  worker_connections 1024;
}

http {

  include mime.types;

  # Buffer size for POST submissions
  client_body_buffer_size 10K;
  client_max_body_size 8m;

  # Buffer size for Headers
  client_header_buffer_size 1k;

  # Max time to receive client headers/body
  client_body_timeout 12;
  client_header_timeout 12;

  # Max time to keep a connection open for
  keepalive_timeout 15;

  # Max time for the client to accept/receive a response
  send_timeout 10;

  # Skip buffering for static files and read from disk instead which will save on resources
  sendfile on;

  # Optimise size of sendfile packets to the client
  # goes in unison with sendfile, and helps sites with large amounts of static resources
  # When set to on, Nginx will attempt to transmit the entire HTTP response headers in a single TCP packet
  tcp_nopush on;

  server {

    listen 80;
    server_name 149.28.58.225;

    root /sites/demo;

    index index.html;

    location / {
      try_files $uri $uri/ =404;
    }

  }
}
```

Each of them has a set standard size for what should be expected in terms of data per request type. While these may vary depending on what your site is doing in terms of actual data for the request, the numbers above are good starting points.

[Here is a link](http://nginx.org/en/docs/syntax.html) that will also display the extension types that Nginx accepts in configurations.

**Headers, Expires, and Compression**

Headers and expires, two subjects that are good to know about when installing web servers. For expires, they're essentially response headers telling the client or browser how long they can cache the response for. So for example if your site has an image, that particular image may not be altered that often. So it would then be considered a safe bet to have the client cache that image for a longer time. This prevents future requests for that particular image from being done, thus speeding up the response time.

With headers, they allow the client and the server to pass additional information with the request or the response. This combination can then be utilized to make configurations in the .conf file that get acknowledged with custom set parameters. Like the example below:

```
    location ~* \.(css|js|jpg|png)$ {
      access_log off;
      add_header Cache-Control public;
      add_header Pragma public;
      add_header Vary Accept-Encoding;
      expires 1M;
    }
```

`Cache-Control public` tells the receiving client that this resource or response can be cached in any way. `Pragma public` does the same thing, but is based off of older versions, so it's a way to associate legacy terms. The next one, `Vary Accept-Encoding`, is essentially saying the response can vary based on the value of the request header `Accept-Encoding`. The last one which is expires, sets it to be an expiration time of one month (`1M`).

(To check and see these headers being registerd on your site, in your terminal, first reload nginx so it picks up your changes (`systemctl reload nginx`), then do `curl -I 149.28.58.225/thumb.png` (with your own i.p. instead).

Another thing that can assist performance is compression. Meaning that when a client requests a resource, the client can indicate its ability to accept compressed data. So we can compress a response on the server, typically with `gzip`, reducing its file size. As a result it reduces the time taken for the client to receive that response. Which the client or browser in this case has the responsibility to decompress before rendering.

For this, we would have to have the gzip module installed. This is not an issue however, as Nginx core comes with that module already pre-installed. We then just need to set it:

```
user www-data;

worker_processes auto;

events {
  worker_connections 1024;
}

http {

  include mime.types;

  gzip on;
  gzip_comp_level 3;

  gzip_types text/css;
  gzip_types text/javascript;

  server {

    listen 80;
    server_name 149.28.58.225;

    root /sites/demo;

    index index.php index.html;

    location / {
      try_files $uri $uri/ =404;
    }

    location ~* \.(css|js|jpg|png)$ {
      access_log off;
      add_header Cache-Control public;
      add_header Pragma public;
      add_header Vary Accept-Encoding;
      expires 1M;
    }

  }
}
```

Remember that by having the gzip directives on the inner scope of the http context, all subsequent children will have the same rules adopted to them too. So first we enable gzip, then we set the compression level (`gzip_comp_level`); with a lower number resulting in larger files, but requiring less server resources, and a larger number being the opposite of that. You should take note that at compression levels above 5, the reduction in file size or response size becomes very minor (9 being the max). And finally, `gzip_types` are just the mime types that you would like compression to take place in.

You should be aware though, that compression will only take place if the client accepts the response type, which is where the check for `add_header Vary Accept-Encoding` comes in. Most clients however, do accept gzip compression. Here's an example display from the terminal:

```
curl -I -H "Accept-Encoding: gzip" 149.28.58.225/style.css
```

Output:

```
HTTP/1.1 200 OK
Server: nginx/1.15.10
Date: Mon, 01 Apr 2019 22:29:50 GMT
Content-Type: text/css
Last-Modified: Sat, 30 Mar 2019 17:51:48 GMT
Connection: keep-alive
ETag: W/"5c9facb4-3d4"
Expires: Wed, 01 May 2019 22:29:50 GMT
Cache-Control: max-age=2592000
Cache-Control: public
Pragma: public
Vary: Accept-Encoding
Content-Encoding: gzip
```

**Bonus Resources**

We've mixed a good amount of content by now, and I think it will surely make you a better user of Nginx now that the fundamentals have been taught. There is of course, always more to learn if you seek it. For that very reason, I have supplied you with some additional topics/resources that I believe are also relevant and important to know down the line. So here they are!

1. Enabling http2 for better data resource management is essential to browser speed nowadays, but in order to get there we need to set up an ssl certificate for your site! [Click here for resource]( https://www.nginx.com/blog/using-free-ssltls-certificates-from-lets-encrypt-with-nginx/)

2. Server pushing, with http2 enabled, can improve the way content is loaded by linking specific files to location directives: [Click here for resource](https://www.nginx.com/blog/nginx-1-13-9-http2-server-push/)

3. Rate limiting, a built in module to Nginx, allows the managing of incoming connections in order to improve security, reliability, and service based connections: [Click here for resource](https://www.nginx.com/blog/rate-limiting-nginx/)

4. Basic Authentication, a simple to set up but very handy option to add as an extra layer of account user security: [Click here for resource](https://docs.nginx.com/nginx/admin-guide/security-controls/configuring-http-basic-authentication/)

5. Reverse proxying, which allows an intermediary between a client and the resource itself. Useful for when you need to serve some additional logic from the back end service to the client: [Click here for resource](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)

6. Load balancing, a reliable way to audit user requested traffic from the client to the back end server: [Click here for resource](https://docs.nginx.com/nginx/admin-guide/load-balancer/http-load-balancer/)

7. And finally, drum roll please...... Common pitfalls to be aware of when working with Nginx! [Click here for resource](https://www.nginx.com/resources/wiki/start/topics/tutorials/config_pitfalls/)

8. Cough, cough... actually one more thing for those who still need more learning, a tailored repo to advanced Nginx learning! [Click here for resource](https://github.com/fcambus/nginx-resources)

Alright well that's enough. I hope that all of this content has given you more confidence to tackle server side challenges. I know that it has for me, and I will certainly appreciate using Nginx more now that I understand it!

Thanks for reading,

~ Juan
