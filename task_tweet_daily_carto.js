import { createLogger, format, transports } from "winston";
// import * as fs from "fs";
import { TwitterApi } from 'twitter-api-v2';
import * as fs from "fs";
import dotenv from "dotenv";
import { prepare_twitter_carto } from "./prepare_twitter_carto.js";

dotenv.config();


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
  	new transports.File({ filename: `logs/task_tweet_daily_carto.log` })
  ],
});
logger.on('error', function (err) { console.log("Logger error :(") });

logger.info('***** RUN SCRIPT ****');

// MAIN
async function main() {
	let dailyCartoFile

	// Prepare carto
	prepare_twitter_carto()
		.then(result => {
			if (result.success) {
				logger
					.child({ context: {result} })
					.info(`Daily carto prepared at ${result.file}.`);
				dailyCartoFile = result.file
			} else {
				logger
					.child({ context: {result} })
					.error('Daily carto preparation FAILED (invalid result).');
			}
		}, error => {
			logger
				.child({ context: {error} })
				.error('Daily carto preparation FAILED (error).');
		})

		.then(() => {
			if (dailyCartoFile) {
				if (fs.existsSync(dailyCartoFile)) {
					return tweetCarto(dailyCartoFile)
				} else {
					logger
						.error('Could not tweet because the image path is invalid (no existing file).');
				}
			} else {
				logger
					.error('Could not tweet because the image is missing.');
			}
		})

	async function tweetCarto(dailyCartoFile){
		// Tweet!
		const userClient = new TwitterApi({
		  appKey: process.env.CONSUMER_KEY,
		  appSecret: process.env.CONSUMER_SECRET,
		  accessToken: process.env.ACCESS_TOKEN,
		  accessSecret: process.env.ACCESS_TOKEN_SECRET,
		});
		const rwClient = userClient.readWrite

		try {
			// Upload media
			const mediaIds = await Promise.all([
			  // file path
			  rwClient.v1.uploadMedia(dailyCartoFile),
			  // Note: add media if needed
			]);

			// https://github.com/PLhery/node-twitter-api-v2/blob/master/doc/v2.md#Createatweet
			const result = await rwClient.v2.tweet({text:"", media:{media_ids: mediaIds}})
			logger
				.child({ context: {result} })
				.info('The bot tweeted successfully.');
		} catch (error) {
			logger
				.child({ context: {error} })
				.error('ERROR: Could not tweet.');
		}
				
		return {success:true, msg:`Task succesful: tweet test.`}
	}

}

main();
