# Laundrobot #

A bot that helps you with your laundry, showing care instructions and recommending detergents to use.

## Installation and usage ##

Download this repository and `cd` into the folder you downloaded it in.

Run the following:

`npm install`

You will need to fill in the credentials around the codebase, primarily credentials for:
1. Azure SQL Database
2. Microsoft Bot Framework
3. LUIS key (you can import the JSON LUIS model provided in the codebase to speed things up)
4. Power BI

Once you've filled in all the credentials, run:

`npm start`

Download and start the [Bot Framework emulator](https://emulator.botframework.com). Type `http://localhost:3978/api/messages' and start sending it messages. 

