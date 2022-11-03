import { getLogger } from "./-get-logger.js"
import { TwitterApi } from 'twitter-api-v2';
import * as d3 from 'd3';
import * as fs from "fs";
import dotenv from "dotenv";
import { prepare_twitter_carto } from "./prepare_twitter_carto.js";
import { prepare_key_resources } from "./prepare_key_resources.js";

dotenv.config();

// Logger
const logger = getLogger(`logs/task_tweet_daily_carto.log`)
logger.level = "trace"
logger.info('***** RUN SCRIPT ****');

// MAIN
async function main() {
	let keyResourcesJpgFile, keyResourcesCsvFile

	prepare_key_resources()
		.then(result => {
			if (result.success) {
				keyResourcesJpgFile = result.jpgFile
				keyResourcesCsvFile = result.csvFile
				logger
					.child({ context: {result} })
					.info(`Key resources prepared at ${result.jpgFile} and ${result.csvFile}.`);
			} else {
				logger
					.child({ context: {result} })
					.error('Key resources preparation FAILED (invalid result).');
			}
		}, error => {
			logger
				.child({ context: {error} })
				.error('Key resources preparation FAILED (error).');
		})

		.then(() => {
			if (keyResourcesJpgFile && keyResourcesCsvFile) {
				if (fs.existsSync(keyResourcesJpgFile) && fs.existsSync(keyResourcesCsvFile)) {
					return tweetDailyThread(keyResourcesJpgFile, keyResourcesCsvFile)
				} else {
					logger
						.error('Could not tweet because at least one of the key resources paths is invalid (no existing file).');
				}
			} else {
				logger
					.error('Could not tweet because the key resources are missing (or one of the 2 files).');
			}
		})

	async function tweetDailyThread(keyResourcesJpgFile, keyResourcesCsvFile){
		/// Build the tweets
		let targetDate = new Date() // Today
		targetDate.setDate(targetDate.getDate() - 1); // Yesterday
		const yyear = targetDate.getFullYear()
		const ymonth = (1+targetDate.getMonth()).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping: false})
		const ydatem = (targetDate.getDate()).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping: false})
		let keyResourcesMessage = `Ressource la + échangée dans sa zone du débat le ${yyear}-${ymonth}-${ydatem}:\n`
		// Load key resources file
		let keyResourcesList
		try {
			const csvString = fs.readFileSync(keyResourcesCsvFile, "utf8")
			keyResourcesList = d3.csvParse(csvString);
			logger
				.child({ context: {keyResourcesCsvFile} })
				.info('CSV file loaded');
		} catch (error) {
			logger
				.child({ context: {keyResourcesCsvFile, error:error.message} })
				.error('The CSV file could not be loaded: '+keyResourcesCsvFile);
			return
		}
		// Build key resources messages
		keyResourcesMessage += keyResourcesList.map(res => {
			return `${res.rank}. ${res.url}`
		}).join("\n")

		/// Tweet!
		const userClient = new TwitterApi({
		  appKey: process.env.CONSUMER_KEY,
		  appSecret: process.env.CONSUMER_SECRET,
		  accessToken: process.env.ACCESS_TOKEN,
		  accessSecret: process.env.ACCESS_TOKEN_SECRET,
		});
		const rwClient = userClient.readWrite

		let result
		try {
			// Upload media for daily carto
			const mediaIds = await Promise.all([
			  rwClient.v1.uploadMedia(keyResourcesJpgFile),
			  // Note: add media if needed
			]);

			// https://github.com/plhery/node-twitter-api-v2/blob/master/doc/v2.md#Postathreadoftweets
			result = await rwClient.v2.tweet({text:keyResourcesMessage, media:{media_ids: mediaIds}})
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
		const resultFile = keyResourcesCsvFile.substring(0, keyResourcesCsvFile.lastIndexOf(".")) + "-result.json"
  	const resultString = JSON.stringify(result)
		try {
			fs.writeFileSync(resultFile, resultString)
			logger
				.child({ context: {resultFile} })
				.debug('Key resources result file saved successfully.');
		} catch(error) {
			logger
				.child({ context: {resultFile, error} })
				.error(`The key resources result file could not be saved.`);
		}

		return {success:true, msg:`Task succesful: tweet daily thread.`}
	}
}

main();
