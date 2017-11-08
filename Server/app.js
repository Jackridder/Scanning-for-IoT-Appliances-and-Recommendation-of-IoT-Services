var app = require('express')();
var express = require('express');
var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();
var mongo = require('mongodb').MongoClient;
var server = require('http').Server(app);
var io = require('socket.io')(server);
var request = require('request');

var url = 'mongodb://localhost:27017/pp';
var currentUser = "";
var clientSockets = [];

server.listen(3001, function(){
  console.log("Server running on 3001");
});

app.use(express.static('views'));
app.get('/', function(req,res){
  res.render('index');
});

io.on('connection',function(socket){
  clientSockets.push(socket);
  console.log("IO: Socket verbunden");
  socket.on('username', function (data){
    console.log(data.username);
    if(data.username != "" ){
        currentUser = data.username;
        mongo.connect(url, function(err,db){
          if(err){
            console.log("Fehler: ");
            console.log(err);
          }
          else{
            var resultArray = [];
            var cursor = db.collection('deviceList').find();
            cursor.forEach(function(doc,err){
              if(err){
                console.log("MongoDB kann auf user nicht zugreifen");
                console.log(err);
              }
              else{
                resultArray.push(doc);
              }
            }, function() {
              db.close();
              socket.emit('getUN',{resultArray});
            });
          }
        });
    }
  });
});


app.put('/data', function(req,res){
  console.log("Zugriff");
  var device = req.body.doc;
  console.log(req.body);
  //Object.keys nochmal für unter Objekte
  mongo.connect(url, function(err,db){
    if(err){
      console.log("Fehler: ");
      console.log(err);
    }
    else{
      var string = device.toUpperCase();
        if(string.search(":") > 0){
          var n = string.search(":");
          if(string.indexOf(":",n+1) > 0){
            if(string.indexOf("API") <=0){
              if(string.indexOf("BRIDGE") <= 0){
                var dl = {
                  productname: string.substring(0,n),
                  specification: string.substring(n+1,string.indexOf(":",n+1)),
                  username: currentuser
                }
                db.collection('deviceList').replaceOne({$and:[{username:{$eq: dl.username}},{productname:{$eq: dl.productname}},{specification:{$eq: dl.specification}}]},dl,{upsert: true});
                console.log("Inserted Items");
                db.close();
              }
            }
          }
        }
        else{
          currentuser = device;
        }
      }
  });
});

app.get('/testDaten', function(req,res){
  console.log("------------------------------------------");
  /*
  Liste mit Binärwerten für die Generierung von zufälligen Testdaten,
  mit math.Random; Bsp.: 7 = 1+2+4 = Hue+Netatmo+Doorbell,
  Username: Automatisch generierte Mail bsp.: 1@test.de increment.

  1:  Philips Hue         Bin.: 000001
  2:  Netatmo             Bin.: 000010
  4:  Doorbell            Bin.: 000100
  8:  Alexa               Bin.: 001000
  16: Staubsaugerroboter  Bin.: 010000
  32: Smart TV            Bin.: 100000
  */
//Zufallszahl generieren für zufällige Geräteliste pro User
  var devices = [
    {number: 1,  device: "Philips Hue"},
    {number: 2,  device: "Netatmo"},
    {number: 4,  device: "Doorbell"},
    {number: 8,  device: "Alexa"},
    {number: 16, device: "Staubsaugerroboter"},
    {number: 32, device: "Smart TV"}
  ];
  var iVal = 0;
  var deviceList = [];
//Min. 1000 Einträge erstellen und Zufallszahl generieren
  for(var i = 1; i<=100; i++){
    iVal = i;
    var randomDeviceList = getRandomInt(1,63);
    //Werte der Liste Devices von große nach klein iterieren
    // und passenden Wert suchen um Gerät zu ermitteln
    //Subtrahieren und nächsten Eintrag suchen
    for(var j=devices.length-1; j>= 0; j--) {
      //console.log("In J Schleife");
      if(randomDeviceList >= devices[j].number) {
        randomDeviceList = randomDeviceList - devices[j].number;
        //Objekt mit Gerät/-espezifikation und User für DB
        var dl = {
          productname: devices[j].device,
          username: i+"@test.de",
          specification: "placeholder"
        };
        deviceList.push(dl);
        //Geräte gefunden: Abbruch
        //console.log(dl);
        if(randomDeviceList == 0) {break;}
      }
      //Überspringen von Einträgen bei randomDeviceList < devices.number
      else if(randomDeviceList > 0){

      }
      //Diese Schleife ebenfalls verlassen
      else if (randomDeviceList == 0) {break;}
      else{
        console.log("Error: RandomDeviceList fehlerhaft!");
        //return new Error("Error: RandomDeviceList fehlerhaft!")
        break;
      }
    }
    if(iVal == 10){
      mongo.connect(url,function(err,db){
          if(err){
            console.log("Fehler: ");
            console.log(err);
          }
          else{
            deviceList.forEach(function(doc,err){
              db.collection('deviceList').replaceOne({$and:[{username:{$eq: doc.username}},{productname:{$eq: doc.productname}},{specification:{$eq: doc.specification}}]},doc,{upsert: true});
              console.log("Inserted Items");
            });
            db.close();
          }
      });
    }
  }
});

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

/* OLD
app.put('/data', function(req,res){
  console.log("Zugriff");
  //console.log("body: " + req.body.obj);
  //var obj = JSON.parse(req.body);


  console.log(req.body.doc);
  var device = [];
  //Object.keys nochmal für unter Objekte
  Object.keys(obj).forEach(function(doc,err){
    device.push(doc);
  });

  //console.log(device);
  var deviceList = [];

  //username search:
  var username = JSON.stringify(req.body.obj);
  var un = username.substring(username.search("username")+14,username.indexOf("\"",username.indexOf("username")+15)-1);
  //deviceList.username = un;
  mongo.connect(url, function(err,db){
    if(err){
      console.log("Fehler: ");
      console.log(err);
    }
    else{
      device.forEach(function(doc, err){
        var string = doc.toUpperCase();
        if(string.search(":") > 0){
          var n = string.search(":");
          if(string.indexOf(":",n+1) > 0){
            var dl = {
              productname: string.substring(0,n),
              specification: string.substring(n+1,string.indexOf(":",n+1)),
              username: un
            }
            deviceList.push(dl);
          }
        }
      });
      if(deviceList.length > 0){
        db.collection('deviceList').insert(deviceList);
        console.log("Inserted Items");
        db.close();
      }
    }
  });
});

var cursor = db.collection('userRatings').find();
      cursor.forEach(function(doc,err){
        if(err){
          console.log("MongoDB kann auf userRatings nicht zugreifen");
          console.log(err);
        }
        else{
          checkKeywords(doc);
        }
      }, function() {
          db.close();
      });


*/
