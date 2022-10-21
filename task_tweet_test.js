import { createLogger, format, transports } from "winston";
// import * as fs from "fs";
// import Twit from "twit";
// import { Client, auth } from "twitter-api-sdk";
import { TwitterApi } from 'twitter-api-v2';
import dotenv from "dotenv";

dotenv.config();

export async function tweet_test() {

	// Prepare the logger
	const logLevels = {
	  fatal: 0,
	  error: 1,
	  warn: 2,
	  info: 3,
	  debug: 4,
	  trace: 5,
	};

	const logLevel = "trace"

	const logger = createLogger({
		level: logLevel,
	  levels: logLevels,
	  format: format.combine(format.timestamp(), format.json()),
	  transports: [
	  	new transports.Console(),
	  	new transports.File({ filename: `logs/task_tweet_test.log` })
	  ],
	});

	logger.info('***** RUN SCRIPT ****');
	console.log("Log level is", logLevel)
	logger.info('Log level is '+logLevel);

	// MAIN
	async function main() {

    const userClient = new TwitterApi({
		  appKey: process.env.CONSUMER_KEY,
		  appSecret: process.env.CONSUMER_SECRET,
		  // Following access tokens are not required if you are
		  // at part 1 of user-auth process (ask for a request token)
		  // or if you want a app-only client (see below)
		  accessToken: process.env.ACCESS_TOKEN,
		  accessSecret: process.env.ACCESS_TOKEN_SECRET,
		});
		const rwClient = userClient.readWrite

		tweet(rwClient, "Salut la Terre !")
				
		return {success:true, msg:`Task succesful: tweet test.`}

		async function tweet(rwClient, text){
			try {
				// https://github.com/PLhery/node-twitter-api-v2/blob/master/doc/v2.md#Createatweet
				const result = await rwClient.v2.tweet(text)
				console.log(result)
				logger
					.child({ context: {result} })
					.info('The bot tweeted successfully.');
			} catch (error) {
				logger
					.child({ context: {error} })
					.error('ERROR: Could not tweet.');
			}
		}

	}

	return main();
}

// Command line arguments
// Auto mode (run the script)
if (process.argv.some(d => ["a","-a","auto","-auto"].includes(d))) {
	tweet_test()
}