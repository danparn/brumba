brumba
======

Brumba is a desktop-like Web applications builder with Node.js and MongoDb on server.
Dual licensed under the MIT and GPL licenses.

The goal is to encapsulate the most of the difficulties of the chain browser/communication/nodejs/mongodb and let you concentrate on:
- design your forms/pages/reports with facilitated approach (designer task)
- simplified query sintax {coll, fields, where, sort } mostly for records list, other retrieve/search/save/delete operations are implicit
- write events (minimal jQuery)
- eventually write server scripts (nodejs module reduced to minimal javascript with very simple API for database access: get/cursor, post, del, file)

The application is saved entierly in a database with the same name. You can use a development site and then copy the 
modified application database on the server, or just copy the modified component from IDE with _Copy to App_ 
option. But you can even open IDE on the deployment site and make corrections on the fly, if necessary.

Take a look at this first minimal [DEMO application](http://81.196.2.213:8080/). Login:
* Application: demo
* Database: demodb
* User: demo
* Password: demo

Then open the [IDE](https://81.196.2.213:8080/ide.html) and see it's structure. Write _demo_ in the field and _Load App_ button.

Here is a brief [IDE HowTo](https://81.196.2.213:8080/howto.html).
Try it [online](https://81.196.2.213:8080/) with application: **tryme** database: **trydb** (a copy of demo). Feel free to add/modify it.

For the moment the only browser I'm using is Firefox. There are some minor problems with Chrome. I didn't test the others.

### Installation
- node.js and mongodb must be installed and running
- download brumba
- from the brumba directory install dependences **npm install mongodb connect cheerio pdfkit**
- from the brumba directory call the short command **node server** 
  it will default to brumba webserver port 8080 and mongodb localhost:27017
- to change defaults: **node server webserverport mongohost:mongoport**
- open Brunba IDE in the browser http://localhost:8080/ide.html, write _yourApp_ name in the field, then create forms/pages/reports/menu
- open application  http://localhost:8080 and login:
  * Application: yourApp
  * Database: yourDb
  * User: demo          (users non yet implemented use demo)
  * Password: demo      (or just d and Enter, users/groups/permissions not yet implemented)
- _yourApp_ and _yourDb_ databases will be created at the first _Save_

### Support
[Brumba Google Group](https://groups.google.com/forum/?fromgroups#!forum/brumba) - For support and suggestions

### To do
Ver1.0:
- [x] Events: saved on form
- [x] Server scripts: application server scripts
- [x] List and tabular: cursor driven
- [x] Users/Groups/Permissions: r/w/d on menu entries, user will see only entries with read permission
- [x] Search: search on all form fields
- [x] Form/select/autocomplete: data from server script
- [x] Reports: PDF generated on server
- [x] Https
- [x] Multilaguage
- [ ] Export selected data in Excel format

Ver2.0:
- [ ] Form/select/autocomplete: data from other then the main database
- [ ] Design: easy customization of the application look (menu, toolbar, list)
- [ ] Customized application: extend a main (standard) application without duplicating it
- [ ] SQL database access: pages with mixed SQL/MongoDb forms/select to extend existing SQL applications
- [ ] Modular organization for large applications, search facility
- [ ] Team development: lock component by user
- [ ] Embedded component to insert in any web page
