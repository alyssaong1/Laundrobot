var restify = require('restify');
var builder = require('botbuilder');
var keywords = require('./keywords');
var careinstr = require('./careinstructions');
var rp = require('request-promise');
const DarkSky = require('dark-sky');
const forecast = new DarkSky('850aa0e4eb50e64d2ff8975f86534805');

// Azure SQL connector
var Connection = require('tedious').Connection;
var Request = require('tedious').Request;  
var TYPES = require('tedious').TYPES;
var config = {
    userName: 'YOUR SQL DB USERNAME',
    password: 'YOUR SQL DB PASSWORD',
    server: 'YOUR SQL DB SERVER URL',
    // When you connect to Azure SQL Database, you need these next options.
    options: {encrypt: true, database: 'YOUR SQL DB NAME'}
};

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

//=========================================================
// Bots Dialogs
//=========================================================
// You can provide your own model by specifing the 'LUIS_MODEL_URL' environment variable

// This Url can be obtained by uploading or creating your model from the LUIS portal: https://www.luis.ai/

const LuisModelUrl = process.env.LUIS_MODEL_URL ||
    'your LUIS model url';

// Main dialog with LUIS
var recognizer = new builder.LuisRecognizer(LuisModelUrl);

var intents = new builder.IntentDialog({ recognizers: [recognizer] });
bot.dialog('/', intents);

intents.matches(keywords.hi, '/sayHi')
    .matches(keywords.menu, '/menu')
    .matches('howtocare', '/howtocare')
    .matches('checkweather', '/checkweather')
    .matches('recommend', '/productRec')
    .matches('whatabout', '/whatabout')
    .matches('startwashing', '/menu')
    .matches('didwashing', '/didwashing')
    .matches('separation', '/separatelaundry')
    .onDefault(builder.DialogAction.send("Hmm I'm not too sure what you're trying to say. Type 'help' to see what I can do."));

bot.dialog('/whatabout', [
    function (session,args,next){
        var questioncontext = session.privateConversationData.questioncontext;
        if (args.entities.length > 0){
            if (questioncontext === 'howtocare'){
                session.beginDialog('/howtocare', args);
            } else if (questioncontext === 'productRec'){
                session.beginDialog('/productRec', args);
            }
        } else {
            session.endDialog("I've got nothing else.");
        }
    }
]);

bot.dialog('/sayHi', [
    function (session, args, next){
        session.send("Hey, nice to meet you :) I'm Laundrobot and I help with your laundry needs.");
        // session.sendTyping();
        // session.send("If you don't separate your clothes out, or use the proper type and amount of detergent, you may be damaging your clothes. Worse still, they may look clean but not actually be clean.");
        session.beginDialog('/menu');
    }
]);

bot.dialog('/howtocare', [
    function (session,args,next){
        console.log(args);
        if (args.entities.length < 1 || args.entities[0].type !== 'clothing::material'){
            builder.Prompts.text(session, "What material is the clothing? (say quit to exit)");
        } else {
            next({response: args.entities[0].entity});
        }
        console.log(args);
    }, function (session,results,next){
        // 1.Check if we have instructions for that material
        // 2.Give instructions
        if (results.response && results.response !== 'quit'){
            var res;
            if (results.response.entity){
                res = results.response.entity.toLowerCase();
            } else {
                res = results.response.toLowerCase();
            }
            if (careinstr[res]){
                session.send("Care instructions for " + res + ":");
                session.send(careinstr[res].text);
            } else {
                session.endDialog("Sorry I don't have washing instructions for that material.");
            }
        } else {
            session.endDialog("Ok");
        }
        session.privateConversationData.questioncontext = 'howtocare';
        session.privateConversationData.material = res;
        var msg = new builder.Message(session)
            .attachments([
                new builder.HeroCard(session)
                    .title("Would you like detergent recommendations?")
                    .subtitle("")
                    .images([
                        //Using this image: http://imgur.com/a/vl59A
                        builder.CardImage.create(session, "https://d13yacurqjgara.cloudfront.net/users/97445/screenshots/1374460/washing-machine-flat-icon.png")
                    ])
                    .buttons([
                        builder.CardAction.dialogAction(session, "productrec", null, "Yep"),
                        builder.CardAction.dialogAction(session, "", null, "Not for now"),
                        builder.CardAction.dialogAction(session, "", null, "No & don't ask again")
                    ])
            ]);
        session.endDialog(msg);
    }
]);

