var fs = require('fs');
var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();
var request = require('request');
//Auslesen der Things-Liste
var obj = JSON.parse(fs.readFileSync('/srv/openhab2-userdata/jsondb/org.eclipse.smarthome.core.thing.Thing.json'));
console.log("Data send");
var device = [];
var un = JSON.stringify(obj);
var username = un.substring(un.search("username")+11,un.indexOf("\"", un.indexOf("username")+2));
device.push(username);
//Liste an den Server übertragen (jedes Element einzeln)
Object.keys(obj).forEach(function(doc,err){
        device.push(doc);
});
device.forEach(function(doc,err){
        request.put('http://192.168.1.54:3001/data',{form:{doc}}, function(error, response, body){

        });
});

//Server beendet sich nach der Übertragung
/*Zugriff über ssh openhabian@IP-Adresse oder IP-Adresse:8080 (Weboberfläche)*/
