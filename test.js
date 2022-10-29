import { getLogger } from "./-get-logger.js"
import { prepare_twitter_carto } from "./prepare_twitter_carto.js";
import * as fs from "fs";
import dotenv from "dotenv";

dotenv.config();

// Logger
const logger = getLogger(`logs/test.log`)
logger.level = "trace"
logger.info('***** RUN SCRIPT ****');

// MAIN
async function main() {
	let dailyCartoFile

	// Prepare carto
	prepare_twitter_carto("2022-10-26")
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
}

main();