bot.dialog('/menu', [
    function (session, args, next) {
        //send card message menu
        msg = new builder.Message(session)
            .attachments([
                new builder.HeroCard(session)
                    .title("Main Menu")
                    .subtitle("What would you like find out about?")
                    .images([
                        //Using this image: http://imgur.com/a/vl59A
                        builder.CardImage.create(session, "https://d13yacurqjgara.cloudfront.net/users/97445/screenshots/1374460/washing-machine-flat-icon.png")
                    ])
                    .buttons([
                        builder.CardAction.dialogAction(session, "checkweather", null, "Check weather"),
                        builder.CardAction.dialogAction(session, "howtocare", null, "Care instructions"),
                        builder.CardAction.dialogAction(session, "separatelaundry", null, "Laundry separation")
                    ])
            ]);
        session.endDialog(msg);
    }
]);

// These "link" the menu buttons to the dialogs
bot.beginDialogAction("howtocare", '/howtocare');
bot.beginDialogAction("checkweather", "/checkweather");
bot.beginDialogAction("quiz", "/quiz");
bot.beginDialogAction("separatelaundry", '/separatelaundry')

bot.dialog('/separatelaundry', [
    function (session,args,next){
        session.send("I recommend the following separation: Jeans, coloured clothes, white clothes, baby clothes, wool, delicates.");
        session.endDialog("But you should also read the tag on each of the clothing and separate as appropriate.");
    }
]);

bot.dialog('/checkweather', [
    function (session, args, next) {
        // Add API call to weather
        forecast
            .latitude('1.3521')            // set to singapore
            .longitude('103.8198')          
            .units('ca')                    
            .language('en')                 
            .exclude('currently,minutely,daily,alerts,flags')     
            .get()                        
            .then(res => {              
                //successful request
                session.send("Weather forecast: " + res.hourly.summary);
                if (res.hourly.icon === "rain"){
                    session.endDialog("I don't suggest you wash your clothes today unless you have a dryer.");
                } else if (res.hourly.icon === "clear-day" || res.hourly.icon=== "partly-cloudy-day" || res.hourly.icon === "wind"){
                    session.endDialog("It should be all good for you to do your laundry today.");
                } else if (res.hourly.icon === "cloudy"){
                    session.endDialog("Hmm... your clothes may take a while to dry outside. I'd probably pick another day to do laundry if I were you.");
                } else {
                    session.endDialog("I'd probably pick another day to do laundry if I were you.");
                }
            })
            .catch(err => {               
                console.log(err)
            });
    }
]);


bot.beginDialogAction("productrec", "/productRec");

bot.dialog('/productRec', [
    function (session,args,next){
        // TODO: pass on the entity if there is one e.g. cotton
        var cards = [];
        console.log(args);
        session.privateConversationData.questioncontext = 'productRec';
        if (args.entities){
            if (args.entities.length > 0){
                var type = args.entities[0].entity;
                switch (type){
                    case 'baby':
                        session.send("For baby clothes I recommend this:");
                        cards.push(careinstr.baby.rec(session));
                        break;
                    case 'color':
                    case 'colourful':
                    case 'colorful':
                    case 'colour':
                        session.send("For colourful clothes I recommend this:");
                        cards.push(careinstr.colourful.rec(session));
                        break;
                    case 'white':
                    case 'whites':
                        session.send("For white clothes I recommend this: ");
                        cards.push(careinstr.whites.rec(session));
                        break;
                    case 'linen':
                        session.send("I highly recommend you dry clean linen.");
                        break;
                    case 'stain':
                    case 'stains':
                        session.send("For hard to remove stains you can use this:");
                        cards.push(careinstr.stains.rec(session));
                        break;
                    default:
                        session.send("For " + type + " I recommend the following: ");
                        cards.push(careinstr.whites.rec(session));
                        cards.push(careinstr.colourful.rec(session));
                        cards.push(careinstr.baby.rec(session));
                        break;
                }
            }
            // Need to check for if entity is not clothing type
        } else {
            if (session.privateConversationData.material){
                session.send("For " + session.privateConversationData.material + ", I recommend these:");
            } else {
                session.send("I recommend the following detergents for your clothes: ");
            }
            cards.push(careinstr.whites.rec(session));
            cards.push(careinstr.colourful.rec(session));
            cards.push(careinstr.baby.rec(session));            
        }
        var msg = new builder.Message(session)
                .attachments(cards)
                .attachmentLayout(builder.AttachmentLayout.carousel);
        session.endDialog(msg);
    }
]);

