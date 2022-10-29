import { getLogger } from "./-get-logger.js"
import * as fs from "fs";
import { createCanvas, loadImage, ImageData } from "canvas"
import dotenv from "dotenv";

dotenv.config();

export async function test(date) {

	const targetDate = ((date === undefined)?(new Date() /*Now*/):(new Date(date)))
	const year = targetDate.getFullYear()
	const month = (1+targetDate.getMonth()).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping: false})
	const datem = (targetDate.getDate()).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping: false})

	const logger = getLogger(`TEMP_TEST.log`)
	logger.level = "trace"

	logger.fatal(`Test message fatal`);
	logger.error(`Test message error`);
	logger.warn(`Test message warn`);
	logger.info(`Test message info`);
	logger.debug(`Test message debug`);
	logger.trace(`Test message trace`);

	// MAIN
	async function main() {
	}

	return main();
}
test()