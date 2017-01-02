var restify = require('restify');
var builder = require('botbuilder');
var keywords = require('./keywords');
var careinstr = require('./careinstructions');

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
    'https://api.projectoxford.ai/luis/v2.0/apps/8a2d9c33-8d37-4dc0-8c79-6226d194a55e?subscription-key=000203ecdc4d490a81afdfe8c6adec96&verbose=true';

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
            session.endDialog("Sorry, not too sure what you're trying to say.");
        }
    }
]);

bot.dialog('/sayHi', [
    function (session, args, next){
        session.send("Hey, nice to meet you :) I'm Laundrobot and I help with your laundry needs.");
        session.sendTyping();
        session.send("If you don't separate your clothes out, or use the proper type and amount of detergent, you may be damaging your clothes. Worse still, they may look clean but not actually be clean.");
        session.sendTyping();
        session.send("The laundry quiz is where we go through your current laundry habits and I'll see how it can be improved. I highly recommend you take this beforehand. Otherwise, let's start doing your laundry!");
        session.beginDialog('/menu');
    }
]);

bot.dialog('/howtocare', [
    function (session,args,next){
        console.log(args);
        if (args.entities.length < 1 || args.entities[0].type !== 'clothing::material'){
            builder.Prompts.text(session, "What material do you want to wash? (say quit to exit)");
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
                    .subtitle("What would you like to do next?")
                    .images([
                        //Using this image: http://imgur.com/a/vl59A
                        builder.CardImage.create(session, "https://d13yacurqjgara.cloudfront.net/users/97445/screenshots/1374460/washing-machine-flat-icon.png")
                    ])
                    .buttons([
                        builder.CardAction.dialogAction(session, "checkweather", null, "Start doing laundry"),
                        builder.CardAction.dialogAction(session, "quiz", null, "Take laundry quiz")
                    ])
            ]);
        session.endDialog(msg);
    }
]);

// These "link" the menu buttons to the dialogs
bot.beginDialogAction("checkweather", "/checkweather");
bot.beginDialogAction("quiz", "/quiz");

bot.dialog('/checkweather', [
    function (session, args, next) {
        // Add API call to weather
        
        session.endDialog("I just checked the weather forecast and it looks like it's going to be raining an hour from now. The next best time to do it is tomorrow at 11am if you want to dry your clothes outside.");
    }
]);

// bot.dialog('/doLaundry', [
//     function (session, args, next){
//         session.send("To start off, if you've got anything that's got hard stains, do a pre removal of these first. Use a stain remover like these ones:");
//         msg = new builder.Message(session)
//             .attachments([
//                 new builder.HeroCard(session)
//                     .title("Tide® to Go Instant Stain Remover")
//                     .subtitle("Eliminate some of your toughest fresh food and drink stains on the go.")
//                     .images([
//                         //Using this image: http://imgur.com/a/vl59A
//                         builder.CardImage.create(session, "http://istudio.pgpro.com/di/prod/1E7853C4-7481-43A7-9D3D-04FF3C8E5CBC/s/320x209/jq/90/o/th.jpg")
//                     ])
//                     .buttons([
//                         builder.CardAction.openUrl(session, "http://pgpro.com/brands/tide/tide-to-go-instant-stain-remover/", "Buy online")
//                     ]),
//                 new builder.HeroCard(session)
//                     .title("Tide® OXI Multi-Purpose Stain Remover")
//                     .subtitle("Removes tough stains, with over 225 different stain removal uses including carpet, grout, tile, in the wash and more.")
//                     .images([
//                         //Using this image: http://imgur.com/a/vl59A
//                         builder.CardImage.create(session, "http://istudio.pgpro.com/di/prod/fa79a1fe-ea8a-4c01-a777-72a73bce717b/s/320x209/jq/90/o/th.jpg")
//                     ])
//                     .buttons([
//                         builder.CardAction.openUrl(session, "http://pgpro.com/brands/tide/tide-oxi-multi-purpose-stain-remover/", "Buy online")
//                     ])
//             ])
//             .attachmentLayout(builder.AttachmentLayout.carousel);
//         session.send(msg);
//         builder.Prompts.choice(session, "", "Next|Quit");
//     }, function (session, results, next){
//         session.send("Let's separate your clothes for washing. Some things shouldn't be washed together.");
//         session.send("I recommend the following separation: Jeans, coloured clothes, white clothes, baby clothes, delicates.");
//         //use luis to detect
//         session.send("Just tap next when you're done.");
//         //Where do baby clothes go?
//         builder.Prompts.choice(session, "", "Next|Quit");
//     }, function (session,results,next){
//         if (results.response && results.response.entity !== 'Quit') {
//             builder.Prompts.text(session, "So how did you end up doing your separation? Please separate your categories with commas.");
//         } else {
//             session.endDialog("Ok.");
//         }
//     }, function (session,results,next){
//         session.beginDialog('/productrec');
//     }
// ]);

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

// bot.dialog('/amount', [
//     function (session,args,next){
//         session.send("Do make sure you read the instructions on the box as to how much detergent to use. Too much can mean damaged clothes, and too little can mean dirty clothes.");
//         session.send("Also remember to read the tag on the clothes to see how they should be washed.");
//         builder.Prompts.choice(session,"", "Next|Quit");
//     }, function (session,results,next){
//         if (results.response && results.response.entity !== 'Quit') {
//             session.beginDialog('/setTimer');
//         } else {
//             session.endDialog("Ok.");
//         }
//     }
// ]);

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