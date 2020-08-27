brumba
======

Brumba is a Web applications builder with *Node.js* and *MongoDb* on server.
Vanilla *javascript*, [*Bulma*](https://bulma.io/) UI, and *[Inferno](https://infernojs.org/)* on client.
ESM modules on both sides.
Licensed under the MIT license.

The goal is to encapsulate the most of the difficulties of the chain browser/communication/nodejs/mongodb and let you concentrate on:
- design your forms/pages/reports with facilitated approach
- simplified query syntax {coll, fields, where, sort } mostly for records list, other retrieve/search/save/delete operations are implicit
- form specific events and CSS
- server scripts
- very simple database API: get/cursor, post, del, file)

The application is saved entirely in a database with the same name. 

Take a look at this minimal [DEMO application](https://95.110.198.62:3000). Login:
* Application: brdemo
* Database: brdb
* User: admin
* Password: brumba

Then open the [IDE](https://95.110.198.62:3000/ide) and see it's structure.

A brief IDE howto.html in the doc folder and [online here](https://95.110.198.62:3000/doc/howto.html).

More detailed **documentation** in the **doc** folder and [online here](https://95.110.198.62:3000/doc).


### Installation
- node.js (min ver.13) and mongodb (ver.4) must be installed and running

- download brumba

  ​		**git clone https://github.com/danparn/brumba.git**

- move to brumba directory 

- install dependences: 

  ​		**npm install**

- generate SSL key and auto certificate

  ​		**openssl genrsa -out brumba.key 2048**

  ​		**openssl req -new -key brumba.key -out brumba.csr**

  ​		**openssl x509 -req -in brumba.csr -signkey brumba.key -out brumba.cert**

- start the server: 

  ​		**node server webserverport mongohost:mongoport**

  the short command **node server** will default to:  brumba server 3000 localhost:27017

- create application and database:

  ​		**node new app yourapp**

  ​		**node new db yourdb**

- open Brunba IDE in the browser https://localhost:3000/ide and login:

  - Application: yourapp
  - User: admin
  - Password: brumba

- create forms/pages/reports/menu

- open application  https://localhost:3000 and login:
  * Application: yourapp
  * Database: yourab
  * User: admin
  * Password: brumba
  
- create users and permissions

- remember to change admin's default password

- enjoy

- to manage application's users (for IDE access) login as:

  - Application: yourapp
  - Database: yourapp

### Support
[Brumba Google Group](https://groups.google.com/forum/?fromgroups#!forum/brumba-1) - For support and suggestions

