import { getLogger } from "./-get-logger.js"
import { TwitterApi } from 'twitter-api-v2';
import * as fs from "fs";
import dotenv from "dotenv";
import { prepare_twitter_carto } from "./prepare_twitter_carto.js";

dotenv.config();

// Logger
const logger = getLogger(`logs/task_tweet_daily_carto.log`)
logger.level = "trace"
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

		let result
		try {
			// Upload media
			const mediaIds = await Promise.all([
			  // file path
			  rwClient.v1.uploadMedia(dailyCartoFile),
			  // Note: add media if needed
			]);

			// https://github.com/PLhery/node-twitter-api-v2/blob/master/doc/v2.md#Createatweet
			result = await rwClient.v2.tweet({text:"", media:{media_ids: mediaIds}})
			logger
				.child({ context: {result} })
				.info('The bot tweeted successfully.');
		} catch (error) {
			logger
				.child({ context: {error} })
				.error('ERROR: Could not tweet.');
			return {success:false, msg:`Task failed: tweet daily carto.`}
		}
		
		// Save result as JSON next to the daily carto File
		const resultFile = dailyCartoFile.substring(0, dailyCartoFile.lastIndexOf(".")) + "-result.json"
  	const resultString = JSON.stringify(result)
		try {
			fs.writeFileSync(resultFile, resultString)
			logger
				.child({ context: {id, resultFile} })
				.debug('Daily carto result file saved successfully.');
		} catch(error) {
			logger
				.child({ context: {id, resultFile, error} })
				.error(`The daily carto result file could not be saved.`);
		}

		return {success:true, msg:`Task succesful: tweet daily carto.`}
	}

}

main();