bot.beginDialogAction("whybaby", "/whyBabyPowder");

bot.dialog('/whyBabyPowder', [
    function (session,args,next){
        session.endDialog(careinstr.baby.why);
    }
]);
bot.dialog('/setTimer', [
    function (session,args,next){
        builder.Prompts.choice(session, "Want me to set a timer for your laundry?", "Yes|No");
    }, function (session,results,next){
        if (results.response && results.response.entity !== 'No') {
            builder.Prompts.text("How long should I set the timer for?");
        } else {
            session.endDialog("Ok I won't do it.");
        }
    }, function (session,results,next){
        session.endDialog("Cool, I will ping you when it's time to take out your laundry.");
    }
]);

bot.dialog('/didwashing', [
    function (session,args,next){
        if (args.entities.length < 1){
            builder.Prompts.choice(session, "Did you do a cold, warm or hot cycle?", "Cold|Warm|Hot|quit");
        } else {
            next({response: args.entities[0].entity});
        }
    }, function (session,results){
        if (results.response && results.response !== 'quit'){
            var temp;
            if (results.response.entity){
                temp = results.response.entity.toLowerCase();
            } else {
                temp = results.response.toLowerCase();
            }
            var connection = new Connection(config);
            connection.on('connect', function(err) {
                if (err) {
                    console.log(err); // replace with your code
                    session.endDialog("Uh oh something went wrong.");
                    return;
                };
                console.log("hello");
                // If no error, then good to proceed.
                var request = new Request("INSERT dbo.laundrydata (Date, Temp, Type, Cups) OUTPUT INSERTED.Id VALUES (CURRENT_TIMESTAMP, @Temp, @Type, @Cups);", function(err) {  
                if (err) {  
                    console.log(err);}  
                });  
                request.addParameter('Temp', TYPES.NVarChar,temp);  
                request.addParameter('Type', TYPES.NVarChar, null);
                request.addParameter('Cups', TYPES.NVarChar, null);      
                connection.execSql(request);
                session.endDialog("Got it. You can check your updated dashboard in 15 mins time.");
            });
        } else {
            session.endDialog("Ok");
        }
        // session.endDialog("Got it. Visit your dashboard for updated analytics.");
    }
]);

 function insertWashing(connection,temp){  
        var request = new Request("INSERT dbo.laundrydata (Date, Temp, Type, Cups) OUTPUT INSERTED.Id VALUES (CURRENT_TIMESTAMP, @Temp, @Type, @Cups);", function(err) {  
         if (err) {  
            console.log(err);}  
        });  
        request.addParameter('Temp', TYPES.NVarChar,temp);  
        request.addParameter('Type', TYPES.NVarChar, null);
        request.addParameter('Cups', TYPES.NVarChar, null);      
        connection.execSql(request);
}

//Not used, but to send to streaming dataset
function sendToPowerBI(cb) {  
    var connection = new Connection(config);
     connection.on('connect', function(err) {
         console.log("connected");
                if (err) {
                    console.log(err); // replace with your code
                    session.endDialog("Uh oh something went wrong.");
                    return;
                };
            var request = new Request("SELECT * FROM dbo.laundrydata;", function(err) {  
            if (err) {  
                console.log(err);}  
            });  
            var result = "";  

    var resultObj = [];

    request.on('doneInProc', function (rowCount, more, rows) {  
        console.log(rows);
        console.log(rowCount);
        rows.forEach(function (element){
                //process columns
                var rowObj = {
                    "Id": element[0].value,
                    "Date": element[1].value,
                    "Temp": ""+element[2].value,
                    "Type": element[3].value,
                    "Cups": element[4].value,
                    "Month": element[5].value
                }
                resultObj.push(rowObj);
        });
        var url = "YOUR POWER BI URL";
            //Options for the request
            var options = {
                uri: url,
                method: 'post',
                headers: {
                    'Content-Type': 'application/json'
                },
                json: true,
                body: resultObj
            }
            //Make the request
            rp(options).then(function (body){
                console.log(body);
            }).catch(function (err){
                console.log(err.message);
            }).finally(function () {
                cb(); 
            });
    });  
            connection.execSql(request);
        });
} 