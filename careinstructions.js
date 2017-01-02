var builder = require('botbuilder');
module.exports = {
    "cotton": {
        "text":"\n* Machine wash warm/normal cycle.\n* Wash dark colours separately.\n* Use only non-chlorine bleach when needed.\n* Remove promptly from washer.\n* Tumble dry low, remove promptly.",
        "rec": {

        }
    },
    "silk": {
        "text":"\n* Dry clean for best results OR hand wash cold. \n* Wash dark colours separately. \n* Do not bleach. \n* Line dry.",
        "rec":{

        }
    },
    "denim": {
        "text": "\n* Wash indigo separately for first wash. \n* Machine wash warm. \n* Use only non-chlorine bleach when needed. \n* Tumble dry low, remove promptly.",
        "rec":{
            
        }
    },
    "corduroy": {
        "text": "\n* Turn inside out. \n* Machine wash warm/normal cycle. \n* Wash dark colours separately. \n* Use only non-chlorine bleach when needed. \n* Remove promptly from washer. \n* Tumble dry low, remove promptly.",
        "rec": {

        }
    },
    "linen": {
        "text":"Dry clean is highly advised.",
        "rec": {

        }
    },
    "baby": {
        "why": "Dreft is the #1 dermatologist recommended baby detergent brand for use on baby clothes and the #1 brand of baby detergent used by dermatologists on baby clothes in their own home. It's also the best selling baby detergent among moms and can be used in both standard and high efficiency washing machines.",
        "rec": function (session) {
            return new builder.HeroCard(session)
                        .title("For baby clothes:")
                        .subtitle("Dreft® Baby Powder Detergent provides a gentle clean for baby's clothes.")
                        .images([
                            //Using this image: http://imgur.com/a/vl59A
                            builder.CardImage.create(session, "http://istudio.pgpro.com/di/prod/C6B0E9C1-3DC1-4BA0-913A-D49A8FD15AEF/s/320x209/jq/90/o/th.jpg")
                        ])
                        .buttons([
                            builder.CardAction.dialogAction(session, "whybaby", null, "Why Dreft?"),
                            builder.CardAction.openUrl(session, "http://pgpro.com/brands/dreft/dreft-powder-laundry-detergent/", "Buy online")
                        ]);
        }
    },
    "colourful": {
        "rec": function (session){
            return new builder.HeroCard(session)
                        .title("For colourful clothes: ")
                        .subtitle("Cheer® Stay Colorful Powder Detergent is made for colorful clothes.")
                        .images([
                            builder.CardImage.create(session, "http://istudio.pgpro.com/di/brand/cheer/s/119x115/jq/90/o/th.jpg")
                        ])
                        .buttons([
                            builder.CardAction.openUrl(session, "http://pgpro.com/brands/cheer/cheer-stay-colorful-powder-laundry-detergent/", "Buy online")
                        ]);
        }
    },
    "whites": {
        "rec": function (session){
            return new builder.HeroCard(session)
                        .title("For white clothes: ")
                        .subtitle("Tide plus Bleach uses non-chlorine bleach to keep whites white and colors bright.")
                        .images([
                            builder.CardImage.create(session, "http://istudio.pgpro.com/di/prod/F7600A94-4A6F-4368-9CFF-29C8E6D28138/s/320x209/jq/90/o/th.jpg")
                        ])
                        .buttons([
                            builder.CardAction.openUrl(session, "http://pgpro.com/brands/tide/tide-plus-bleach-powder-laundry-detergent/", "Buy online")
                        ]);
        }
    },
    "stains": {
        "rec": function (session){
            return new builder.HeroCard(session)
                    .title("Tide® to Go Instant Stain Remover")
                    .subtitle("Eliminate some of your toughest fresh food and drink stains on the go.")
                    .images([
                        //Using this image: http://imgur.com/a/vl59A
                        builder.CardImage.create(session, "http://istudio.pgpro.com/di/prod/1E7853C4-7481-43A7-9D3D-04FF3C8E5CBC/s/320x209/jq/90/o/th.jpg")
                    ])
                    .buttons([
                        builder.CardAction.openUrl(session, "http://pgpro.com/brands/tide/tide-to-go-instant-stain-remover/", "Buy online")
                    ]);
        }
    }
};